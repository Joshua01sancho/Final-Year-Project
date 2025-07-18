#!/usr/bin/env python
"""
Script to check elections in the database
"""
import os
import sys
import django
from datetime import datetime, timezone

# Add the backend directory to the Python path
sys.path.append('backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.elections.models import Election
from django.utils import timezone

def check_elections():
    print("=== Checking Elections in Database ===")
    
    elections = Election.objects.all()
    print(f"Total elections in database: {elections.count()}")
    
    if elections.count() == 0:
        print("No elections found in database!")
        return
    
    now = timezone.now()
    print(f"Current time: {now}")
    print()
    
    for election in elections:
        print(f"Election: {election.title}")
        print(f"  ID: {election.id}")
        print(f"  Database Status: {election.status}")
        print(f"  Is Public: {election.is_public}")
        print(f"  Start Date: {election.start_date}")
        print(f"  End Date: {election.end_date}")
        print(f"  Created At: {election.created_at}")
        print(f"  Created By: {election.created_by.username if election.created_by else 'None'}")
        
        # Calculate actual status
        if election.status == 'draft':
            actual_status = 'upcoming'
        elif election.status == 'active':
            if election.start_date <= now <= election.end_date:
                actual_status = 'active'
            elif now < election.start_date:
                actual_status = 'upcoming'
            else:
                actual_status = 'ended'
        elif election.status == 'paused':
            actual_status = 'upcoming'
        elif election.status == 'ended':
            actual_status = 'ended'
        elif election.status == 'cancelled':
            actual_status = 'ended'
        else:
            actual_status = 'upcoming'
        
        print(f"  Calculated Status: {actual_status}")
        print(f"  Is Active (model property): {election.is_active}")
        print(f"  Has Ended (model property): {election.has_ended}")
        print(f"  Total Candidates: {election.candidates.count()}")
        print()

if __name__ == "__main__":
    check_elections() 