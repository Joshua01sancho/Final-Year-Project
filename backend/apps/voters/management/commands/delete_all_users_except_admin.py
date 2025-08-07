from django.core.management.base import BaseCommand
from apps.voters.models import Voter

class Command(BaseCommand):
    help = 'Delete all users except admin'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all users except admin',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete ALL users except admin.\n'
                    'Run with --confirm to proceed.'
                )
            )
            return

        # Get all users except admin
        users = Voter.objects.filter(is_superuser=False)
        
        if not users.exists():
            self.stdout.write(
                self.style.WARNING('No non-admin users found to delete.')
            )
            return

        user_count = users.count()
        self.stdout.write(f'Found {user_count} non-admin users to delete...')

        # Delete all non-admin users
        deleted_count, _ = users.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {deleted_count} users.'
            )
        ) 