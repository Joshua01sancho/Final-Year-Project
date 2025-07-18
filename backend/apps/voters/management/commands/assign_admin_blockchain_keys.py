from django.core.management.base import BaseCommand
from apps.voters.models import Voter, GANACHE_KEYS

class Command(BaseCommand):
    help = 'Assign blockchain addresses and private keys to all superusers who do not have them.'

    def handle(self, *args, **options):
        superusers = Voter.objects.filter(is_superuser=True)
        used_addresses = set(Voter.objects.exclude(is_superuser=True).values_list('blockchain_address', flat=True))
        key_idx = 0
        assigned = 0
        for admin in superusers:
            if not admin.blockchain_address or not admin.blockchain_private_key:
                # Find the next unused address
                while key_idx < len(GANACHE_KEYS):
                    addr, key = GANACHE_KEYS[key_idx]
                    key_idx += 1
                    if addr not in used_addresses:
                        admin.blockchain_address = addr
                        admin.blockchain_private_key = key
                        admin.save(update_fields=['blockchain_address', 'blockchain_private_key'])
                        self.stdout.write(self.style.SUCCESS(f"Assigned {addr} to admin {admin.username}"))
                        assigned += 1
                        used_addresses.add(addr)
                        break
        if assigned == 0:
            self.stdout.write(self.style.WARNING('No superusers needed updating or no addresses left.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Done. Assigned {assigned} superusers.')) 