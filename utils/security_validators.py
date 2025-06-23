"""
Enhanced Security Validators for E-Voting System

This module provides advanced validation and security checks for:
- Vote integrity and fraud detection
- Election security validation
- Biometric data validation
- Blockchain transaction verification
- Rate limiting and abuse prevention
"""

import re
import hashlib
import json
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from typing import Dict, List, Any, Optional, Tuple

class VoteSecurityValidator:
    """Advanced vote validation and fraud detection"""
    
    def __init__(self):
        self.suspicious_patterns = [
            'bot', 'script', 'automated', 'test',
            'admin', 'root', 'system', 'guest'
        ]
    
    def validate_vote_integrity(self, vote_data: Dict[str, Any], election_id: int) -> Tuple[bool, str]:
        """
        Comprehensive vote integrity validation
        
        Args:
            vote_data: Vote data to validate
            election_id: Election ID
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check required fields
            required_fields = ['encrypted_data', 'nonce', 'timestamp', 'voter_signature']
            for field in required_fields:
                if field not in vote_data:
                    return False, f"Missing required field: {field}"
            
            # Validate timestamp
            vote_timestamp = datetime.fromisoformat(vote_data['timestamp'])
            if vote_timestamp > timezone.now():
                return False, "Vote timestamp cannot be in the future"
            
            # Check for duplicate votes
            if self._is_duplicate_vote(vote_data, election_id):
                return False, "Duplicate vote detected"
            
            # Validate vote signature
            if not self._verify_vote_signature(vote_data):
                return False, "Invalid vote signature"
            
            # Check for suspicious patterns
            if self._contains_suspicious_patterns(vote_data):
                return False, "Suspicious vote pattern detected"
            
            # Validate vote format
            if not self._validate_vote_format(vote_data):
                return False, "Invalid vote format"
            
            return True, "Vote is valid"
            
        except Exception as e:
            return False, f"Vote validation error: {str(e)}"
    
    def _is_duplicate_vote(self, vote_data: Dict[str, Any], election_id: int) -> bool:
        """Check for duplicate votes"""
        vote_hash = hashlib.sha256(
            json.dumps(vote_data, sort_keys=True).encode()
        ).hexdigest()
        
        cache_key = f"vote_hash:{election_id}:{vote_hash}"
        if cache.get(cache_key):
            return True
        
        # Store vote hash for future checks
        cache.set(cache_key, True, timeout=3600)  # 1 hour
        return False
    
    def _verify_vote_signature(self, vote_data: Dict[str, Any]) -> bool:
        """Verify vote signature"""
        # In production, implement proper cryptographic signature verification
        # For now, check if signature exists and has proper format
        signature = vote_data.get('voter_signature', '')
        return len(signature) >= 64 and signature.isalnum()
    
    def _contains_suspicious_patterns(self, vote_data: Dict[str, Any]) -> bool:
        """Check for suspicious patterns in vote data"""
        vote_str = json.dumps(vote_data).lower()
        return any(pattern in vote_str for pattern in self.suspicious_patterns)
    
    def _validate_vote_format(self, vote_data: Dict[str, Any]) -> bool:
        """Validate vote data format"""
        try:
            # Check encrypted data format
            encrypted_data = vote_data.get('encrypted_data', '')
            if not isinstance(encrypted_data, str) or len(encrypted_data) < 100:
                return False
            
            # Check nonce format
            nonce = vote_data.get('nonce', '')
            if not isinstance(nonce, str) or len(nonce) < 32:
                return False
            
            return True
        except:
            return False

class ElectionSecurityValidator:
    """Election security validation"""
    
    def validate_election_security(self, election_data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate election security settings
        
        Args:
            election_data: Election configuration
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check encryption settings
            if not self._validate_encryption_settings(election_data):
                return False, "Invalid encryption settings"
            
            # Check authentication requirements
            if not self._validate_auth_requirements(election_data):
                return False, "Invalid authentication requirements"
            
            # Check timing settings
            if not self._validate_timing_settings(election_data):
                return False, "Invalid timing settings"
            
            # Check access control
            if not self._validate_access_control(election_data):
                return False, "Invalid access control settings"
            
            return True, "Election security is valid"
            
        except Exception as e:
            return False, f"Election security validation error: {str(e)}"
    
    def _validate_encryption_settings(self, election_data: Dict[str, Any]) -> bool:
        """Validate encryption configuration"""
        # Check if encryption is enabled
        if not election_data.get('encryption_enabled', True):
            return False
        
        # Check key size
        key_size = election_data.get('encryption_key_size', 2048)
        if key_size < 1024:
            return False
        
        # Check threshold settings
        threshold = election_data.get('decryption_threshold', 3)
        total_trustees = election_data.get('total_trustees', 5)
        if threshold > total_trustees:
            return False
        
        return True
    
    def _validate_auth_requirements(self, election_data: Dict[str, Any]) -> bool:
        """Validate authentication requirements"""
        # At least one authentication method must be required
        auth_methods = [
            election_data.get('require_2fa', False),
            election_data.get('require_biometric', False),
            election_data.get('require_photo_id', False)
        ]
        
        return any(auth_methods)
    
    def _validate_timing_settings(self, election_data: Dict[str, Any]) -> bool:
        """Validate election timing"""
        start_date = election_data.get('start_date')
        end_date = election_data.get('end_date')
        
        if not start_date or not end_date:
            return False
        
        if start_date >= end_date:
            return False
        
        # Election must last at least 1 hour
        duration = end_date - start_date
        if duration < timedelta(hours=1):
            return False
        
        return True
    
    def _validate_access_control(self, election_data: Dict[str, Any]) -> bool:
        """Validate access control settings"""
        # Check voter registration
        if election_data.get('voter_registration_required', True):
            # Must have registration deadline
            if not election_data.get('registration_deadline'):
                return False
        
        return True

class BiometricSecurityValidator:
    """Biometric data security validation"""
    
    def validate_face_data(self, face_data: bytes) -> Tuple[bool, str]:
        """
        Validate face recognition data
        
        Args:
            face_data: Face image data
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check data size
            if len(face_data) < 1000:
                return False, "Face data too small"
            
            if len(face_data) > 10 * 1024 * 1024:  # 10MB
                return False, "Face data too large"
            
            # Check for valid image format
            if not self._is_valid_image_format(face_data):
                return False, "Invalid image format"
            
            # Check for multiple faces (potential fraud)
            if self._detect_multiple_faces(face_data):
                return False, "Multiple faces detected"
            
            # Check image quality
            if not self._check_image_quality(face_data):
                return False, "Image quality too low"
            
            return True, "Face data is valid"
            
        except Exception as e:
            return False, f"Face validation error: {str(e)}"
    
    def validate_fingerprint_data(self, fingerprint_data: bytes) -> Tuple[bool, str]:
        """
        Validate fingerprint data
        
        Args:
            fingerprint_data: Fingerprint data
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check data size
            if len(fingerprint_data) < 500:
                return False, "Fingerprint data too small"
            
            if len(fingerprint_data) > 5 * 1024 * 1024:  # 5MB
                return False, "Fingerprint data too large"
            
            # Check for valid fingerprint format
            if not self._is_valid_fingerprint_format(fingerprint_data):
                return False, "Invalid fingerprint format"
            
            return True, "Fingerprint data is valid"
            
        except Exception as e:
            return False, f"Fingerprint validation error: {str(e)}"
    
    def _is_valid_image_format(self, image_data: bytes) -> bool:
        """Check if image data is in valid format"""
        # Check for common image headers
        valid_headers = [
            b'\xff\xd8\xff',  # JPEG
            b'\x89PNG\r\n\x1a\n',  # PNG
            b'GIF87a',  # GIF
            b'GIF89a',  # GIF
        ]
        
        return any(image_data.startswith(header) for header in valid_headers)
    
    def _detect_multiple_faces(self, image_data: bytes) -> bool:
        """Detect multiple faces in image (simplified)"""
        # In production, use Azure Face API to detect multiple faces
        # For now, return False (assume single face)
        return False
    
    def _check_image_quality(self, image_data: bytes) -> bool:
        """Check image quality (simplified)"""
        # In production, implement image quality analysis
        # For now, check minimum size as quality indicator
        return len(image_data) > 5000
    
    def _is_valid_fingerprint_format(self, fingerprint_data: bytes) -> bool:
        """Check if fingerprint data is in valid format"""
        # In production, implement fingerprint format validation
        # For now, check minimum size
        return len(fingerprint_data) > 1000

class BlockchainSecurityValidator:
    """Blockchain transaction security validation"""
    
    def validate_transaction(self, tx_hash: str, election_id: int) -> Tuple[bool, str]:
        """
        Validate blockchain transaction
        
        Args:
            tx_hash: Transaction hash
            election_id: Election ID
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Validate transaction hash format
            if not self._is_valid_tx_hash(tx_hash):
                return False, "Invalid transaction hash format"
            
            # Check for duplicate transactions
            if self._is_duplicate_transaction(tx_hash, election_id):
                return False, "Duplicate transaction detected"
            
            # Validate transaction on blockchain
            if not self._verify_transaction_on_chain(tx_hash):
                return False, "Transaction not found on blockchain"
            
            return True, "Transaction is valid"
            
        except Exception as e:
            return False, f"Transaction validation error: {str(e)}"
    
    def _is_valid_tx_hash(self, tx_hash: str) -> bool:
        """Validate transaction hash format"""
        # Ethereum transaction hash format
        pattern = r'^0x[a-fA-F0-9]{64}$'
        return bool(re.match(pattern, tx_hash))
    
    def _is_duplicate_transaction(self, tx_hash: str, election_id: int) -> bool:
        """Check for duplicate transactions"""
        cache_key = f"tx_hash:{election_id}:{tx_hash}"
        if cache.get(cache_key):
            return True
        
        # Store transaction hash
        cache.set(cache_key, True, timeout=3600)
        return False
    
    def _verify_transaction_on_chain(self, tx_hash: str) -> bool:
        """Verify transaction exists on blockchain"""
        # In production, use Web3 to verify transaction
        # For now, return True (assume valid)
        return True

