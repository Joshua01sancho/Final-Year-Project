from django.core.management.base import BaseCommand
from apps.elections.models import Election, Candidate
from apps.elections.blockchain import BlockchainService
from datetime import datetime, timedelta
import pytz

class Command(BaseCommand):
    help = 'Create a test election for debugging'

    def handle(self, *args, **options):
        try:
            # Check if election already exists
            election_title = "Test Election 2024"
            if Election.objects.filter(title=election_title).exists():
                self.stdout.write(f"Election '{election_title}' already exists")
                election = Election.objects.get(title=election_title)
            else:
                # Create new election
                # Set times in Africa/Lusaka timezone
                lusaka_tz = pytz.timezone('Africa/Lusaka')
                now = datetime.now(lusaka_tz)
                start_date = now - timedelta(minutes=5)  # Start 5 minutes ago
                end_date = now + timedelta(hours=1)        # End in 1 hour
                
                election = Election.objects.create(
                    title=election_title,
                    description="A test election for debugging the voting system",
                    start_date=start_date,
                    end_date=end_date,
                    status='active',  # Set status to active
                    is_public=True,
                    created_by_id=1  # Use the test user we created
                )
                self.stdout.write(f"Created election: {election_title}")
            
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
                        "order": i
                    }
                )
                if created:
                    self.stdout.write(f"Created candidate: {candidate.name}")
                else:
                    self.stdout.write(f"Candidate already exists: {candidate.name}")
            
            # Create election on blockchain
            try:
                blockchain = BlockchainService()
                
                # Convert times to UTC for blockchain
                start_date_utc = election.start_date.astimezone(pytz.UTC)
                end_date_utc = election.end_date.astimezone(pytz.UTC)
                
                success, tx_hash = blockchain.create_election(
                    election_id=str(election.id),
                    title=election.title,
                    start_time=start_date_utc,
                    end_time=end_date_utc
                )
                
                if success:
                    self.stdout.write(f"Created election on blockchain. TX Hash: {tx_hash}")
                    election.blockchain_deployment_tx = tx_hash
                    election.save()
                else:
                    self.stdout.write(f"Failed to create election on blockchain: {tx_hash}")
                    
            except Exception as e:
                self.stdout.write(f"Blockchain error: {e}")
            
            self.stdout.write(f"\nTest election details:")
            self.stdout.write(f"  ID: {election.id}")
            self.stdout.write(f"  Title: {election.title}")
            self.stdout.write(f"  Start Date: {election.start_date}")
            self.stdout.write(f"  End Date: {election.end_date}")
            self.stdout.write(f"  Status: {election.status}")
            self.stdout.write(f"  Is Active: {election.is_active}")
            self.stdout.write(f"  Candidates: {election.candidates.count()}")
            
        except Exception as e:
            self.stdout.write(f"Error creating test election: {e}")
            import traceback
            traceback.print_exc() 