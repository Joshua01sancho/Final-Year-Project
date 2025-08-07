import cv2
import numpy as np
import base64
from django.conf import settings
from django.contrib.auth import authenticate
from .models import BiometricData, Voter
import json

class OpenCVFaceRecognitionService:
    def __init__(self):
        # Load the face detection cascade
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
    def detect_face(self, image_bytes):
        """Detect face in image and return face features"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return None
                
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) == 0:
                return None
                
            # Get the largest face (assume it's the main face)
            largest_face = max(faces, key=lambda x: x[2] * x[3])
            x, y, w, h = largest_face
            
            # Extract face region
            face_roi = gray[y:y+h, x:x+w]
            
            # Resize to standard size for comparison
            face_roi = cv2.resize(face_roi, (100, 100))
            
            # Apply histogram equalization for better feature extraction
            face_roi = cv2.equalizeHist(face_roi)
            
            # Convert to feature vector
            features = face_roi.flatten().astype(np.float32)
            
            return features
            
        except Exception as e:
            print(f"Face detection error: {e}")
            return None
    
    def compare_faces(self, features1, features2, threshold=0.85):
        """Compare two face feature vectors using cosine similarity"""
        try:
            if features1 is None or features2 is None:
                return False
                
            # Normalize features
            features1 = features1 / np.linalg.norm(features1)
            features2 = features2 / np.linalg.norm(features2)
            
            # Calculate cosine similarity
            similarity = np.dot(features1, features2)
            
            return similarity >= threshold
            
        except Exception as e:
            print(f"Face comparison error: {e}")
            return False

face_service = OpenCVFaceRecognitionService()

def verify_fingerprint(user: Voter, fingerprint_bytes: bytes) -> bool:
    try:
        stored = BiometricData.objects.get(user=user, biometric_type='fingerprint')
        return stored.verify_data_hash(fingerprint_bytes)
    except BiometricData.DoesNotExist:
        return False

def verify_2fa(user: Voter, code: str) -> bool:
    profile = getattr(user, 'voter_profile', None)
    if not profile or not profile.two_fa_enabled:
        return False
    return code == '123456'  # Demo code

def traditional_login(username, password):
    """Traditional login with username/password"""
    try:
        # Try Django's authenticate first
        user = authenticate(username=username, password=password)
        
        # If that fails, try manual lookup with Voter model
        if not user:
            try:
                user = Voter.objects.get(username=username)
                if user.check_password(password):
                    pass
                else:
                    user = None
            except Voter.DoesNotExist:
                user = None
        
        return user
    except Exception as e:
        print(f"Login error: {e}")
        return None

def traditional_signup(username, email, password, first_name='', last_name=''):
    """Traditional signup with username/password"""
    try:
        # Check if user already exists
        if Voter.objects.filter(username=username).exists():
            return None, "Username already exists"
        
        if Voter.objects.filter(email=email).exists():
            return None, "Email already exists"
        
        # Create user
        user = Voter.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            face_registration_completed=False
        )
        
        return user, "User created successfully"
    except Exception as e:
        print(f"Signup error: {e}")
        return None, str(e)

def add_face_auth_to_user(user_id, face_image_data):
    """Add face authentication to user"""
    try:
        user = Voter.objects.get(id=user_id)
        
        # Decode base64 image
        image_bytes = base64.b64decode(face_image_data.split(',')[1])
        
        # Detect face features
        face_features = face_service.detect_face(image_bytes)
        
        if face_features is None:
            return False, "No face detected in image. Please ensure your face is clearly visible."
        
        # Store face features
        biometric_data, created = BiometricData.objects.get_or_create(
            user=user,
            biometric_type='face',
            defaults={'data_hash': face_features.tobytes()}
        )
        
        if not created:
            biometric_data.data_hash = face_features.tobytes()
            biometric_data.save()
        
        # Mark user as having completed face registration
        user.face_registration_completed = True
        user.save()
        
        return True, "Face registration completed successfully"
        
    except Exception as e:
        print(f"Face registration error: {e}")
        return False, str(e)

def face_login_local(face_image_data):
    """Face login using OpenCV face recognition"""
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(face_image_data.split(',')[1])
        
        # Detect face features
        face_features = face_service.detect_face(image_bytes)
        
        if face_features is None:
            return None, "No face detected in image. Please ensure your face is clearly visible."
        
        # Compare with stored faces
        for biometric in BiometricData.objects.filter(biometric_type='face'):
            stored_features = np.frombuffer(biometric.data_hash, dtype=np.float32)
            
            if face_service.compare_faces(face_features, stored_features):
                user = biometric.user
                if user.face_registration_completed:
                    return user, "Face login successful"
        
        return None, "Face not recognized. Please try again or use traditional login."
        
    except Exception as e:
        print(f"Face login error: {e}")
        return None, str(e) 