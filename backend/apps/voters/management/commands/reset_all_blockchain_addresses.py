from django.core.management.base import BaseCommand
from apps.voters.models import Voter, GANACHE_KEYS

class Command(BaseCommand):
    help = 'Force assign each user a unique blockchain address/private key from GANACHE_KEYS.'

    def handle(self, *args, **options):
        used = set()
        assigned = 0
        users = list(Voter.objects.all())
        for i, v in enumerate(users):
            if i < len(GANACHE_KEYS):
                addr, key = GANACHE_KEYS[i]
                v.blockchain_address = addr
                v.blockchain_private_key = key
                v.save(update_fields=['blockchain_address', 'blockchain_private_key'])
                used.add(addr.lower())
                assigned += 1
                self.stdout.write(self.style.SUCCESS(f'Force assigned {addr} to {v.username}'))
            else:
                self.stdout.write(self.style.WARNING(f'No more GANACHE_KEYS left for {v.username}'))
        self.stdout.write(self.style.SUCCESS(f'Done. Force assigned {assigned} users.')) 