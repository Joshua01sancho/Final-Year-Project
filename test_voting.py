#!/usr/bin/env python3
"""
Test script to verify voting functionality
"""

import requests
import json

# API endpoints
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login/"
VOTE_URL = f"{BASE_URL}/api/vote/"

# Test credentials
username = "testuser"
password = "testpass123"

def test_voting():
    print("🧪 Testing E-Voting System...")
    
    # Step 1: Login to get token
    print("\n1. Logging in...")
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        login_response = requests.post(LOGIN_URL, json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            
            # Handle nested response structure
            if isinstance(token_data, dict) and 'data' in token_data:
                access_token = token_data['data'].get('token')
            elif isinstance(token_data, dict):
                access_token = token_data.get('access') or token_data.get('token')
            else:
                access_token = token_data
                
            if access_token:
                print("✅ Login successful!")
                print(f"Token: {access_token[:20]}...")
            else:
                print("❌ No access token found in response")
                return False
        else:
            print(f"❌ Login failed: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Get elections (to find election and candidate IDs)
    print("\n2. Getting elections...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        elections_response = requests.get(f"{BASE_URL}/api/elections/", headers=headers)
        print(f"Elections status: {elections_response.status_code}")
        
        if elections_response.status_code == 200:
            elections_data = elections_response.json()
            
            # Handle paginated response
            if isinstance(elections_data, dict) and 'results' in elections_data:
                elections = elections_data['results']
            else:
                elections = elections_data
                
            print(f"Found {len(elections)} elections")
            
            if elections:
                election = elections[0]  # Use first election
                election_id = election['id']
                candidates = election.get('candidates', [])
                
                if candidates:
                    candidate_id = candidates[0]['id']  # Use first candidate
                    print(f"Using election: {election['title']} (ID: {election_id})")
                    print(f"Using candidate: {candidates[0]['name']} (ID: {candidate_id})")
                else:
                    print("❌ No candidates found in election")
                    return False
            else:
                print("❌ No elections found")
                return False
        else:
            print(f"❌ Failed to get elections: {elections_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Elections error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 3: Cast vote
    print("\n3. Casting vote...")
    vote_data = {
        "election_id": str(election_id),
        "candidate_id": str(candidate_id)
    }
    
    try:
        vote_response = requests.post(VOTE_URL, json=vote_data, headers=headers)
        print(f"Vote status: {vote_response.status_code}")
        
        if vote_response.status_code == 200:
            vote_result = vote_response.json()
            print("✅ Vote cast successfully!")
            print(f"Transaction hash: {vote_result.get('transaction_hash', 'N/A')}")
            print(f"Vote hash: {vote_result.get('vote_hash', 'N/A')}")
            return True
        else:
            print(f"❌ Vote failed: {vote_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Vote error: {e}")
        return False

if __name__ == "__main__":
    success = test_voting()
    if success:
        print("\n🎉 All tests passed! The voting system is working correctly.")
    else:
        print("\n💥 Tests failed. Please check the error messages above.") 