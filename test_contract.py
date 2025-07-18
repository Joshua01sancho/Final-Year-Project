#!/usr/bin/env python3
"""
Test contract deployment and accessibility
"""

import json
import os
from web3 import Web3

def test_contract():
    print("🧪 Testing Contract Deployment...")
    
    # Connect to Ganache
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
    print(f"✅ Connected to Ganache: {w3.is_connected()}")
    
    # Get accounts
    accounts = w3.eth.accounts
    print(f"✅ Found {len(accounts)} accounts")
    print(f"First account: {accounts[0]}")
    
    # Load contract
    contract_path = os.path.join('truffle', 'build', 'contracts', 'VotingContract.json')
    print(f"Contract path: {contract_path}")
    print(f"Contract exists: {os.path.exists(contract_path)}")
    
    with open(contract_path) as f:
        contract_json = json.load(f)
        contract_abi = contract_json['abi']
        contract_address = contract_json['networks']['5777']['address']
        print(f"Contract address: {contract_address}")
    
    # Initialize contract
    contract = w3.eth.contract(
        address=contract_address,
        abi=contract_abi
    )
    print("✅ Contract initialized")
    
    # List available functions
    print("\nAvailable functions:")
    for func in contract.all_functions():
        print(f"  - {func.fn_name}")
    
    # Test contract functions
    try:
        # Test getting accounts
        admin_account = accounts[0]
        voter_account = accounts[1]
        print(f"✅ Admin account: {admin_account}")
        print(f"✅ Voter account: {voter_account}")
        
        # Test if we can call a simple function
        try:
            # Try to get an election that doesn't exist
            result = contract.functions.getElection("test").call()
            print(f"✅ Contract call successful: {result}")
        except Exception as e:
            print(f"⚠️ Expected error for non-existent election: {e}")
        
        # Test castVote function signature
        try:
            # Create test data
            election_id = "test-election"
            encrypted_vote = b'\x01\x02\x03\x04'  # Test bytes
            vote_hash = b'\x05' * 32  # Exactly 32 bytes for bytes32
            
            print(f"\nTesting castVote with:")
            print(f"  election_id: {election_id}")
            print(f"  encrypted_vote: {encrypted_vote}")
            print(f"  vote_hash: {vote_hash}")
            
            # Try to build transaction (don't send it)
            tx = contract.functions.castVote(
                election_id,
                encrypted_vote,
                vote_hash
            ).build_transaction({
                'from': voter_account,
                'gas': 2000000,
                'nonce': w3.eth.get_transaction_count(voter_account)
            })
            print("✅ Transaction built successfully!")
            
        except Exception as e:
            print(f"❌ castVote test failed: {e}")
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        print(f"❌ Contract test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_contract() 