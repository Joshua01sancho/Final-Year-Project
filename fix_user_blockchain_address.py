#!/usr/bin/env python3
"""
Fix the test user's blockchain address to match the correct Ganache account
"""

import os
import sys
import django

# Add backend to path
sys.path.append('backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.voters.models import Voter

def fix_user_blockchain_address():
    """Update test user's blockchain address"""
    try:
        # Get the test user
        user = Voter.objects.get(username='testuser')
        
        # Update to the correct blockchain address (account 2)
        # This corresponds to the private key we're using
        correct_address = '0xff26aef8e8315c2cd84846a3e4312f2d71b51a7e'
        
        user.blockchain_address = correct_address
        user.save()
        
        print(f"✅ Updated test user blockchain address to: {correct_address}")
        print(f"   User: {user.username}")
        print(f"   Email: {user.email}")
        
        return True
        
    except Voter.DoesNotExist:
        print("❌ Test user not found. Run 'python manage.py create_test_user' first.")
        return False
    except Exception as e:
        print(f"❌ Error updating blockchain address: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Fixing test user blockchain address...")
    if fix_user_blockchain_address():
        print("🎉 Successfully updated blockchain address!")
    else:
        print("💥 Failed to update blockchain address.") 