class RateLimitValidator:
    """Advanced rate limiting validation"""
    
    def __init__(self):
        self.limits = {
            'auth_attempts': {'requests': 5, 'window': 300},  # 5 per 5 minutes
            'vote_attempts': {'requests': 1, 'window': 3600},  # 1 per hour
            'api_requests': {'requests': 100, 'window': 3600},  # 100 per hour
            'file_uploads': {'requests': 10, 'window': 3600},  # 10 per hour
        }
    
    def check_rate_limit(self, user_id: int, action_type: str, ip_address: str) -> Tuple[bool, str]:
        """
        Check rate limit for user action
        
        Args:
            user_id: User ID
            action_type: Type of action
            ip_address: IP address
            
        Returns:
            Tuple of (allowed, error_message)
        """
        try:
            limit_config = self.limits.get(action_type)
            if not limit_config:
                return True, "No rate limit configured"
            
            # Check user-based rate limit
            user_key = f"rate_limit:{user_id}:{action_type}"
            if not self._check_limit(user_key, limit_config):
                return False, f"Rate limit exceeded for user"
            
            # Check IP-based rate limit
            ip_key = f"rate_limit_ip:{ip_address}:{action_type}"
            if not self._check_limit(ip_key, limit_config):
                return False, f"Rate limit exceeded for IP address"
            
            return True, "Rate limit check passed"
            
        except Exception as e:
            return False, f"Rate limit check error: {str(e)}"
    
    def _check_limit(self, key: str, limit_config: Dict[str, int]) -> bool:
        """Check if request is within rate limit"""
        current_time = int(timezone.now().timestamp())
        window = limit_config['window']
        max_requests = limit_config['requests']
        
        # Get current request count
        request_data = cache.get(key, {'count': 0, 'reset_time': current_time + window})
        
        # Check if window has expired
        if current_time > request_data['reset_time']:
            request_data = {'count': 0, 'reset_time': current_time + window}
        
        # Increment counter
        request_data['count'] += 1
        
        # Store updated data
        cache.set(key, request_data, window)
        
        # Check if limit exceeded
        return request_data['count'] <= max_requests

# Global validator instances
vote_validator = VoteSecurityValidator()
election_validator = ElectionSecurityValidator()
biometric_validator = BiometricSecurityValidator()
blockchain_validator = BlockchainSecurityValidator()
rate_limit_validator = RateLimitValidator() 