"""
Helper Functions for E-Voting System

This module provides utility functions for common operations:
- Data formatting
- Security helpers
- Time utilities
- File handling
"""

import hashlib
import json
import base64
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from Crypto.Random import get_random_bytes
from Crypto.Util.number import bytes_to_long, long_to_bytes

def generate_unique_id() -> str:
    """
    Generate a unique identifier
    
    Returns:
        str: Unique identifier
    """
    return str(uuid.uuid4())

def hash_data(data: str) -> str:
    """
    Create SHA-256 hash of data
    
    Args:
        data: Data to hash
        
    Returns:
        str: Hexadecimal hash
    """
    return hashlib.sha256(data.encode()).hexdigest()

def generate_nonce() -> str:
    """
    Generate a cryptographic nonce
    
    Returns:
        str: Base64 encoded nonce
    """
    nonce_bytes = get_random_bytes(32)
    return base64.b64encode(nonce_bytes).decode('utf-8')

def timestamp_to_iso(timestamp: datetime) -> str:
    """
    Convert datetime to ISO format
    
    Args:
        timestamp: Datetime object
        
    Returns:
        str: ISO formatted timestamp
    """
    return timestamp.replace(tzinfo=timezone.utc).isoformat()

def iso_to_timestamp(iso_string: str) -> datetime:
    """
    Convert ISO string to datetime
    
    Args:
        iso_string: ISO formatted timestamp
        
    Returns:
        datetime: Datetime object
    """
    return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))

def format_vote_receipt(vote_id: str, election_id: str, tx_hash: str) -> Dict[str, Any]:
    """
    Format vote receipt for user
    
    Args:
        vote_id: Unique vote identifier
        election_id: Election identifier
        tx_hash: Blockchain transaction hash
        
    Returns:
        dict: Formatted vote receipt
    """
    return {
        'vote_id': vote_id,
        'election_id': election_id,
        'timestamp': timestamp_to_iso(datetime.now()),
        'blockchain_tx_hash': tx_hash,
        'status': 'confirmed'
    }

def format_election_summary(election_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format election data for API response
    
    Args:
        election_data: Raw election data
        
    Returns:
        dict: Formatted election summary
    """
    return {
        'id': election_data.get('id'),
        'title': election_data.get('title'),
        'description': election_data.get('description'),
        'start_date': timestamp_to_iso(election_data.get('start_date')),
        'end_date': timestamp_to_iso(election_data.get('end_date')),
        'status': election_data.get('status'),
        'total_votes': election_data.get('total_votes', 0),
        'candidates_count': len(election_data.get('candidates', [])),
        'created_at': timestamp_to_iso(election_data.get('created_at')),
    }

def format_user_profile(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format user profile data (excluding sensitive information)
    
    Args:
        user_data: Raw user data
        
    Returns:
        dict: Formatted user profile
    """
    return {
        'id': user_data.get('id'),
        'username': user_data.get('username'),
        'email': user_data.get('email'),
        'first_name': user_data.get('first_name'),
        'last_name': user_data.get('last_name'),
        'is_active': user_data.get('is_active'),
        'date_joined': timestamp_to_iso(user_data.get('date_joined')),
        'last_login': timestamp_to_iso(user_data.get('last_login')) if user_data.get('last_login') else None,
    }

def encode_base64(data: bytes) -> str:
    """
    Encode bytes to base64 string
    
    Args:
        data: Bytes to encode
        
    Returns:
        str: Base64 encoded string
    """
    return base64.b64encode(data).decode('utf-8')

def decode_base64(data: str) -> bytes:
    """
    Decode base64 string to bytes
    
    Args:
        data: Base64 encoded string
        
    Returns:
        bytes: Decoded bytes
    """
    return base64.b64decode(data.encode('utf-8'))

def int_to_bytes(value: int) -> bytes:
    """
    Convert integer to bytes
    
    Args:
        value: Integer to convert
        
    Returns:
        bytes: Byte representation
    """
    return long_to_bytes(value)

def bytes_to_int(value: bytes) -> int:
    """
    Convert bytes to integer
    
    Args:
        value: Bytes to convert
        
    Returns:
        int: Integer value
    """
    return bytes_to_long(value)

def validate_json_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
    """
    Simple JSON schema validation
    
    Args:
        data: Data to validate
        schema: Schema definition
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        for key, value_type in schema.items():
            if key not in data:
                return False
            if not isinstance(data[key], value_type):
                return False
        return True
    except:
        return False

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage
    
    Args:
        filename: Original filename
        
    Returns:
        str: Sanitized filename
    """
    # Remove or replace unsafe characters
    unsafe_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
    for char in unsafe_chars:
        filename = filename.replace(char, '_')
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1)
        filename = name[:250] + '.' + ext
    
    return filename

def calculate_file_hash(file_data: bytes) -> str:
    """
    Calculate SHA-256 hash of file data
    
    Args:
        file_data: File bytes
        
    Returns:
        str: File hash
    """
    return hashlib.sha256(file_data).hexdigest()

def format_error_response(error_message: str, error_code: str = None) -> Dict[str, Any]:
    """
    Format error response for API
    
    Args:
        error_message: Error message
        error_code: Error code
        
    Returns:
        dict: Formatted error response
    """
    response = {
        'error': True,
        'message': error_message,
        'timestamp': timestamp_to_iso(datetime.now())
    }
    
    if error_code:
        response['error_code'] = error_code
    
    return response

def format_success_response(data: Any, message: str = None) -> Dict[str, Any]:
    """
    Format success response for API
    
    Args:
        data: Response data
        message: Success message
        
    Returns:
        dict: Formatted success response
    """
    response = {
        'success': True,
        'data': data,
        'timestamp': timestamp_to_iso(datetime.now())
    }
    
    if message:
        response['message'] = message
    
    return response

def chunk_list(data: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split list into chunks
    
    Args:
        data: List to chunk
        chunk_size: Size of each chunk
        
    Returns:
        list: List of chunks
    """
    return [data[i:i + chunk_size] for i in range(0, len(data), chunk_size)]

def merge_dicts(*dicts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge multiple dictionaries
    
    Args:
        *dicts: Dictionaries to merge
        
    Returns:
        dict: Merged dictionary
    """
    result = {}
    for d in dicts:
        result.update(d)
    return result

def get_client_ip(request) -> str:
    """
    Get client IP address from request
    
    Args:
        request: Django request object
        
    Returns:
        str: Client IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def is_valid_uuid(uuid_string: str) -> bool:
    """
    Check if string is valid UUID
    
    Args:
        uuid_string: String to check
        
    Returns:
        bool: True if valid UUID
    """
    try:
        uuid.UUID(uuid_string)
        return True
    except ValueError:
        return False

def generate_secure_token() -> str:
    """
    Generate a secure random token
    
    Returns:
        str: Secure token
    """
    return base64.urlsafe_b64encode(get_random_bytes(32)).decode('utf-8').rstrip('=')

def mask_sensitive_data(data: str, visible_chars: int = 4) -> str:
    """
    Mask sensitive data for logging
    
    Args:
        data: Data to mask
        visible_chars: Number of characters to keep visible
        
    Returns:
        str: Masked data
    """
    if len(data) <= visible_chars * 2:
        return '*' * len(data)
    
    return data[:visible_chars] + '*' * (len(data) - visible_chars * 2) + data[-visible_chars:] 