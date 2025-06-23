import requests
from django.conf import settings
from django.contrib.auth import authenticate
from .models import BiometricData
from django.contrib.auth.models import User
import base64

class FaceRecognitionService:
    def __init__(self):
        self.api_key = settings.AZURE_FACE_API_KEY
        self.endpoint = settings.AZURE_FACE_ENDPOINT
        self.detect_url = f"{self.endpoint}/face/v1.0/detect"
        self.verify_url = f"{self.endpoint}/face/v1.0/verify"

    def detect_face(self, image_bytes):
        headers = {
            'Ocp-Apim-Subscription-Key': self.api_key,
            'Content-Type': 'application/octet-stream',
        }
        params = {
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false',
        }
        response = requests.post(self.detect_url, params=params, headers=headers, data=image_bytes)
        response.raise_for_status()
        faces = response.json()
        if not faces:
            return None
        return faces[0]['faceId']

    def verify_face(self, face_id, stored_face_id):
        headers = {
            'Ocp-Apim-Subscription-Key': self.api_key,
            'Content-Type': 'application/json',
        }
        data = {
            'faceId1': face_id,
            'faceId2': stored_face_id,
        }
        response = requests.post(self.verify_url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result.get('isIdentical', False)

face_service = FaceRecognitionService()

def verify_fingerprint(user: User, fingerprint_bytes: bytes) -> bool:
    try:
        stored = BiometricData.objects.get(user=user, biometric_type='fingerprint')
        return stored.verify_data_hash(fingerprint_bytes)
    except BiometricData.DoesNotExist:
        return False

def verify_2fa(user: User, code: str) -> bool:
    profile = getattr(user, 'voter_profile', None)
    if not profile or not profile.two_fa_enabled:
        return False
    return code == '123456'  # Demo code 