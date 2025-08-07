#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.voters.models import Voter, GANACHE_KEYS

def check_blockchain_assignments():
    print("=== BLOCKCHAIN ADDRESS ASSIGNMENTS ===\n")
    
    # Get all users with blockchain addresses
    users_with_addresses = Voter.objects.filter(blockchain_address__isnull=False).exclude(blockchain_address='')
    
    print(f"Users with blockchain addresses: {users_with_addresses.count()}")
    print("\n--- ASSIGNED ADDRESSES ---")
    
    assigned_addresses = []
    for user in users_with_addresses:
        print(f"User: {user.username} (ID: {user.id})")
        print(f"  Address: {user.blockchain_address}")
        print(f"  Private Key: {user.blockchain_private_key[:20]}..." if user.blockchain_private_key else "  Private Key: None")
        print()
        assigned_addresses.append(user.blockchain_address)
    
    # Get all available addresses from GANACHE_KEYS
    all_addresses = [key[0] for key in GANACHE_KEYS]
    
    print("--- AVAILABLE ADDRESSES ---")
    available_addresses = []
    for address in all_addresses:
        if address not in assigned_addresses:
            print(f"Available: {address}")
            available_addresses.append(address)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total addresses in GANACHE_KEYS: {len(all_addresses)}")
    print(f"Assigned to users: {len(assigned_addresses)}")
    print(f"Available for assignment: {len(available_addresses)}")
    
    if available_addresses:
        print(f"\nYou can register {len(available_addresses)} more users with blockchain addresses.")
    else:
        print("\n⚠️  All blockchain addresses are assigned! You need to add more addresses to GANACHE_KEYS.")

if __name__ == "__main__":
    check_blockchain_assignments() 