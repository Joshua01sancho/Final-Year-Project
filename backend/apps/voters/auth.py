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
from apps.voters.models import VoterProfile, BiometricData, Voter
import traceback
import numpy as np
import cv2
from PIL import Image
import io
import hashlib

# Azure Face API configuration (keeping for fallback)
AZURE_FACE_ENDPOINT = os.getenv('AZURE_FACE_ENDPOINT', 'https://your-face-api.cognitiveservices.azure.com/')
AZURE_FACE_KEY = os.getenv('AZURE_FACE_API_KEY', 'your-face-api-key')

# Local face recognition configuration
USE_LOCAL_FACE_RECOGNITION = os.getenv('USE_LOCAL_FACE_RECOGNITION', 'true').lower() == 'true'

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

def extract_face_features_local(image_data):
    """Extract face features using local processing"""
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Load OpenCV face detector
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return None
        
        # Get the largest face (assumed to be the main subject)
        largest_face = max(faces, key=lambda x: x[2] * x[3])
        x, y, w, h = largest_face
        
        # Extract face region
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize to standard size for comparison
        face_roi = cv2.resize(face_roi, (128, 128))
        
        # Convert to feature vector (simple histogram)
        hist = cv2.calcHist([face_roi], [0], None, [256], [0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        
        return {
            'face_id': base64.b64encode(hist.tobytes()).decode('utf-8'),
            'confidence': 1.0
        }
        
    except Exception as e:
        print(f"Local face detection error: {e}")
        return None

def compare_faces_local(face1_features, face2_features):
    """Compare two face feature vectors"""
    try:
        # Decode feature vectors
        hist1 = np.frombuffer(base64.b64decode(face1_features), dtype=np.float32)
        hist2 = np.frombuffer(base64.b64decode(face2_features), dtype=np.float32)
        
        # Calculate similarity using correlation
        correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        
        # Convert correlation to similarity score (0-1)
        similarity = (correlation + 1) / 2
        
        return similarity > 0.7, similarity  # Threshold of 0.7
        
    except Exception as e:
        print(f"Face comparison error: {e}")
        return False, 0.0

@api_view(['POST'])
@permission_classes([AllowAny])
def face_login_local(request):
    """Handle face-based login using local processing"""
    try:
        # Get image data from request
        image_data = request.data.get('faceImage')
        if not image_data:
            return Response(
                {'error': 'Face image is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract face features from login image
        login_face_features = extract_face_features_local(image_data)
        if not login_face_features:
            return Response(
                {'error': 'No face detected in the image. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all users with biometric data
        users_with_biometric = BiometricData.objects.filter(
            face_id__isnull=False
        ).select_related('user')
        
        # Try to match with registered faces
        best_match = None
        best_confidence = 0.0
        confidence_threshold = 0.7  # Minimum confidence for a match
        
        for biometric in users_with_biometric:
            if biometric.face_id:
                is_identical, confidence = compare_faces_local(
                    login_face_features['face_id'], 
                    biometric.face_id
                )
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
        print(f"Local face login error: {e}")
        return Response(
            {'error': 'Login failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def face_login(request):
    """Handle face-based login (Azure or local based on configuration)"""
    if USE_LOCAL_FACE_RECOGNITION:
        return face_login_local(request)
    else:
        # Original Azure implementation
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
def face_signup_local(request):
    """Handle face-based user registration using local processing"""
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
        if not all([username, email, password, first_name, last_name, face_image]):
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if Voter.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Voter.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract face features from the registration image
        face_features = extract_face_features_local(face_image)
        if not face_features:
            return Response(
                {'error': 'No face detected in the image. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user using Voter model
        user = Voter.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Set blockchain address if provided
        if blockchain_address:
            user.blockchain_address = blockchain_address
            user.save()
        
        # Create biometric data with local face features
        dummy_encrypted_data = b'dummy_encrypted_data_for_testing'
        data_hash = hashlib.sha256(dummy_encrypted_data).hexdigest()
        
        BiometricData.objects.create(
            user=user,
            biometric_type='face',
            encrypted_data=dummy_encrypted_data,
            data_hash=data_hash,
            face_id=face_features['face_id'],
            face_features={'confidence': face_features['confidence']}
        )
        
        # Create voter profile
        try:
            if not hasattr(user, 'profile'):
                VoterProfile.objects.create(
                    user=user,
                    is_verified=True,
                    national_id=''  # Set empty for now, can be updated later
                )
        except Exception as profile_error:
            print(f"Profile creation error: {profile_error}")
            # Continue even if profile creation fails
        
        return Response({
            'success': True,
            'message': 'Account created successfully! You can now login with your face.',
            'data': {
                'user_id': user.id,
                'username': user.username
            }
        })
        
    except Exception as e:
        print(f"Local face signup error: {e}")
        return Response(
            {'error': 'Registration failed. Please try again.'},
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
        if Voter.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Voter.objects.filter(email=email).exists():
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
        
        # Create user using Voter model
        user = Voter.objects.create_user(
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
        # Create dummy encrypted data for now (in production, this should be properly encrypted)
        dummy_encrypted_data = b'dummy_encrypted_data_for_testing'
        data_hash = hashlib.sha256(dummy_encrypted_data).hexdigest()
        
        BiometricData.objects.create(
            user=user,
            biometric_type='face',
            encrypted_data=dummy_encrypted_data,
            data_hash=data_hash,
            face_id=detected_face['faceId'],
            face_features=detected_face.get('faceAttributes', {})
        )
        
        # Create voter profile
        try:
            if not hasattr(user, 'profile'):
                VoterProfile.objects.create(
                    user=user,
                    is_verified=True,
                    national_id=''  # Set empty for now, can be updated later
                )
        except Exception as profile_error:
            print(f"Profile creation error: {profile_error}")
            # Continue even if profile creation fails
        
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
        print(f"DEBUG: traditional_login called with data: {request.data}")
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"DEBUG: username={username}, password={'*' * len(password) if password else 'None'}")
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to authenticate with Voter model first, then fallback to User
        user = authenticate(username=username, password=password)
        print(f"DEBUG: authenticate() returned: {user}")
        
        # If authentication fails, try to find the user manually
        if not user:
            try:
                user = Voter.objects.get(username=username)
                print(f"DEBUG: Found user in database: {user.username}")
                if user.check_password(password):
                    print(f"DEBUG: Password check passed")
                    # User found and password is correct
                    pass
                else:
                    print(f"DEBUG: Password check failed")
                    user = None
            except Voter.DoesNotExist:
                print(f"DEBUG: User {username} not found in database")
                user = None
        
        if user:
            # Check if face registration is completed
            if not user.face_registration_completed:
                return Response(
                    {'error': 'Face registration required. Please complete face registration before logging in.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
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
    """Handle traditional user registration - Debug mode: return full error trace"""
    try:
        print('DEBUG: traditional_signup called')
        print('DEBUG: request.data =', dict(request.data))
        print('DEBUG: request.data keys =', list(request.data.keys()))
        
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        
        print(f'DEBUG: username={username}, email={email}, password={password}, first_name={first_name}, last_name={last_name}')
        
        # Validate required fields
        if not username:
            print('DEBUG: Username is missing')
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            print('DEBUG: Email is missing')
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            print('DEBUG: Password is missing')
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not first_name:
            print('DEBUG: First name is missing')
            return Response({'error': 'First name is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not last_name:
            print('DEBUG: Last name is missing')
            return Response({'error': 'Last name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print('DEBUG: All required fields are present')
        
        # Check if user already exists
        if Voter.objects.filter(username=username).exists():
            print(f'DEBUG: Username {username} already exists')
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Voter.objects.filter(email=email).exists():
            print(f'DEBUG: Email {email} already registered')
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print('DEBUG: Creating user...')
        
        # Create user using Voter model
        user = Voter.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        print(f'DEBUG: User created successfully with ID: {user.id}')
        
        # Create voter profile with minimal data
        try:
            # Check if profile already exists
            if not hasattr(user, 'profile'):
                VoterProfile.objects.create(
                    user=user,
                    is_verified=True,  # Mark as verified for testing
                    national_id='TEST' + str(user.id)  # Use a unique test ID
                )
                print('DEBUG: VoterProfile created successfully')
        except Exception as profile_error:
            print(f"Profile creation error: {profile_error}")
            # Continue even if profile creation fails
        
        print('DEBUG: Returning success response')
        
        return Response({
            'success': True,
            'message': 'Account created successfully! Please login.',
            'data': {
                'user_id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f"Traditional signup error: {e}\n{tb}")
        return Response(
            {'error': f'Registration failed: {str(e)}', 'traceback': tb},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 

@api_view(['POST'])
@permission_classes([AllowAny])
def add_face_auth_to_user(request):
    """Add face authentication to an existing user account"""
    try:
        print('DEBUG: add_face_auth_to_user called')
        print('DEBUG: request.data keys =', list(request.data.keys()))
        print('DEBUG: face_image length =', len(request.data.get('face_image', '')) if request.data.get('face_image') else 'None')
        
        # Get the face image from request
        face_image = request.data.get('face_image')
        if not face_image:
            print('DEBUG: No face_image in request')
            return Response(
                {'error': 'Face image is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user from request (should be authenticated) or from user_id parameter
        user = request.user
        if not user.is_authenticated:
            # Try to get user from user_id parameter (for signup flow)
            user_id = request.data.get('user_id')
            print(f'DEBUG: User not authenticated, trying user_id: {user_id}')
            if user_id:
                try:
                    user = Voter.objects.get(id=user_id)
                    print(f'DEBUG: Found user: {user.username}')
                except Voter.DoesNotExist:
                    print(f'DEBUG: User with ID {user_id} not found')
                    return Response(
                        {'error': 'User not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                print('DEBUG: No user_id provided')
                return Response(
                    {'error': 'Authentication required or user_id must be provided'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        print(f'DEBUG: Adding face auth for user: {user.username}')
        
        # Check if user already has face authentication
        existing_biometric = BiometricData.objects.filter(user=user).first()
        if existing_biometric:
            print('DEBUG: User already has face authentication')
            return Response(
                {'error': 'User already has face authentication registered'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract face features using local processing
        try:
            print('DEBUG: Starting face feature extraction...')
            face_features = extract_face_features_local(face_image)
            print('DEBUG: Face features extracted successfully')
            if not face_features:
                print('DEBUG: No face detected in image')
                return Response(
                    {'error': 'No face detected in the image. Please try again.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            print('DEBUG: Face features:', face_features)
        except Exception as e:
            print(f'DEBUG: Face feature extraction failed: {e}')
            return Response(
                {'error': 'Unable to process face image. Please try again.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create biometric data entry
        try:
            # Convert face features to JSON string for storage
            face_features_json = json.dumps(face_features)
            print('DEBUG: Creating BiometricData...')
            biometric_data = BiometricData.objects.create(
                user=user,
                biometric_type='face',
                encrypted_data=face_features_json.encode('utf-8'),  # Encode to bytes for BinaryField
                data_hash=hashlib.sha256(face_features_json.encode('utf-8')).hexdigest(),
                face_id=face_features['face_id'],  # Store face_id for face recognition
                face_features={'confidence': face_features['confidence']}  # Store face features
            )
            print(f'DEBUG: BiometricData created with ID: {biometric_data.id}')
        except Exception as e:
            print(f'DEBUG: BiometricData creation failed: {e}')
            return Response(
                {'error': 'Failed to save face data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Mark face registration as completed
        user.face_registration_completed = True
        user.save(update_fields=['face_registration_completed'])
        
        print('DEBUG: Face authentication added successfully')
        
        return Response({
            'success': True,
            'message': 'Face authentication added successfully!',
            'data': {
                'user_id': user.id,
                'username': user.username,
                'biometric_id': biometric_data.id
            }
        })
        
    except Exception as e:
        tb = traceback.format_exc()
        print(f'DEBUG: add_face_auth_to_user error: {e}')
        print(f'DEBUG: Traceback: {tb}')
        return Response(
            {'error': f'Failed to add face authentication: {str(e)}', 'traceback': tb},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 