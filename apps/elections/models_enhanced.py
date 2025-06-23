"""
Enhanced Election Models with Additional Security and Business Logic
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
from django.core.exceptions import ValidationError
import hashlib
import json
from datetime import timedelta

class ElectionCategory(models.Model):
    """Categories for organizing elections"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#007bff')  # Hex color
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Election Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Election(models.Model):
    """Enhanced Election model with additional security and business logic"""
    
    ELECTION_TYPES = [
        ('single', 'Single Choice'),
        ('multiple', 'Multiple Choice'),
        ('ranked', 'Ranked Choice'),
        ('approval', 'Approval Voting'),
        ('stv', 'Single Transferable Vote'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
        ('results_published', 'Results Published'),
    ]
    
    # Basic Information
    title = models.CharField(
        max_length=200,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9\s\-_.,!?()]+$',
                message='Title can only contain letters, numbers, spaces, and basic punctuation'
            )
        ]
    )
    description = models.TextField()
    category = models.ForeignKey(ElectionCategory, on_delete=models.PROTECT, null=True, blank=True)
    election_type = models.CharField(max_length=20, choices=ELECTION_TYPES, default='single')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Dates and Timing
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    registration_deadline = models.DateTimeField(null=True, blank=True)
    results_publication_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Security and Encryption
    public_key_n = models.BigIntegerField(null=True, blank=True)
    public_key_g = models.BigIntegerField(null=True, blank=True)
    private_key_shares = models.JSONField(default=list, blank=True)
    encryption_version = models.CharField(max_length=10, default='1.0')
    
    # Configuration
    max_choices = models.PositiveIntegerField(
        default=1, 
        validators=[MinValueValidator(1), MaxValueValidator(20)]
    )
    min_choices = models.PositiveIntegerField(default=1)
    allow_abstention = models.BooleanField(default=False)
    require_2fa = models.BooleanField(default=True)
    require_biometric = models.BooleanField(default=True)
    require_photo_id = models.BooleanField(default=False)
    
    # Eligibility and Access
    eligible_voters_count = models.PositiveIntegerField(default=0)
    voter_registration_required = models.BooleanField(default=True)
    allow_early_voting = models.BooleanField(default=False)
    early_voting_start = models.DateTimeField(null=True, blank=True)
    
    # Blockchain Integration
    blockchain_contract_address = models.CharField(max_length=42, blank=True, null=True)
    blockchain_deployment_tx = models.CharField(max_length=66, blank=True, null=True)
    blockchain_network = models.CharField(max_length=20, default='local')
    
    # Audit and Compliance
    audit_enabled = models.BooleanField(default=True)
    compliance_requirements = models.JSONField(default=dict, blank=True)
    legal_framework = models.CharField(max_length=100, blank=True)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_elections')
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_elections'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    is_public = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Hash for integrity
    content_hash = models.CharField(max_length=64, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['election_type', 'status']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def clean(self):
        """Custom validation"""
        if self.start_date and self.end_date:
            if self.start_date >= self.end_date:
                raise ValidationError("End date must be after start date")
            
            if self.start_date < timezone.now() and self.status == 'draft':
                raise ValidationError("Cannot create election with past start date")
        
        if self.registration_deadline and self.start_date:
            if self.registration_deadline >= self.start_date:
                raise ValidationError("Registration deadline must be before election start")
        
        if self.early_voting_start and self.start_date:
            if self.early_voting_start >= self.start_date:
                raise ValidationError("Early voting must start before election")
    
    def save(self, *args, **kwargs):
        """Override save to calculate content hash"""
        self.clean()
        self.content_hash = self.calculate_content_hash()
        super().save(*args, **kwargs)
    
    def calculate_content_hash(self):
        """Calculate hash of election content for integrity"""
        content = {
            'title': self.title,
            'description': self.description,
            'election_type': self.election_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'max_choices': self.max_choices,
            'created_by': self.created_by.id if self.created_by else None,
        }
        return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()
    
    @property
    def is_active(self):
        """Check if election is currently active"""
        now = timezone.now()
        return (self.status == 'active' and 
                self.start_date <= now <= self.end_date)
    
    @property
    def is_early_voting_active(self):
        """Check if early voting is active"""
        if not self.allow_early_voting or not self.early_voting_start:
            return False
        now = timezone.now()
        return (self.status == 'active' and 
                self.early_voting_start <= now <= self.end_date)
    
    @property
    def has_ended(self):
        """Check if election has ended"""
        return self.status in ['ended', 'results_published'] or timezone.now() > self.end_date
    
    @property
    def total_votes(self):
        """Get total number of valid votes cast"""
        return self.votes.filter(is_valid=True).count()
    
    @property
    def voter_turnout(self):
        """Calculate voter turnout percentage"""
        if self.eligible_voters_count == 0:
            return 0
        return (self.total_votes / self.eligible_voters_count) * 100
    
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
    
    def approve(self, approved_by_user):
        """Approve election for activation"""
        if self.status != 'pending_approval':
            raise ValidationError("Only pending elections can be approved")
        
        self.status = 'approved'
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        self.save()
    
    def activate(self):
        """Activate election for voting"""
        if self.status != 'approved':
            raise ValidationError("Only approved elections can be activated")
        
        if timezone.now() < self.start_date:
            raise ValidationError("Cannot activate election before start date")
        
        self.status = 'active'
        self.save()
    
    def pause(self):
        """Pause active election"""
        if self.status != 'active':
            raise ValidationError("Only active elections can be paused")
        
        self.status = 'paused'
        self.save()
    
    def resume(self):
        """Resume paused election"""
        if self.status != 'paused':
            raise ValidationError("Only paused elections can be resumed")
        
        if timezone.now() > self.end_date:
            raise ValidationError("Cannot resume election after end date")
        
        self.status = 'active'
        self.save()
    
    def end(self):
        """End election"""
        if self.status not in ['active', 'paused']:
            raise ValidationError("Only active or paused elections can be ended")
        
        self.status = 'ended'
        self.save()
    
    def publish_results(self):
        """Publish election results"""
        if self.status != 'ended':
            raise ValidationError("Only ended elections can have results published")
        
        self.status = 'results_published'
        self.results_publication_date = timezone.now()
        self.save()
    
    def can_vote(self, user):
        """Check if user can vote in this election"""
        if not self.is_active and not self.is_early_voting_active:
            return False, "Election is not active"
        
        if self.voter_registration_required:
            # Check if user is registered for this election
            if not hasattr(user, 'voter_profile') or not user.voter_profile.is_verified:
                return False, "Voter registration required"
        
        if self.votes.filter(voter=user, is_valid=True).exists():
            return False, "User has already voted"
        
        return True, "User can vote"
    
    def get_candidates(self):
        """Get all candidates for this election"""
        return self.candidates.all().order_by('order')
    
    def get_valid_votes(self):
        """Get all valid votes for this election"""
        return self.votes.filter(is_valid=True)
    
    def get_audit_logs(self):
        """Get audit logs for this election"""
        return self.audit_logs.all().order_by('-timestamp')

class Candidate(models.Model):
    """Enhanced Candidate model"""
    
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(
        max_length=100,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z\s\-_.,]+$',
                message='Name can only contain letters, spaces, and basic punctuation'
            )
        ]
    )
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    
    # Additional Information
    party = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    experience = models.TextField(blank=True)
    qualifications = models.TextField(blank=True)
    manifesto = models.TextField(blank=True)
    
    # Contact Information
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    social_media = models.JSONField(default=dict, blank=True)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='verified_candidates'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['election', 'order', 'name']
        unique_together = ['election', 'order']
        indexes = [
            models.Index(fields=['election', 'order']),
            models.Index(fields=['is_verified']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.election.title})"
    
    @property
    def vote_count(self):
        """Get vote count for this candidate"""
        return self.election.votes.filter(
            is_valid=True,
            encrypted_vote_data__contains=f'"candidate_id": {self.id}'
        ).count()
    
    def verify(self, verified_by_user):
        """Mark candidate as verified"""
        self.is_verified = True
        self.verified_by = verified_by_user
        self.verified_at = timezone.now()
        self.save() 