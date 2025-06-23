from rest_framework import viewsets, generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from apps.elections.models import Election, Candidate, Vote, ElectionResult
from apps.voters.models import VoterProfile, BiometricData
from .serializers import (
    ElectionSerializer, CandidateSerializer, VoteSerializer, UserSerializer,
    VoterProfileSerializer, BiometricDataSerializer, ElectionResultSerializer
)
from .permissions import IsAdminOrReadOnly, IsElectionManager, IsVoter
from apps.voters.auth import face_service, verify_fingerprint, verify_2fa
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
import base64

class ElectionViewSet(viewsets.ModelViewSet):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class VoteViewSet(viewsets.ModelViewSet):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsVoter]

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class VoterProfileViewSet(viewsets.ModelViewSet):
    queryset = VoterProfile.objects.all()
    serializer_class = VoterProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

class BiometricDataViewSet(viewsets.ModelViewSet):
    queryset = BiometricData.objects.all()
    serializer_class = BiometricDataSerializer
    permission_classes = [permissions.IsAuthenticated]

class ElectionResultView(generics.RetrieveAPIView):
    queryset = ElectionResult.objects.all()
    serializer_class = ElectionResultSerializer
    permission_classes = [permissions.IsAuthenticated]

class ElectionDecryptView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    def post(self, request, pk):
        election = get_object_or_404(Election, pk=pk)
        # In production, trigger threshold decryption
        result = election.result
        result.decryption_status = 'completed'
        result.decryption_timestamp = timezone.now()
        result.save()
        return Response({'status': 'decrypted', 'results': result.candidate_results})

class FaceLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        image_data = request.data.get('imageData')
        if not image_data:
            return Response({'error': 'No image data provided'}, status=400)
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        face_id = face_service.detect_face(image_bytes)
        # Find user with matching face_id
        try:
            biometric = BiometricData.objects.get(face_id=face_id, biometric_type='face')
            user = biometric.user
            # Authenticate user (simulate login)
            return Response({'success': True, 'user_id': user.id, 'username': user.username})
        except BiometricData.DoesNotExist:
            return Response({'error': 'Face not recognized'}, status=401)

class FingerprintLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        fingerprint_data = request.data.get('fingerprintData')
        if not fingerprint_data:
            return Response({'error': 'No fingerprint data provided'}, status=400)
        fingerprint_bytes = base64.b64decode(fingerprint_data)
        # Find user with matching fingerprint
        for biometric in BiometricData.objects.filter(biometric_type='fingerprint'):
            if verify_fingerprint(biometric.user, fingerprint_bytes):
                user = biometric.user
                return Response({'success': True, 'user_id': user.id, 'username': user.username})
        return Response({'error': 'Fingerprint not recognized'}, status=401)

class TwoFAVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'No 2FA code provided'}, status=400)
        if verify_2fa(request.user, code):
            return Response({'success': True})
        return Response({'error': 'Invalid 2FA code'}, status=401)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        # Invalidate session/token (handled by frontend/JWT)
        return Response({'success': True, 'message': 'Logged out'})

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    def get(self, request):
        total_elections = Election.objects.count()
        total_votes = Vote.objects.count()
        total_users = User.objects.count()
        active_elections = Election.objects.filter(status='active').count()
        return Response({
            'total_elections': total_elections,
            'total_votes': total_votes,
            'total_users': total_users,
            'active_elections': active_elections,
        })

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class AdminElectionListView(generics.ListAPIView):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser] 