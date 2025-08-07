from django.core.management.base import BaseCommand
from apps.voters.models import Voter
from apps.voters.models import GANACHE_KEYS
import random

class Command(BaseCommand):
    help = 'Reset blockchain addresses and private keys for all users except admin'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to reset blockchain addresses',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will reset blockchain addresses and private keys for all users except admin.\n'
                    'Run with --confirm to proceed.'
                )
            )
            return

        # Get all users except admin
        users = Voter.objects.filter(is_superuser=False)
        
        if not users.exists():
            self.stdout.write(
                self.style.WARNING('No non-admin users found to reset.')
            )
            return

        self.stdout.write(f'Found {users.count()} non-admin users to reset...')

        # Get available keys
        available_keys = GANACHE_KEYS.copy()
        
        # Shuffle the keys to randomize assignment
        random.shuffle(available_keys)

        reset_count = 0
        for user in users:
            if available_keys:
                # Get next available key
                key_data = available_keys.pop()
                
                # Reset blockchain data
                user.blockchain_address = key_data['address']
                user.blockchain_private_key = key_data['private_key']
                user.save(update_fields=['blockchain_address', 'blockchain_private_key'])
                
                self.stdout.write(
                    f'Reset blockchain data for user "{user.username}" (ID: {user.id})'
                )
                reset_count += 1
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f'No more available keys for user "{user.username}" (ID: {user.id})'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully reset blockchain addresses for {reset_count} users.'
            )
        ) 