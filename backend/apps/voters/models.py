"""
Voter Models for E-Voting System

This module defines the database models for:
- Voter profiles
- Biometric data
- Authentication logs
"""

from django.db import models
from django.contrib.auth.models import User, AbstractUser
from django.core.validators import RegexValidator
import hashlib
import base64
from django.conf import settings

class VoterProfile(models.Model):
    """Extended profile for voters"""
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='voter_profile')
    
    # Personal information
    national_id = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[A-Za-z0-9\-_]+$',
                message='National ID can only contain letters, numbers, hyphens, and underscores'
            )
        ]
    )
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Address information
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='United States')
    
    # Verification status
    is_verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='verified_voters', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Voting preferences
    preferred_language = models.CharField(max_length=10, default='en')
    accessibility_needs = models.JSONField(default=list, blank=True)
    
    # Security settings
    two_fa_enabled = models.BooleanField(default=False)
    two_fa_secret = models.CharField(max_length=32, blank=True)
    biometric_enabled = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['national_id']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['user', 'is_verified']),
        ]
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    @property
    def full_name(self):
        """Get full name of voter"""
        return f"{self.user.first_name} {self.user.last_name}".strip()
    
    def verify(self, verified_by_user):
        """Mark voter as verified"""
        self.is_verified = True
        self.verification_date = timezone.now()
        self.verified_by = verified_by_user
        self.save()
    
    def enable_2fa(self, secret):
        """Enable 2FA for voter"""
        self.two_fa_enabled = True
        self.two_fa_secret = secret
        self.save()
    
    def disable_2fa(self):
        """Disable 2FA for voter"""
        self.two_fa_enabled = False
        self.two_fa_secret = ''
        self.save()

class BiometricData(models.Model):
    """Model for storing biometric data"""
    
    BIOMETRIC_TYPES = [
        ('face', 'Face Recognition'),
        ('fingerprint', 'Fingerprint'),
        ('voice', 'Voice Recognition'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    biometric_type = models.CharField(max_length=20, choices=BIOMETRIC_TYPES)
    
    # Encrypted biometric data
    encrypted_data = models.BinaryField()
    data_hash = models.CharField(max_length=64)  # SHA-256 hash of original data
    
    # Azure Face API data (for face recognition)
    face_id = models.CharField(max_length=100, blank=True, null=True)
    face_features = models.JSONField(default=dict, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'biometric_type']
        indexes = [
            models.Index(fields=['user', 'biometric_type']),
            models.Index(fields=['face_id']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.biometric_type} data for {self.user.username}"
    
    def set_encrypted_data(self, data):
        """Set encrypted biometric data"""
        self.encrypted_data = data
        self.data_hash = hashlib.sha256(data).hexdigest()
        self.save()
    
    def verify_data_hash(self, original_data):
        """Verify that original data matches stored hash"""
        return self.data_hash == hashlib.sha256(original_data).hexdigest()

class AuthenticationLog(models.Model):
    """Model for storing authentication attempts"""
    
    AUTH_METHODS = [
        ('password', 'Password'),
        ('face', 'Face Recognition'),
        ('fingerprint', 'Fingerprint'),
        ('2fa', 'Two-Factor Authentication'),
        ('token', 'Token'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('blocked', 'Blocked'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='auth_logs')
    auth_method = models.CharField(max_length=20, choices=AUTH_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    # Request details
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    
    # Error details (for failed attempts)
    error_message = models.TextField(blank=True)
    failure_reason = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['auth_method', 'status']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.auth_method} {self.status} for {self.user.username} at {self.timestamp}"

class VoterEligibility(models.Model):
    """Model for tracking voter eligibility for elections"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='eligibility_records')
    election = models.ForeignKey('elections.Election', on_delete=models.CASCADE, related_name='eligible_voters')
    
    # Eligibility status
    is_eligible = models.BooleanField(default=False)
    reason = models.TextField(blank=True, null=True)
    
    # Verification
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='verified_eligibility', on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.election.title}"

class VoterSession(models.Model):
    """Model for tracking active voter sessions"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    
    # Session details
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    last_activity = models.DateTimeField(auto_now=True)
    
    # Authentication status
    face_verified = models.BooleanField(default=False)
    fingerprint_verified = models.BooleanField(default=False)
    two_fa_verified = models.BooleanField(default=False)
    
    # Current election context
    current_election = models.ForeignKey(
        'elections.Election', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'session_key']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Session for {self.user.username} ({self.session_key[:8]}...)"
    
    @property
    def is_active(self):
        """Check if session is still active"""
        return timezone.now() < self.expires_at
    
    @property
    def is_fully_authenticated(self):
        """Check if user has completed all required authentication steps"""
        return (self.face_verified and 
                self.fingerprint_verified and 
                self.two_fa_verified)
    
    def extend_session(self, hours=1):
        """Extend session expiration time"""
        self.expires_at = timezone.now() + timezone.timedelta(hours=hours)
        self.save()
    
    def mark_face_verified(self):
        """Mark face verification as complete"""
        self.face_verified = True
        self.save()
    
    def mark_fingerprint_verified(self):
        """Mark fingerprint verification as complete"""
        self.fingerprint_verified = True
        self.save()
    
    def mark_2fa_verified(self):
        """Mark 2FA verification as complete"""
        self.two_fa_verified = True
        self.save()

class Voter(AbstractUser):
    # Add a field to store the user's blockchain address
    blockchain_address = models.CharField(max_length=42, blank=True, null=True)
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='voter_set',  # Unique related_name
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_query_name='voter',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='voter_set',  # Unique related_name
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='voter',
    )

    def __str__(self):
        return self.username 