from django.core.management.base import BaseCommand, CommandError
from apps.voters.models import Voter, GANACHE_KEYS

class Command(BaseCommand):
    help = 'Assign the next available blockchain address/private key to a user by username.'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the voter')

    def handle(self, *args, **options):
        username = options['username']
        try:
            voter = Voter.objects.get(username=username)
        except Voter.DoesNotExist:
            raise CommandError(f'User {username} does not exist')
        used = set(Voter.objects.exclude(pk=voter.pk).values_list('blockchain_address', flat=True))
        for addr, key in GANACHE_KEYS:
            if addr.lower() not in [a.lower() for a in used if a]:
                voter.blockchain_address = addr
                voter.blockchain_private_key = key
                voter.save(update_fields=['blockchain_address', 'blockchain_private_key'])
                self.stdout.write(self.style.SUCCESS(f'Assigned {addr} to {username}'))
                return
        self.stdout.write(self.style.WARNING('No available addresses left in GANACHE_KEYS')) 