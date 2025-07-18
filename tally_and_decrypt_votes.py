#!/usr/bin/env python
"""
Tally and decrypt votes for a given election using Paillier encryption.
This script demonstrates privacy-preserving tallying in your e-voting system.
"""
import os
import sys
import django
from functools import reduce

# Setup Django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.elections.models import Election, Vote
from apps.encryption.paillier import PaillierEncryption
import json

# === CONFIGURE ===
ELECTION_TITLE = 'Lusaka Cousil Elections'  # Change to your election title

# === Load election and votes ===
election = Election.objects.get(title=ELECTION_TITLE)
votes = Vote.objects.filter(election=election, is_valid=True)

print(f"Election: {election.title}")
print(f"Total votes: {votes.count()}")

if votes.count() == 0:
    print("No votes found for this election.")
    sys.exit(0)

# === Load or generate Paillier key pair ===
# In production, load the real election key! For demo, generate a new one.
paillier = PaillierEncryption(key_size=512)
key_pair = paillier.generate_key_pair()

# === Aggregate encrypted votes ===
encrypted_votes = []
for v in votes:
    try:
        # If stored as int or hex string
        enc = v.encrypted_vote_data
        if enc.startswith('{'):
            # If stored as JSON (for test/demo)
            enc = json.loads(enc).get('encrypted_vote')
        if isinstance(enc, str):
            if enc.startswith('0x'):
                enc = int(enc, 16)
            else:
                enc = int(enc)
        encrypted_votes.append(enc)
        print(f"Vote by {v.voter.username}: {enc}")
    except Exception as e:
        print(f"Could not parse vote for {v.voter.username}: {e}")

if not encrypted_votes:
    print("No valid encrypted votes found.")
    sys.exit(0)

# Homomorphic aggregation (multiplication)
aggregated_ciphertext = reduce(lambda x, y: (x * y) % key_pair.public_key[0]**2, encrypted_votes)
print(f"Aggregated ciphertext: {aggregated_ciphertext}")

# Decrypt the tally
try:
    tally = paillier.decrypt(aggregated_ciphertext, key_pair)
    print(f"Decrypted tally (sum of votes): {tally}")
except Exception as e:
    print(f"Decryption failed: {e}") 