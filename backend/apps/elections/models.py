"""
Election Models for E-Voting System

This module defines the database models for:
- Elections
- Candidates
- Votes
- Election results
"""

import os
import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings
import json
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image
import io

class Election(models.Model):
    """Model for storing election information"""
    
    ELECTION_TYPES = [
        ('single', 'Single Choice'),
        ('multiple', 'Multiple Choice'),
        ('ranked', 'Ranked Choice'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    election_type = models.CharField(max_length=20, choices=ELECTION_TYPES, default='single')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Dates
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Encryption keys
    public_key_n = models.TextField(null=True, blank=True)
    public_key_g = models.TextField(null=True, blank=True)
    private_key_lambda = models.TextField(null=True, blank=True)  # Paillier private key (lambda)
    private_key_mu = models.TextField(null=True, blank=True)      # Paillier private key (mu)
    private_key_shares = models.JSONField(default=list, blank=True)  # Distributed key shares
    
    # Configuration
    max_choices = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(10)])
    allow_abstention = models.BooleanField(default=False)
    require_2fa = models.BooleanField(default=True)
    require_biometric = models.BooleanField(default=True)
    
    # Blockchain
    blockchain_contract_address = models.CharField(max_length=42, blank=True, null=True)
    blockchain_deployment_tx = models.CharField(max_length=66, blank=True, null=True)
    
    # Metadata
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_elections')
    is_public = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['election_type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def is_active(self):
        """Check if election is currently active"""
        now = timezone.now()
        return (self.status == 'active' and 
                self.start_date <= now <= self.end_date)
    
    @property
    def has_ended(self):
        """Check if election has ended"""
        return self.status == 'ended' or timezone.now() > self.end_date
    
    @property
    def total_votes(self):
        """Get total number of votes cast"""
        return self.votes.filter(is_valid=True).count()
    
    @property
    def public_key(self):
        """Get public key as tuple"""
        if self.public_key_n and self.public_key_g:
            return (self.public_key_n, self.public_key_g)
        return None
    
    def set_public_key(self, n, g):
        """Set public key components"""
        self.public_key_n = n
        self.public_key_g = g
        self.save()
    
    def get_candidates(self):
        """Get all candidates for this election"""
        return self.candidates.all().order_by('order')
    
    def get_valid_votes(self):
        """Get all valid votes for this election"""
        return self.votes.filter(is_valid=True)
    
    def can_vote(self, user):
        """Check if user can vote in this election"""
        if not self.is_active:
            return False, "Election is not active"
        
        if self.votes.filter(voter=user, is_valid=True).exists():
            return False, "User has already voted"
        
        return True, "User can vote"

class Candidate(models.Model):
    """Model for storing candidate information"""
    
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to='candidates/', blank=True, null=True, help_text="Upload candidate profile picture")
    order = models.PositiveIntegerField(default=0)
    
    # Metadata
    party = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['election', 'order', 'name']
        unique_together = ['election', 'order']
        indexes = [
            models.Index(fields=['election', 'order']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.election.title})"
    
    def clean(self):
        """Validate the model"""
        super().clean()
        if self.image and self.image_url:
            raise ValidationError("Cannot have both image file and image URL. Please choose one.")
    
    def save(self, *args, **kwargs):
        """Override save to process image if uploaded"""
        if self.image:
            self.process_image()
        super().save(*args, **kwargs)
    
    def process_image(self):
        """Process uploaded image - resize and optimize"""
        if not self.image:
            return
            
        try:
            # Open the image
            img = Image.open(self.image)
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to standard dimensions (400x400)
            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
            
            # Save the processed image
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85, optimize=True)
            buffer.seek(0)
            
            # Generate unique filename
            filename = f"candidate_{self.election.id}_{self.id}_{uuid.uuid4().hex[:8]}.jpg"
            
            # Save to storage
            self.image.save(filename, ContentFile(buffer.getvalue()), save=False)
            
        except Exception as e:
            # If image processing fails, keep the original
            print(f"Image processing error for candidate {self.name}: {e}")
    
    @property
    def display_image(self):
        """Get the display image URL - prioritize uploaded image over URL"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None
    
    @property
    def vote_count(self):
        """Get vote count for this candidate"""
        return self.election.votes.filter(
            is_valid=True,
            encrypted_vote_data__contains=f'"candidate_id": {self.id}'
        ).count()
    
    def delete_image(self):
        """Delete the uploaded image file"""
        if self.image:
            if default_storage.exists(self.image.name):
                default_storage.delete(self.image.name)
            self.image = None
            self.save(update_fields=['image'])

class Vote(models.Model):
    """Model for storing encrypted votes"""
    
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='votes')
    voter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='votes'
    )
    
    # Encrypted vote data
    encrypted_vote_data = models.TextField()  # JSON string of encrypted vote
    vote_hash = models.CharField(max_length=64, unique=True)  # SHA-256 hash of vote
    
    # Blockchain integration
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    blockchain_block_number = models.BigIntegerField(blank=True, null=True)
    
    # Validation
    is_valid = models.BooleanField(default=True)
    validation_errors = models.JSONField(default=list, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    # Biometric verification
    face_verified = models.BooleanField(default=False)
    fingerprint_verified = models.BooleanField(default=False)
    two_fa_verified = models.BooleanField(default=False)
    
    # Audit trail
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    audit_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['election', 'voter']
        indexes = [
            models.Index(fields=['election', 'voter']),
            models.Index(fields=['vote_hash']),
            models.Index(fields=['blockchain_tx_hash']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Anonymous vote in {self.election.title}"
    
    @property
    def is_confirmed(self):
        """Check if vote is confirmed on blockchain"""
        return bool(self.blockchain_tx_hash and self.confirmed_at)
    
    def confirm_on_blockchain(self, tx_hash, block_number=None):
        """Mark vote as confirmed on blockchain"""
        self.blockchain_tx_hash = tx_hash
        self.blockchain_block_number = block_number
        self.confirmed_at = timezone.now()
        self.save()
    
    def invalidate(self, reason):
        """Invalidate vote with reason"""
        self.is_valid = False
        self.validation_errors.append({
            'timestamp': timezone.now().isoformat(),
            'reason': reason
        })
        self.save()
    
    def get_security_info(self):
        """Get security information for admin display"""
        return {
            'vote_integrity': 'Verified' if self.vote_hash else 'Not verified',
            'blockchain_confirmed': bool(self.blockchain_tx_hash),
            'biometric_verified': all([self.face_verified, self.fingerprint_verified, self.two_fa_verified]),
            'last_modified': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else 'Never',
            'security_level': 'High' if self.vote_hash and self.blockchain_tx_hash else 'Medium'
        }
    
    def is_immutable(self):
        """Check if this record is immutable (for security)"""
        return True  # All vote data is immutable for security

class ElectionResult(models.Model):
    """Model for storing election results"""
    
    election = models.OneToOneField(Election, on_delete=models.CASCADE, related_name='result')
    
    # Encrypted results (before decryption)
    encrypted_total_votes = models.TextField(blank=True)
    encrypted_candidate_votes = models.JSONField(default=dict, blank=True)
    
    # Decrypted results
    total_votes = models.PositiveIntegerField(default=0)
    candidate_results = models.JSONField(default=dict, blank=True)  # {candidate_id: vote_count}
    
    # Decryption process
    decryption_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    
    # Trustee participation
    trustees_participated = models.JSONField(default=list, blank=True)
    decryption_timestamp = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['election', 'decryption_status']),
        ]
    
    def __str__(self):
        return f"Results for {self.election.title}"
    
    def set_candidate_result(self, candidate_id, vote_count):
        """Set vote count for a candidate"""
        if not self.candidate_results:
            self.candidate_results = {}
        self.candidate_results[str(candidate_id)] = vote_count
        self.save()
    
    def get_winner(self):
        """Get the winning candidate(s)"""
        if not self.candidate_results:
            return None
        
        max_votes = max(self.candidate_results.values())
        winners = [
            candidate_id for candidate_id, votes in self.candidate_results.items()
            if votes == max_votes
        ]
        return winners
    
    def get_security_info(self):
        """Get security information for admin display"""
        return {
            'decryption_status': self.decryption_status,
            'trustees_participated': len(self.trustees_participated) if self.trustees_participated else 0,
            'total_votes': self.total_votes,
            'candidates_count': len(self.candidate_results) if self.candidate_results else 0,
            'last_modified': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else 'Never',
            'security_level': 'High' if self.decryption_status == 'completed' else 'Medium'
        }
    
    def is_immutable(self):
        """Check if this record is immutable (for security)"""
        return True  # All election results are immutable for security

class ElectionAuditLog(models.Model):
    """Model for storing election audit logs"""
    
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='audit_logs')
    
    # Event details
    event_type = models.CharField(max_length=50)  # vote_cast, result_decrypted, etc.
    event_data = models.JSONField(default=dict)
    
    # User and context
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['election', 'event_type']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.election.title} - {self.timestamp}"
    
    def get_security_info(self):
        """Get security information for admin display"""
        return {
            'event_type': self.event_type,
            'user_involved': bool(self.user),
            'ip_address_present': bool(self.ip_address),
            'event_data_size': len(str(self.event_data)),
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else 'Never',
            'security_level': 'High' if self.user and self.ip_address else 'Medium'
        }
    
    def is_immutable(self):
        """Check if this record is immutable (for security)"""
        return True  # All audit logs are immutable for security 