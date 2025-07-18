#!/usr/bin/env python3
"""
Simple test to check blockchain service initialization
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
    from apps.elections.blockchain import BlockchainService
    print("✅ Successfully imported BlockchainService")
    
    # Try to initialize the service
    blockchain = BlockchainService()
    print("✅ Successfully initialized BlockchainService")
    
    # Test getting accounts
    accounts = blockchain.w3.eth.accounts
    print(f"✅ Found {len(accounts)} accounts")
    print(f"First account: {accounts[0]}")
    
    # Test contract
    print(f"✅ Contract address: {blockchain.contract_address}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 