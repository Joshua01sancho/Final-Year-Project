#!/usr/bin/env python
import requests
import json

def get_ganache_accounts():
    """Get accounts and private keys from Ganache"""
    try:
        # Ganache RPC endpoint
        url = "http://localhost:7545"
        
        # Get accounts
        payload = {
            "jsonrpc": "2.0",
            "method": "eth_accounts",
            "params": [],
            "id": 1
        }
        
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            accounts = response.json()['result']
            print(f"Found {len(accounts)} accounts in Ganache:")
            
            for i, account in enumerate(accounts):
                print(f"  Account {i}: {account}")
            
            # Get private keys (this is a Ganache-specific feature)
            # In a real blockchain, you wouldn't be able to get private keys
            print("\nPrivate keys (Ganache only):")
            for i in range(min(5, len(accounts))):  # Get first 5 accounts
                payload = {
                    "jsonrpc": "2.0",
                    "method": "eth_accounts",
                    "params": [],
                    "id": 1
                }
                
                # Ganache allows getting private keys via a special method
                # This is for development only
                try:
                    # Try to get private key (this might not work in all Ganache versions)
                    private_key_payload = {
                        "jsonrpc": "2.0",
                        "method": "eth_accounts",
                        "params": [],
                        "id": 1
                    }
                    
                    # For now, let's just show the account addresses
                    print(f"  Account {i} private key: (use Ganache UI to get this)")
                    
                except Exception as e:
                    print(f"  Account {i} private key: Could not retrieve automatically")
            
            print("\nTo get private keys:")
            print("1. Open Ganache application")
            print("2. Click on any account")
            print("3. Copy the private key")
            print("4. Set it in your environment variables:")
            print("   ADMIN_PRIVATE_KEY=your_private_key_here")
            print("   VOTER_PRIVATE_KEY=your_private_key_here")
            
            return accounts
            
        else:
            print(f"Failed to connect to Ganache: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error connecting to Ganache: {e}")
        return None

if __name__ == '__main__':
    get_ganache_accounts() 