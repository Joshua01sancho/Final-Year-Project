#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta
import pytz

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.elections.models import Election, Candidate
from apps.elections.blockchain import BlockchainService

def create_test_election():
    """Create a test election for debugging"""
    try:
        # Check if election already exists
        election_title = "Test Election 2024"
        if Election.objects.filter(title=election_title).exists():
            print(f"Election '{election_title}' already exists")
            election = Election.objects.get(title=election_title)
        else:
            # Create new election
            # Set times in Africa/Lusaka timezone
            lusaka_tz = pytz.timezone('Africa/Lusaka')
            now = datetime.now(lusaka_tz)
            start_time = now + timedelta(minutes=5)  # Start in 5 minutes
            end_time = now + timedelta(hours=2)      # End in 2 hours
            
            election = Election.objects.create(
                title=election_title,
                description="A test election for debugging the voting system",
                start_time=start_time,
                end_time=end_time,
                is_public=True,
                is_active=True,
                blockchain_election_id="1"  # Match the ID used in the test
            )
            print(f"Created election: {election_title}")
        
        # Create candidates if they don't exist
        candidates_data = [
            {"name": "John Doe", "party": "Democratic Party", "description": "Experienced leader"},
            {"name": "Jane Smith", "party": "Republican Party", "description": "Fresh perspective"},
            {"name": "Bob Johnson", "party": "Independent", "description": "Moderate choice"}
        ]
        
        for i, candidate_data in enumerate(candidates_data, 1):
            candidate, created = Candidate.objects.get_or_create(
                election=election,
                name=candidate_data["name"],
                defaults={
                    "party": candidate_data["party"],
                    "description": candidate_data["description"],
                    "blockchain_candidate_id": str(i)
                }
            )
            if created:
                print(f"Created candidate: {candidate.name}")
            else:
                print(f"Candidate already exists: {candidate.name}")
        
        # Create election on blockchain
        try:
            blockchain = BlockchainService()
            
            # Convert times to UTC for blockchain
            start_time_utc = election.start_time.astimezone(pytz.UTC)
            end_time_utc = election.end_time.astimezone(pytz.UTC)
            
            success, tx_hash = blockchain.create_election(
                election_id=str(election.id),
                title=election.title,
                description=election.description,
                start_time=int(start_time_utc.timestamp()),
                end_time=int(end_time_utc.timestamp()),
                candidate_ids=[str(c.id) for c in election.candidates.all()]
            )
            
            if success:
                print(f"Created election on blockchain. TX Hash: {tx_hash}")
                election.blockchain_tx_hash = tx_hash
                election.save()
            else:
                print(f"Failed to create election on blockchain: {tx_hash}")
                
        except Exception as e:
            print(f"Blockchain error: {e}")
        
        print(f"\nTest election details:")
        print(f"  ID: {election.id}")
        print(f"  Title: {election.title}")
        print(f"  Start Time: {election.start_time}")
        print(f"  End Time: {election.end_time}")
        print(f"  Is Active: {election.is_active}")
        print(f"  Candidates: {election.candidates.count()}")
        
        return election
        
    except Exception as e:
        print(f"Error creating test election: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    create_test_election() 