from django.core.management.base import BaseCommand
from apps.voters.models import Voter

class Command(BaseCommand):
    help = 'Clear blockchain addresses and private keys for all users.'
 
    def handle(self, *args, **options):
        updated = Voter.objects.update(blockchain_address=None, blockchain_private_key=None)
        self.stdout.write(self.style.SUCCESS(f'Cleared blockchain addresses and private keys for {updated} users.')) 