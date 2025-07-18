from django.core.management.base import BaseCommand
from apps.voters.models import Voter

# Paste your Ganache address/private key pairs here (first is admin)
GANACHE_KEYS = [
    ("0xE2E445F2053470497A96ff3ae1386dcc7DAbCf33", "0x6d6977dd4ab13967cbb7258119317f008c9a2cda2cedb6e04b5321c7c6ec64f"),
    ("0x447588dA5593dA72bdBC607f50C1C87382FdCA58", "0x8d045572920efaf486996e6a3cd8de6539f2d4d18895b969eb703aa6"),
    ("0xff26aEF8E8315c2CD84846a3e4312f2D71B51A7E", "0xed1e9762349ab218d654cc55a6d67c77f9e662964a859d8148876ad04c381f5"),
    ("0x6351b5828FF8665b6fbfa9509acaC81EFc4c5393", "0x85eed0e251de7678937808e5c8da428b1a5ae928f5ef563f47f958e1ae05a"),
    ("0x99945C28839B81BedF234f20a83C8beB5e43af70", "0x987d8f2689286f9efc9e7a4b1f2b79da7e6d7138ab2c7ecb5e97e2ec"),
    ("0x656E72ee6B6Ff9bE9046f8393E7b165195A88376", "0x49c45f7f1921ad9ab8adba79bf582e04a9146c785c7b0452ff8f8e2"),
    ("0x1d1eCD6E5614Fc51a997bF79e1A95a0A8957267E", "0x8d0e6f7ad7a112dc9459070cfe6fa8a1ec5840c2b4d0c1e6f3cf5b2e50c"),
    ("0x33f6b6eBfB5B9F993c5233920cE5B", "0x6e5d8b3c1f7c15ce3b3880194d7903b7dc7a4ce298c7cbcbc52a"),
    ("0xA0f2c7e5e7e7e6b6d1880233607c92d9bf5dbd75334616a", "0x7e5d8b3c1f7c15ce3b3880194d7903b7dc7a4ce298c7cbcbc52a"),
    ("0xE4b5A9d5B5FBF3f4f3614b2fa102", "0x8d0e6f7ad7a112dc9459070cfe6fa8a1ec5840c2b4d0c1e6f3cf5b2e50c"),
]

class Command(BaseCommand):
    help = 'Assign Ganache addresses and private keys to users. First is admin, rest to users in order.'

    def handle(self, *args, **kwargs):
        users = list(Voter.objects.all().order_by('date_joined'))
        if not users:
            self.stdout.write(self.style.ERROR('No users found.'))
            return
        if len(users) > len(GANACHE_KEYS):
            self.stdout.write(self.style.ERROR('Not enough Ganache keys for all users!'))
            return
        # Assign first key to admin
        admin = Voter.objects.filter(username='admin').first()
        if admin and not admin.blockchain_address:
            admin.blockchain_address, admin.blockchain_private_key = GANACHE_KEYS[0]
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'Assigned admin: {admin.blockchain_address}'))
        # Assign rest to other users
        key_idx = 1
        for user in users:
            if user.username == 'admin':
                continue
            if not user.blockchain_address:
                if key_idx >= len(GANACHE_KEYS):
                    self.stdout.write(self.style.WARNING(f'No more keys for user {user.username}'))
                    continue
                user.blockchain_address, user.blockchain_private_key = GANACHE_KEYS[key_idx]
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Assigned {user.username}: {user.blockchain_address}'))
                key_idx += 1
            else:
                self.stdout.write(f'Skipped {user.username} (already has address)')
        self.stdout.write(self.style.SUCCESS('Done assigning Ganache keys.')) 