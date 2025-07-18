from django.core.management.base import BaseCommand
from apps.voters.models import Voter, GANACHE_KEYS

class Command(BaseCommand):
    help = 'Fill in missing blockchain private keys for users with addresses but no private key.'

    def handle(self, *args, **options):
        address_to_key = {addr.lower(): key for addr, key in GANACHE_KEYS}
        updated = 0
        for voter in Voter.objects.filter(blockchain_address__isnull=False, blockchain_private_key__isnull=True):
            key = address_to_key.get(voter.blockchain_address.lower())
            if key:
                voter.blockchain_private_key = key
                voter.save(update_fields=['blockchain_private_key'])
                updated += 1
                self.stdout.write(self.style.SUCCESS(f"Updated {voter.username}: set private key for {voter.blockchain_address}"))
            else:
                self.stdout.write(self.style.WARNING(f"No matching key for {voter.username} ({voter.blockchain_address})"))
        self.stdout.write(self.style.SUCCESS(f"Done. Updated {updated} users.")) 