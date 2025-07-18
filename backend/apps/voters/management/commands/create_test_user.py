from django.core.management.base import BaseCommand
from apps.voters.models import Voter, VoterProfile

class Command(BaseCommand):
    help = 'Create a test user for debugging'

    def handle(self, *args, **options):
        try:
            # Check if user already exists
            username = 'testuser'
            if Voter.objects.filter(username=username).exists():
                self.stdout.write(f"User '{username}' already exists")
                user = Voter.objects.get(username=username)
            else:
                # Create new user
                user = Voter.objects.create_user(
                    username=username,
                    email='test@example.com',
                    password='testpass123',
                    first_name='Test',
                    last_name='User'
                )
                self.stdout.write(f"Created user: {username}")
            
            # Create or update voter profile
            profile, created = VoterProfile.objects.get_or_create(
                user=user,
                defaults={
                    'is_verified': True,
                    'national_id': f'TEST{user.id}'
                }
            )
            
            if created:
                self.stdout.write(f"Created voter profile for {username}")
            else:
                self.stdout.write(f"Voter profile already exists for {username}")
            
            # Set blockchain address if not set
            if not user.blockchain_address:
                user.blockchain_address = f'0x{user.id:040x}'  # Generate a fake address
                user.save()
                self.stdout.write(f"Set blockchain address for {username}")
            
            self.stdout.write(f"\nTest user details:")
            self.stdout.write(f"  ID: {user.id}")
            self.stdout.write(f"  Username: {user.username}")
            self.stdout.write(f"  Email: {user.email}")
            self.stdout.write(f"  Password: testpass123")
            self.stdout.write(f"  Blockchain Address: {user.blockchain_address}")
            self.stdout.write(f"  Is Active: {user.is_active}")
            self.stdout.write(f"  Is Staff: {user.is_staff}")
            
        except Exception as e:
            self.stdout.write(f"Error creating test user: {e}")
            import traceback
            traceback.print_exc() 