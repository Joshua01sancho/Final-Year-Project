"""
Rate Limiting Middleware for E-Voting System

This middleware implements rate limiting to prevent abuse and ensure fair usage.
"""

import time
import hashlib
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from rest_framework import status

class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware with different limits for different endpoints
    """
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        
        # Define rate limits for different endpoints
        self.rate_limits = {
            # Authentication endpoints
            '/api/auth/login': {'requests': 5, 'window': 300},  # 5 requests per 5 minutes
            '/api/auth/face-login': {'requests': 3, 'window': 300},  # 3 requests per 5 minutes
            '/api/auth/fingerprint-login': {'requests': 3, 'window': 300},  # 3 requests per 5 minutes
            '/api/auth/2fa': {'requests': 10, 'window': 300},  # 10 requests per 5 minutes
            
            # Voting endpoints
            '/api/votes/': {'requests': 1, 'window': 3600},  # 1 vote per hour per election
            '/api/elections/': {'requests': 100, 'window': 3600},  # 100 requests per hour
            
            # Admin endpoints
            '/api/admin/': {'requests': 50, 'window': 3600},  # 50 requests per hour
            
            # Default limits
            'default': {'requests': 100, 'window': 3600},  # 100 requests per hour
        }
    
    def process_request(self, request):
        """Check rate limits before processing request"""
        if request.method == 'GET':
            return None  # Don't rate limit GET requests for now
        
        # Get rate limit for this endpoint
        rate_limit = self._get_rate_limit(request.path)
        
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Check if client is rate limited
        if self._is_rate_limited(client_id, request.path, rate_limit):
            return self._rate_limit_response(request.path, rate_limit)
        
        return None
    
    def _get_rate_limit(self, path):
        """Get rate limit configuration for a path"""
        for endpoint, limit in self.rate_limits.items():
            if endpoint in path:
                return limit
        return self.rate_limits['default']
    
    def _get_client_id(self, request):
        """Get unique identifier for the client"""
        # Use IP address as primary identifier
        ip_address = self._get_client_ip(request)
        
        # Add user ID if authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = request.user.id
            return f"{ip_address}:{user_id}"
        
        return ip_address
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _is_rate_limited(self, client_id, path, rate_limit):
        """Check if client is rate limited"""
        current_time = int(time.time())
        window = rate_limit['window']
        max_requests = rate_limit['requests']
        
        # Create cache key
        cache_key = f"rate_limit:{client_id}:{path}"
        
        # Get current request count
        request_data = cache.get(cache_key, {'count': 0, 'reset_time': current_time + window})
        
        # Check if window has expired
        if current_time > request_data['reset_time']:
            # Reset counter
            request_data = {'count': 0, 'reset_time': current_time + window}
        
        # Increment counter
        request_data['count'] += 1
        
        # Store updated data
        cache.set(cache_key, request_data, window)
        
        # Check if limit exceeded
        return request_data['count'] > max_requests
    
    def _rate_limit_response(self, path, rate_limit):
        """Return rate limit exceeded response"""
        return JsonResponse({
            'error': 'Rate limit exceeded',
            'message': f'Too many requests. Limit: {rate_limit["requests"]} requests per {rate_limit["window"]} seconds',
            'retry_after': rate_limit['window']
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

class ElectionRateLimit:
    """Specialized rate limiting for election-specific operations"""
    
    @staticmethod
    def check_vote_rate_limit(user_id, election_id):
        """Check if user can vote in this election"""
        cache_key = f"vote_limit:{user_id}:{election_id}"
        
        # Check if user has already voted
        if cache.get(cache_key):
            return False, "You have already voted in this election"
        
        return True, None
    
    @staticmethod
    def set_vote_rate_limit(user_id, election_id, duration=3600):
        """Set rate limit after user votes"""
        cache_key = f"vote_limit:{user_id}:{election_id}"
        cache.set(cache_key, True, duration)
    
    @staticmethod
    def check_election_creation_limit(user_id):
        """Check if user can create a new election"""
        cache_key = f"election_creation:{user_id}"
        current_time = int(time.time())
        window = 3600  # 1 hour
        max_elections = 5  # 5 elections per hour
        
        request_data = cache.get(cache_key, {'count': 0, 'reset_time': current_time + window})
        
        if current_time > request_data['reset_time']:
            request_data = {'count': 0, 'reset_time': current_time + window}
        
        request_data['count'] += 1
        cache.set(cache_key, request_data, window)
        
        return request_data['count'] <= max_elections

class BiometricRateLimit:
    """Rate limiting for biometric authentication"""
    
    @staticmethod
    def check_face_login_limit(ip_address):
        """Check face login rate limit"""
        cache_key = f"face_login:{ip_address}"
        current_time = int(time.time())
        window = 300  # 5 minutes
        max_attempts = 3
        
        request_data = cache.get(cache_key, {'count': 0, 'reset_time': current_time + window})
        
        if current_time > request_data['reset_time']:
            request_data = {'count': 0, 'reset_time': current_time + window}
        
        request_data['count'] += 1
        cache.set(cache_key, request_data, window)
        
        return request_data['count'] <= max_attempts
    
    @staticmethod
    def check_fingerprint_login_limit(ip_address):
        """Check fingerprint login rate limit"""
        cache_key = f"fingerprint_login:{ip_address}"
        current_time = int(time.time())
        window = 300  # 5 minutes
        max_attempts = 3
        
        request_data = cache.get(cache_key, {'count': 0, 'reset_time': current_time + window})
        
        if current_time > request_data['reset_time']:
            request_data = {'count': 0, 'reset_time': current_time + window}
        
        request_data['count'] += 1
        cache.set(cache_key, request_data, window)
        
        return request_data['count'] <= max_attempts

class AdminRateLimit:
    """Rate limiting for admin operations"""
    
    @staticmethod
    def check_admin_action_limit(user_id, action_type):
        """Check admin action rate limit"""
        cache_key = f"admin_action:{user_id}:{action_type}"
        current_time = int(time.time())
        window = 3600  # 1 hour
        
        # Different limits for different actions
        limits = {
            'election_delete': 2,
            'user_delete': 5,
            'bulk_operation': 10,
            'default': 50
        }
        
        max_actions = limits.get(action_type, limits['default'])
        
        request_data = cache.get(cache_key, {'count': 0, 'reset_time': current_time + window})
        
        if current_time > request_data['reset_time']:
            request_data = {'count': 0, 'reset_time': current_time + window}
        
        request_data['count'] += 1
        cache.set(cache_key, request_data, window)
        
        return request_data['count'] <= max_actions

class RateLimitExemptions:
    """Handle rate limit exemptions for certain users or conditions"""
    
    @staticmethod
    def is_exempt_from_rate_limit(request):
        """Check if request is exempt from rate limiting"""
        # Superusers are exempt
        if hasattr(request, 'user') and request.user.is_superuser:
            return True
        
        # Staff users have higher limits
        if hasattr(request, 'user') and request.user.is_staff:
            return True
        
        # Health check endpoints
        if request.path.startswith('/health/'):
            return True
        
        return False
    
    @staticmethod
    def get_exempt_rate_limit(request):
        """Get higher rate limits for exempt users"""
        if hasattr(request, 'user') and request.user.is_superuser:
            return {'requests': 1000, 'window': 3600}  # 1000 requests per hour
        
        if hasattr(request, 'user') and request.user.is_staff:
            return {'requests': 500, 'window': 3600}  # 500 requests per hour
        
        return None 