#!/usr/bin/env python3
"""
Complete Voting Test Script
Tests the entire voting process from login to casting a vote
"""

import requests
import json
import time
import os
from web3 import Web3

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

def test_complete_voting():
    """Test the complete voting process"""
    print("🚀 Starting Complete Voting Test")
    print("=" * 50)
    
    # Step 1: Login
    print("\n1️⃣ Logging in...")
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        login_response = requests.post(f"{API_BASE}/auth/login/", json=login_data)
        login_response.raise_for_status()
        login_result = login_response.json()
        
        if login_result.get('success'):
            token = login_result['data']['token']
            user_data = login_result['data']['user']
            print(f"✅ Login successful! User: {user_data['username']}")
            print(f"   Blockchain Address: {user_data['blockchain_address']}")
            print(f"   Token: {token}")  # Print the token for debugging
        else:
            print("❌ Login failed")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Get available elections
    print("\n2️⃣ Fetching elections...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        elections_response = requests.get(f"{API_BASE}/elections/", headers=headers)
        elections_response.raise_for_status()
        print(f"Raw elections response: {elections_response.text}")  # Print raw response for debugging
        elections = elections_response.json()
        
        # Use paginated results
        if 'results' in elections and elections['results']:
            election = elections['results'][0]  # Use first available election
            print(f"✅ Found election: {election['title']}")
            print(f"   Election ID: {election['id']}")
            print(f"   Status: {'Active' if election.get('is_active', election.get('status', 'inactive')) == True or election.get('status') == 'active' else 'Inactive'}")
            if not (election.get('is_active', election.get('status', 'inactive')) == True or election.get('status') == 'active'):
                print("⚠️  Election is not active, but we'll try anyway")
        else:
            print("❌ No elections found")
            return False
            
    except Exception as e:
        print(f"❌ Error fetching elections: {e}")
        return False
    
    # Step 3: Cast a vote
    print("\n3️⃣ Casting vote...")
    vote_data = {
        "election_id": str(election['id']),
        "candidate_id": "1"  # Vote for candidate 1
    }
    
    try:
        vote_response = requests.post(f"{API_BASE}/vote/", json=vote_data, headers=headers)
        
        if vote_response.status_code == 200:
            vote_result = vote_response.json()
            print("✅ Vote cast successfully!")
            print(f"   Transaction Hash: {vote_result.get('transaction_hash', 'N/A')}")
            print(f"   Vote Hash: {vote_result.get('vote_hash', 'N/A')}")
            print(f"   Encryption Method: {vote_result.get('encryption_info', {}).get('method', 'N/A')}")
        else:
            print(f"❌ Vote failed with status {vote_response.status_code}")
            print(f"   Response: {vote_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error casting vote: {e}")
        return False
    
    # Step 4: Verify the vote
    print("\n4️⃣ Verifying vote...")
    try:
        # Get the vote hash from the previous response
        vote_hash = vote_result.get('vote_hash')
        if vote_hash:
            verify_response = requests.get(f"{API_BASE}/vote/verify/{vote_hash}/", headers=headers)
            
            if verify_response.status_code == 200:
                verify_result = verify_response.json()
                print("✅ Vote verified successfully!")
                print(f"   Vote details: {json.dumps(verify_result, indent=2)}")
            else:
                print(f"⚠️  Vote verification failed: {verify_response.status_code}")
        else:
            print("⚠️  No vote hash available for verification")
            
    except Exception as e:
        print(f"⚠️  Error verifying vote: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Complete Voting Test Finished!")
    return True

def test_blockchain_direct():
    """Test blockchain connection directly"""
    print("\n🔗 Testing Blockchain Connection Directly")
    print("=" * 50)
    
    try:
        # Connect to Ganache
        w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
        
        if w3.is_connected():
            print("✅ Connected to Ganache")
            print(f"   Current block: {w3.eth.block_number}")
            
            # Get accounts
            accounts = w3.eth.accounts
            print(f"   Available accounts: {len(accounts)}")
            
            if accounts:
                print(f"   First account: {accounts[0]}")
                balance = w3.eth.get_balance(accounts[0])
                print(f"   Balance: {w3.from_wei(balance, 'ether')} ETH")
        else:
            print("❌ Failed to connect to Ganache")
            return False
            
    except Exception as e:
        print(f"❌ Blockchain connection error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("E-Voting System - Complete Voting Test")
    print("Make sure both Django backend and Ganache are running!")
    print()
    
    # Test blockchain connection first
    if not test_blockchain_direct():
        print("❌ Blockchain test failed. Make sure Ganache is running on port 7545")
        exit(1)
    
    # Test complete voting process
    if test_complete_voting():
        print("\n🎊 All tests passed! Your voting system is working correctly!")
    else:
        print("\n💥 Some tests failed. Check the output above for details.") 