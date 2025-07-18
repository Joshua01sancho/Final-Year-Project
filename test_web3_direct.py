#!/usr/bin/env python3
"""
Test Web3 directly without Django
"""

import json
import os
from web3 import Web3

def test_web3_direct():
    print("🧪 Testing Web3 Directly...")
    
    # Connect to Ganache
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
    print(f"✅ Connected to Ganache: {w3.is_connected()}")
    
    # Get accounts
    accounts = w3.eth.accounts
    print(f"✅ Found {len(accounts)} accounts")
    admin_account = accounts[0]
    voter_account = accounts[2]  # Use account 2 which corresponds to the private key
    print(f"Admin account: {admin_account}")
    print(f"Voter account: {voter_account}")
    
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
    
    # Test data
    election_id = "test-election-123"
    encrypted_vote = b'\x01\x02\x03\x04\x05\x06\x07\x08'
    
    # Create vote hash
    vote_hash_full = w3.solidity_keccak(
        ['string', 'bytes', 'address'],
        [election_id, encrypted_vote, voter_account]
    )
    vote_hash = vote_hash_full[:32]  # Ensure exactly 32 bytes
    
    print(f"\nTest data:")
    print(f"  election_id: {election_id}")
    print(f"  voter_address: {voter_account}")
    print(f"  encrypted_vote: {encrypted_vote}")
    print(f"  vote_hash: {vote_hash} (length: {len(vote_hash)})")
    
    # Test castVote function
    try:
        # Build transaction
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
        
        # Get private key (this is the admin key, but we'll use it for testing)
        private_key = '0x0ed17026394b4281656acc55a667c779fe602966a48596a8148076ad043c81f5'
        
        # Sign transaction
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
        print("✅ Transaction signed successfully!")
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"✅ Transaction sent! Hash: {tx_hash.hex()}")
        
        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"✅ Transaction confirmed! Block: {receipt.blockNumber}")
        
        return True
        
    except Exception as e:
        print(f"❌ Transaction failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_web3_direct()
    if success:
        print("\n🎉 Web3 test passed! The blockchain integration works.")
    else:
        print("\n💥 Web3 test failed.") 