import os
import base64
import json
from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Voter, BiometricData, VoterProfile
from .auth import detect_face

@staff_member_required
def registration_statistics(request):
    """Admin view for viewing registration statistics"""
    
    # Get basic statistics
    total_users = Voter.objects.count()
    users_with_faces = BiometricData.objects.filter(biometric_type='face').count()
    verified_users = VoterProfile.objects.filter(is_verified=True).count()
    
    # Recent registrations (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_registrations = Voter.objects.filter(date_joined__gte=thirty_days_ago).count()
    recent_face_registrations = BiometricData.objects.filter(
        biometric_type='face',
        created_at__gte=thirty_days_ago
    ).count()
    
    # Registration by day (last 7 days)
    seven_days_ago = timezone.now() - timedelta(days=7)
    daily_registrations = []
    for i in range(7):
        date = seven_days_ago + timedelta(days=i)
        count = Voter.objects.filter(
            date_joined__date=date.date()
        ).count()
        daily_registrations.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    # Face recognition statistics
    face_stats = BiometricData.objects.filter(biometric_type='face').aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(is_active=True)),
        inactive=Count('id', filter=Q(is_active=False))
    )
    
    context = {
        'total_users': total_users,
        'users_with_faces': users_with_faces,
        'verified_users': verified_users,
        'recent_registrations': recent_registrations,
        'recent_face_registrations': recent_face_registrations,
        'daily_registrations': daily_registrations,
        'face_stats': face_stats,
        'title': 'Registration Statistics',
        'opts': Voter._meta,
    }
    
    return render(request, 'admin/voters/registration_statistics.html', context)

@staff_member_required
def test_face_recognition(request):
    """Admin view for testing face recognition"""
    if request.method == 'POST':
        try:
            # Get test image
            test_image = request.FILES.get('test_image')
            if not test_image:
                messages.error(request, 'Please select a test image.')
                return redirect('admin:test_face_recognition')
            
            # Read image data
            image_data = test_image.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Detect face
            detected_face = detect_face(f"data:image/jpeg;base64,{image_base64}")
            
            if not detected_face:
                messages.error(request, 'No face detected in the test image.')
                return redirect('admin:test_face_recognition')
            
            # Get all registered faces
            registered_faces = BiometricData.objects.filter(
                biometric_type='face',
                face_id__isnull=False
            ).select_related('user')
            
            matches = []
            for biometric in registered_faces:
                if biometric.face_id:
                    # Here you would call the verify_face function
                    # For now, we'll just show the registered faces
                    matches.append({
                        'user': biometric.user,
                        'face_id': biometric.face_id,
                        'features': biometric.face_features
                    })
            
            context = {
                'test_face': detected_face,
                'matches': matches,
                'title': 'Face Recognition Test Results',
                'opts': BiometricData._meta,
            }
            
            return render(request, 'admin/voters/test_face_recognition_results.html', context)
            
        except Exception as e:
            messages.error(request, f'Error testing face recognition: {str(e)}')
            return redirect('admin:test_face_recognition')
    
    context = {
        'title': 'Test Face Recognition',
        'opts': BiometricData._meta,
    }
    
    return render(request, 'admin/voters/test_face_recognition.html', context) 