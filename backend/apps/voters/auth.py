import os
import base64
import json
import requests
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.voters.models import VoterProfile, BiometricData

# Azure Face API configuration
AZURE_FACE_ENDPOINT = os.getenv('AZURE_FACE_ENDPOINT', 'https://your-face-api.cognitiveservices.azure.com/')
AZURE_FACE_KEY = os.getenv('AZURE_FACE_API_KEY', 'your-face-api-key')

def get_azure_face_client():
    """Get Azure Face API client"""
    headers = {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': AZURE_FACE_KEY
    }
    return headers

def detect_face(image_data):
    """Detect face in image using Azure Face API"""
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Call Azure Face API
        headers = get_azure_face_client()
        url = f"{AZURE_FACE_ENDPOINT}/face/v1.0/detect"
        params = {
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false',
            'returnFaceAttributes': 'age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,accessories'
        }
        
        response = requests.post(url, headers=headers, data=image_bytes, params=params)
        
        if response.status_code == 200:
            faces = response.json()
            if faces:
                return faces[0]  # Return first detected face
            else:
                return None
        else:
            print(f"Azure Face API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Face detection error: {e}")
        return None

def verify_face(face_id1, face_id2):
    """Verify if two faces belong to the same person"""
    try:
        headers = get_azure_face_client()
        headers['Content-Type'] = 'application/json'
        
        url = f"{AZURE_FACE_ENDPOINT}/face/v1.0/verify"
        data = {
            'faceId1': face_id1,
            'faceId2': face_id2
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('isIdentical', False), result.get('confidence', 0.0)
        else:
            print(f"Face verification error: {response.status_code} - {response.text}")
            return False, 0.0
            
    except Exception as e:
        print(f"Face verification error: {e}")
        return False, 0.0

@api_view(['POST'])
@permission_classes([AllowAny])
def face_login(request):
    """Handle face-based login"""
    try:
        # Get image data from request
        image_data = request.data.get('faceImage')
        if not image_data:
            return Response(
                {'error': 'Face image is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Detect face in the login image
        detected_face = detect_face(image_data)
        if not detected_face:
            return Response(
                {'error': 'No face detected in the image. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        login_face_id = detected_face['faceId']
        
        # Get all users with biometric data
        users_with_biometric = BiometricData.objects.filter(
            face_id__isnull=False
        ).select_related('user')
        
        # Try to match with registered faces
        best_match = None
        best_confidence = 0.0
        confidence_threshold = 0.6  # Minimum confidence for a match
        
        for biometric in users_with_biometric:
            if biometric.face_id:
                is_identical, confidence = verify_face(login_face_id, biometric.face_id)
                if is_identical and confidence > best_confidence:
                    best_match = biometric.user
                    best_confidence = confidence
        
        if best_match and best_confidence >= confidence_threshold:
            # Login successful
            refresh = RefreshToken.for_user(best_match)
            
            return Response({
                'success': True,
                'message': f'Login successful! Confidence: {best_confidence:.2f}',
                'data': {
                    'user': {
                        'id': best_match.id,
                        'username': best_match.username,
                        'email': best_match.email,
                        'first_name': best_match.first_name,
                        'last_name': best_match.last_name,
                        'blockchain_address': getattr(best_match, 'blockchain_address', '')
                    },
                    'token': str(refresh.access_token),
                    'refresh_token': str(refresh)
                }
            })
        else:
            return Response(
                {'error': 'Face not recognized. Please try again or contact support.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except Exception as e:
        print(f"Face login error: {e}")
        return Response(
            {'error': 'Login failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def face_signup(request):
    """Handle face-based user registration"""
    try:
        # Get form data
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        blockchain_address = request.data.get('blockchainAddress')
        face_image = request.data.get('faceImage')
        
        # Validate required fields
        if not all([username, email, password, first_name, last_name, blockchain_address, face_image]):
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Detect face in the registration image
        detected_face = detect_face(face_image)
        if not detected_face:
            return Response(
                {'error': 'No face detected in the image. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Set blockchain address
        user.blockchain_address = blockchain_address
        user.save()
        
        # Create biometric data
        BiometricData.objects.create(
            user=user,
            face_id=detected_face['faceId'],
            face_attributes=detected_face.get('faceAttributes', {}),
            biometric_type='face'
        )
        
        # Create voter profile
        VoterProfile.objects.create(
            user=user,
            is_verified=True,
            verification_method='face_recognition'
        )
        
        return Response({
            'success': True,
            'message': 'Account created successfully! You can now login with your face.',
            'data': {
                'user_id': user.id,
                'username': user.username
            }
        })
        
    except Exception as e:
        print(f"Face signup error: {e}")
        return Response(
            {'error': 'Registration failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def traditional_login(request):
    """Handle traditional username/password login"""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Login successful!',
                'data': {
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'blockchain_address': getattr(user, 'blockchain_address', '')
                    },
                    'token': str(refresh.access_token),
                    'refresh_token': str(refresh)
                }
            })
        else:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except Exception as e:
        print(f"Traditional login error: {e}")
        return Response(
            {'error': 'Login failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def traditional_signup(request):
    """Handle traditional user registration"""
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        blockchain_address = request.data.get('blockchainAddress')
        
        # Validate required fields
        if not all([username, email, password, first_name, last_name, blockchain_address]):
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Set blockchain address
        user.blockchain_address = blockchain_address
        user.save()
        
        # Create voter profile
        VoterProfile.objects.create(
            user=user,
            is_verified=False,
            verification_method='traditional'
        )
        
        return Response({
            'success': True,
            'message': 'Account created successfully! Please login.',
            'data': {
                'user_id': user.id,
                'username': user.username
            }
        })
        
    except Exception as e:
        print(f"Traditional signup error: {e}")
        return Response(
            {'error': 'Registration failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 