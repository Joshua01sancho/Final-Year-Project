#!/usr/bin/env python3
"""
Test blockchain service directly
"""

import os
import sys
import json

# Set environment variables
os.environ['ADMIN_PRIVATE_KEY'] = '0x0ed17026394b4281656acc55a667c779fe602966a48596a8148076ad043c81f5'
os.environ['VOTER_PRIVATE_KEY'] = '0x0ed17026394b4281656acc55a667c779fe602966a48596a8148076ad043c81f5'

# Add backend to path
sys.path.append('backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    import django
    django.setup()
    
    from apps.elections.blockchain import BlockchainService
    from web3 import Web3
    
    print("🧪 Testing Blockchain Service Directly...")
    
    # Initialize blockchain service
    blockchain = BlockchainService()
    print("✅ Blockchain service initialized")
    
    # Test data
    election_id = "test-election-123"
    voter_address = "0xE2E445F2053470497A96ff3ae1386dcc7DAbCf33"
    encrypted_vote = b'\x01\x02\x03\x04\x05\x06\x07\x08'
    
    # Create vote hash
    w3 = Web3()
    vote_hash_full = w3.solidity_keccak(
        ['string', 'bytes', 'address'],
        [election_id, encrypted_vote, voter_address]
    )
    vote_hash = vote_hash_full[:32]  # Ensure exactly 32 bytes
    
    print(f"Test data:")
    print(f"  election_id: {election_id}")
    print(f"  voter_address: {voter_address}")
    print(f"  encrypted_vote: {encrypted_vote}")
    print(f"  vote_hash: {vote_hash} (length: {len(vote_hash)})")
    
    # Test cast_vote
    success, result = blockchain.cast_vote(
        election_id=election_id,
        voter_address=voter_address,
        encrypted_vote=encrypted_vote,
        vote_hash=vote_hash
    )
    
    if success:
        print(f"✅ Vote cast successfully!")
        print(f"Transaction hash: {result}")
    else:
        print(f"❌ Vote failed: {result}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 