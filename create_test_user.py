#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.voters.models import VoterProfile

User = get_user_model()

def create_test_user():
    """Create a test user for debugging"""
    try:
        # Check if user already exists
        username = 'testuser'
        if User.objects.filter(username=username).exists():
            print(f"User '{username}' already exists")
            user = User.objects.get(username=username)
        else:
            # Create new user
            user = User.objects.create_user(
                username=username,
                email='test@example.com',
                password='testpass123',
                first_name='Test',
                last_name='User'
            )
            print(f"Created user: {username}")
        
        # Create or update voter profile
        profile, created = VoterProfile.objects.get_or_create(
            user=user,
            defaults={
                'is_verified': True,
                'verification_method': 'traditional',
                'national_id': f'TEST{user.id}'
            }
        )
        
        if created:
            print(f"Created voter profile for {username}")
        else:
            print(f"Voter profile already exists for {username}")
        
        # Set blockchain address if not set
        if not hasattr(user, 'blockchain_address') or not user.blockchain_address:
            user.blockchain_address = f'0x{user.id:040x}'  # Generate a fake address
            user.save()
            print(f"Set blockchain address for {username}")
        
        print(f"\nTest user details:")
        print(f"  ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Password: testpass123")
        print(f"  Blockchain Address: {user.blockchain_address}")
        print(f"  Is Active: {user.is_active}")
        print(f"  Is Staff: {user.is_staff}")
        
        return user
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        return None

if __name__ == '__main__':
    create_test_user() 