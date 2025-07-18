import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.elections.models import Candidate

print('Candidate IDs for election 5:')
for c in Candidate.objects.filter(election_id=5):
    print(f'ID: {c.id}, Name: {c.name}') 