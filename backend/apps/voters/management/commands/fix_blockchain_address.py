from django.core.management.base import BaseCommand
from apps.voters.models import Voter

class Command(BaseCommand):
    help = 'Fix the test user blockchain address to match the correct Ganache account'

    def handle(self, *args, **options):
        try:
            # Get the test user
            user = Voter.objects.get(username='testuser')
            
            # Update to the correct blockchain address (account 2)
            # This corresponds to the private key we're using
            correct_address = '0xff26aef8e8315c2cd84846a3e4312f2d71b51a7e'
            
            user.blockchain_address = correct_address
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f"✅ Updated test user blockchain address to: {correct_address}")
            )
            self.stdout.write(f"   User: {user.username}")
            self.stdout.write(f"   Email: {user.email}")
            
        except Voter.DoesNotExist:
            self.stdout.write(
                self.style.ERROR("❌ Test user not found. Run 'python manage.py create_test_user' first.")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error updating blockchain address: {e}")
            ) 