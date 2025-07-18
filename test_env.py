#!/usr/bin/env python3
"""
Test environment variables
"""

import os

# Set environment variables
os.environ['ADMIN_PRIVATE_KEY'] = '0x0ed17026394b4281656acc55a667c779fe602966a48596a8148076ad043c81f5'
os.environ['VOTER_PRIVATE_KEY'] = '0x0ed17026394b4281656acc55a667c779fe602966a48596a8148076ad043c81f5'

print("Environment variables:")
print(f"ADMIN_PRIVATE_KEY: {os.environ.get('ADMIN_PRIVATE_KEY', 'NOT SET')}")
print(f"VOTER_PRIVATE_KEY: {os.environ.get('VOTER_PRIVATE_KEY', 'NOT SET')}")

# Test Django settings
import sys
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    import django
    django.setup()
    
    from django.conf import settings
    print(f"\nDjango settings:")
    print(f"ADMIN_PRIVATE_KEY: {getattr(settings, 'ADMIN_PRIVATE_KEY', 'NOT FOUND')}")
    print(f"VOTER_PRIVATE_KEY: {getattr(settings, 'VOTER_PRIVATE_KEY', 'NOT FOUND')}")
    
except Exception as e:
    print(f"Error: {e}") 