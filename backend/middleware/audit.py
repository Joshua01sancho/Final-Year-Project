"""
Audit Middleware for E-Voting System

This middleware logs all important actions for security auditing and transparency.
"""

import json
import logging
from datetime import datetime
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger('audit')

class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to audit all important actions in the E-Voting system
    """
    
    def __init__(self, get_response=None):
        super().__init__(get_response)
        self.audit_paths = [
            '/api/auth/',
            '/api/elections/',
            '/api/votes/',
            '/api/admin/',
            '/admin/',
        ]
    
    def process_request(self, request):
        """Log incoming requests"""
        if self._should_audit(request.path):
            self._log_request(request)
        return None
    
    def process_response(self, request, response):
        """Log responses for audited requests"""
        if self._should_audit(request.path):
            self._log_response(request, response)
        return response
    
    def process_exception(self, request, exception):
        """Log exceptions"""
        if self._should_audit(request.path):
            self._log_exception(request, exception)
        return None
    
    def _should_audit(self, path):
        """Determine if a path should be audited"""
        return any(audit_path in path for audit_path in self.audit_paths)
    
    def _log_request(self, request):
        """Log incoming request details"""
        try:
            user = self._get_user_info(request)
            ip_address = self._get_client_ip(request)
            
            audit_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'request',
                'method': request.method,
                'path': request.path,
                'user': user,
                'ip_address': ip_address,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'referer': request.META.get('HTTP_REFERER', ''),
            }
            
            # Add request body for sensitive operations
            if request.method in ['POST', 'PUT', 'PATCH']:
                audit_data['request_body'] = self._sanitize_request_body(request)
            
            logger.info(f"AUDIT_REQUEST: {json.dumps(audit_data)}")
            
        except Exception as e:
            logger.error(f"Error logging request: {str(e)}")
    
    def _log_response(self, request, response):
        """Log response details"""
        try:
            user = self._get_user_info(request)
            ip_address = self._get_client_ip(request)
            
            audit_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'response',
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'user': user,
                'ip_address': ip_address,
            }
            
            # Log response body for sensitive operations
            if self._is_sensitive_operation(request.path):
                audit_data['response_body'] = self._sanitize_response_body(response)
            
            logger.info(f"AUDIT_RESPONSE: {json.dumps(audit_data)}")
            
        except Exception as e:
            logger.error(f"Error logging response: {str(e)}")
    
    def _log_exception(self, request, exception):
        """Log exception details"""
        try:
            user = self._get_user_info(request)
            ip_address = self._get_client_ip(request)
            
            audit_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'exception',
                'method': request.method,
                'path': request.path,
                'exception_type': type(exception).__name__,
                'exception_message': str(exception),
                'user': user,
                'ip_address': ip_address,
            }
            
            logger.error(f"AUDIT_EXCEPTION: {json.dumps(audit_data)}")
            
        except Exception as e:
            logger.error(f"Error logging exception: {str(e)}")
    
    def _get_user_info(self, request):
        """Get user information for audit log"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            return {
                'id': request.user.id,
                'username': request.user.username,
                'email': getattr(request.user, 'email', ''),
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
            }
        else:
            return {
                'id': None,
                'username': 'anonymous',
                'email': '',
                'is_staff': False,
                'is_superuser': False,
            }
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _sanitize_request_body(self, request):
        """Sanitize request body to remove sensitive data"""
        try:
            if hasattr(request, 'body') and request.body:
                body = request.body.decode('utf-8')
                data = json.loads(body) if body else {}
                
                # Remove sensitive fields
                sensitive_fields = ['password', 'token', 'secret', 'key', 'private_key']
                sanitized_data = self._remove_sensitive_fields(data, sensitive_fields)
                
                return sanitized_data
        except:
            return {}
    
    def _sanitize_response_body(self, response):
        """Sanitize response body to remove sensitive data"""
        try:
            if hasattr(response, 'content') and response.content:
                content = response.content.decode('utf-8')
                data = json.loads(content) if content else {}
                
                # Remove sensitive fields
                sensitive_fields = ['password', 'token', 'secret', 'key', 'private_key']
                sanitized_data = self._remove_sensitive_fields(data, sensitive_fields)
                
                return sanitized_data
        except:
            return {}
    
    def _remove_sensitive_fields(self, data, sensitive_fields):
        """Recursively remove sensitive fields from data"""
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                if any(sensitive in key.lower() for sensitive in sensitive_fields):
                    sanitized[key] = '[REDACTED]'
                else:
                    sanitized[key] = self._remove_sensitive_fields(value, sensitive_fields)
            return sanitized
        elif isinstance(data, list):
            return [self._remove_sensitive_fields(item, sensitive_fields) for item in data]
        else:
            return data
    
    def _is_sensitive_operation(self, path):
        """Check if operation is sensitive and should log response body"""
        sensitive_paths = [
            '/api/auth/login',
            '/api/auth/face-login',
            '/api/auth/fingerprint-login',
            '/api/votes/',
            '/api/admin/elections/',
        ]
        return any(sensitive_path in path for sensitive_path in sensitive_paths)

class VoteAuditLogger:
    """Specialized logger for vote-related operations"""
    
    @staticmethod
    def log_vote_cast(request, election_id, vote_hash, blockchain_tx_hash):
        """Log when a vote is cast"""
        try:
            user = request.user if request.user.is_authenticated else None
            
            audit_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'vote_cast',
                'election_id': election_id,
                'vote_hash': vote_hash,
                'blockchain_tx_hash': blockchain_tx_hash,
                'user_id': user.id if user else None,
                'user_username': user.username if user else 'anonymous',
                'ip_address': AuditMiddleware._get_client_ip_static(request),
            }
            
            logger.info(f"VOTE_CAST: {json.dumps(audit_data)}")
            
        except Exception as e:
            logger.error(f"Error logging vote cast: {str(e)}")
    
    @staticmethod
    def log_election_creation(request, election_id, election_data):
        """Log when an election is created"""
        try:
            user = request.user if request.user.is_authenticated else None
            
            audit_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'election_creation',
                'election_id': election_id,
                'election_title': election_data.get('title', ''),
                'created_by_user_id': user.id if user else None,
                'created_by_username': user.username if user else 'anonymous',
                'ip_address': AuditMiddleware._get_client_ip_static(request),
            }
            
            logger.info(f"ELECTION_CREATION: {json.dumps(audit_data)}")
            
        except Exception as e:
            logger.error(f"Error logging election creation: {str(e)}")
    
    @staticmethod
    def log_election_results(request, election_id, results):
        """Log when election results are accessed"""
        try:
            user = request.user if request.user.is_authenticated else None
            
            audit_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': 'election_results_access',
                'election_id': election_id,
                'accessed_by_user_id': user.id if user else None,
                'accessed_by_username': user.username if user else 'anonymous',
                'ip_address': AuditMiddleware._get_client_ip_static(request),
            }
            
            logger.info(f"ELECTION_RESULTS_ACCESS: {json.dumps(audit_data)}")
            
        except Exception as e:
            logger.error(f"Error logging election results access: {str(e)}")

# Static method for getting client IP
def _get_client_ip_static(request):
    """Get client IP address (static method)"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# Add static method to AuditMiddleware class
AuditMiddleware._get_client_ip_static = staticmethod(_get_client_ip_static) 