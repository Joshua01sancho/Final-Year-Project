#!/usr/bin/env python
import requests
import json
from web3 import Web3

def test_blockchain_connection():
    """Test blockchain connection and create a simple election"""
    try:
        # Connect to Ganache
        w3 = Web3(Web3.HTTPProvider('http://localhost:7545'))
        
        if not w3.is_connected():
            print("❌ Failed to connect to Ganache")
            return False
        
        print("✅ Connected to Ganache successfully")
        
        # Get accounts
        accounts = w3.eth.accounts
        print(f"Found {len(accounts)} accounts")
        
        # Get account 0 balance
        balance = w3.eth.get_balance(accounts[0])
        balance_eth = w3.from_wei(balance, 'ether')
        print(f"Account 0 balance: {balance_eth} ETH")
        
        # Check if contract exists
        contract_address = "0x48A82B4612571571936334Df41EDf073b529f8B4"
        code = w3.eth.get_code(contract_address)
        
        if code == b'':
            print("❌ Contract not deployed at the expected address")
            print("You need to deploy the contract first using Truffle")
            return False
        
        print("✅ Contract found at address")
        
        # Try to create a simple election using RPC calls
        # This is a simplified approach without the full contract ABI
        
        # Get the first account as admin
        admin_account = accounts[0]
        print(f"Using admin account: {admin_account}")
        
        # Create a simple transaction to test
        nonce = w3.eth.get_transaction_count(admin_account)
        
        # This is a test transaction - in reality, you'd need the contract ABI
        # and proper function calls
        print(f"Current nonce for admin: {nonce}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_simple_election():
    """Create a simple election using direct RPC calls"""
    try:
        w3 = Web3(Web3.HTTPProvider('http://localhost:7545'))
        
        if not w3.is_connected():
            print("❌ Not connected to Ganache")
            return False
        
        # Get the contract ABI and address
        # For now, let's just test the connection
        print("✅ Blockchain connection working")
        print("To create an election, you need to:")
        print("1. Get private keys from Ganache")
        print("2. Set them as environment variables")
        print("3. Use the Django management command")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print("=== Testing Blockchain Connection ===")
    if test_blockchain_connection():
        print("\n=== Creating Simple Election ===")
        create_simple_election()
    else:
        print("❌ Blockchain connection failed") 