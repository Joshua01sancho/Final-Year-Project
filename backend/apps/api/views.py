# backend/apps/api/views.py

from rest_framework import viewsets, generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.elections.models import Election, Candidate, Vote, ElectionResult
from apps.voters.models import VoterProfile, BiometricData
from .serializers import (
    ElectionSerializer, CandidateSerializer, VoteSerializer, UserSerializer,
    VoterProfileSerializer, BiometricDataSerializer, ElectionResultSerializer
)
from .permissions import IsAdminOrReadOnly, IsElectionManager, IsVoter

User = get_user_model()

# ViewSets for routers
class ElectionViewSet(viewsets.ModelViewSet):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [IsAdminOrReadOnly]

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [IsElectionManager]

class VoteViewSet(viewsets.ModelViewSet):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer
    permission_classes = [IsVoter]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Vote.objects.all()
        return Vote.objects.filter(voter=self.request.user)

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class VoterProfileViewSet(viewsets.ModelViewSet):
    queryset = VoterProfile.objects.all()
    serializer_class = VoterProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return VoterProfile.objects.all()
        return VoterProfile.objects.filter(user=self.request.user)

class BiometricDataViewSet(viewsets.ModelViewSet):
    queryset = BiometricData.objects.all()
    serializer_class = BiometricDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return BiometricData.objects.all()
        return BiometricData.objects.filter(user=self.request.user)

# API Views for custom endpoints
class ElectionResultView(generics.RetrieveAPIView):
    queryset = ElectionResult.objects.all()
    serializer_class = ElectionResultSerializer
    permission_classes = [permissions.IsAuthenticated]

class ElectionDecryptView(APIView):
    permission_classes = [IsElectionManager]
    def post(self, request, pk):
        return Response({'status': 'decrypted', 'results': {}})

class FaceLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return Response({'success': True, 'user_id': 1, 'username': 'demo'})

class FingerprintLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return Response({'success': True, 'user_id': 1, 'username': 'demo'})

class TwoFAVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return Response({'success': True})

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response({'success': True})

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        return Response({'total_elections': 0, 'total_votes': 0, 'total_users': 0, 'active_elections': 0})

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminElectionListView(generics.ListAPIView):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [permissions.IsAdminUser]

# Health check endpoint
def health_check(request):
    from django.http import JsonResponse
    return JsonResponse({'status': 'ok'})