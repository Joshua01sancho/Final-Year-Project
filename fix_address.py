#!/usr/bin/env python3
"""
Simple script to fix blockchain address
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    from apps.voters.models import Voter
    from web3 import Web3
    
    # Get the test user
    user = Voter.objects.get(username='testuser')
    print(f"Found user: {user.username}")
    print(f"Current blockchain address: {user.blockchain_address}")
    
    # Convert to checksum format
    checksum_address = Web3.to_checksum_address(user.blockchain_address)
    print(f"Checksum address: {checksum_address}")
    
    # Update the user's blockchain address
    user.blockchain_address = checksum_address
    user.save()
    
    print("✅ Successfully updated blockchain address to checksum format!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 