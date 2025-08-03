# backend/apps/api/views.py

from rest_framework import viewsets, generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from apps.elections.models import Election, Candidate, Vote, ElectionResult
from apps.voters.models import Voter, BiometricData
from apps.elections.blockchain import BlockchainService
from apps.encryption.paillier import PaillierEncryption, VoteEncryption
from web3 import Web3
from .serializers import (
    ElectionSerializer, CandidateSerializer, VoteSerializer, UserSerializer,
    VoterSerializer, BiometricDataSerializer, ElectionResultSerializer
)
from .permissions import IsAdminOrReadOnly, IsElectionManager, IsVoter
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()

# Authentication Views
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })

class SignupView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        blockchain_address = request.data.get('blockchain_address', '')
        
        if not username or not email or not password:
            return Response(
                {'error': 'Username, email, and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )
                
                # Create voter profile
                voter = Voter.objects.create(
                    user=user,
                    blockchain_address=blockchain_address
                )
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    }
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to create user: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# ViewSets for routers
class ElectionViewSet(viewsets.ModelViewSet):
    queryset = Election.objects.filter(is_public=True)
    serializer_class = ElectionSerializer
    permission_classes = [permissions.AllowAny]

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

class VoterViewSet(viewsets.ModelViewSet):
    queryset = Voter.objects.all()
    serializer_class = VoterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Voter.objects.all()
        return Voter.objects.filter(user=self.request.user)

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
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        from apps.elections.models import Election, Candidate, ElectionResult
        try:
            # Get the election and its result
            election = Election.objects.get(pk=pk)
            result = ElectionResult.objects.get(election=election)
            # Get all candidates for this election
            candidates = election.get_candidates()
            # Get candidate results (dict of candidate_id: vote_count)
            candidate_results = result.candidate_results or {}
            
            # Return the data structure expected by the frontend
            return Response({
                'election': {
                    'id': election.id,
                    'title': election.title,
                    'description': election.description,
                    'start_date': election.start_date,
                    'end_date': election.end_date,
                    'status': election.status,
                    'candidates': [
                        {
                            'id': candidate.id,
                            'name': candidate.name,
                            'party': candidate.party,
                            'image_url': candidate.image_url,
                            'display_image': candidate.display_image,
                        } for candidate in candidates
                    ]
                },
                'results': {
                    'candidate_results': candidate_results,
                    'total_votes': result.total_votes,
                    'winners': []
                }
            })
        except Election.DoesNotExist:
            return Response({'error': 'Election not found'}, status=404)
        except ElectionResult.DoesNotExist:
            return Response({'error': 'Election result not found'}, status=404)

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

# Test authentication endpoint
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def test_auth(request):
    """
    Test endpoint to check authentication status
    """
    return Response({
        'authenticated': request.user.is_authenticated,
        'user_id': request.user.id if request.user.is_authenticated else None,
        'username': request.user.username if request.user.is_authenticated else None,
        'auth_header': request.headers.get('Authorization', 'No Authorization header'),
    })

# Voting endpoints (moved from elections app)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cast_vote(request):
    """
    Cast a vote in an election using the blockchain with Paillier encryption.
    
    Expected request data:
    {
        "election_id": "string",
        "candidate_id": "string"
    }
    """
    from apps.elections.models import Election  # Ensure Election is always in scope
    try:
        # Debug logging for user info
        print(f"[DEBUG] cast_vote called by user: id={request.user.id}, username={request.user.username}, blockchain_address={getattr(request.user, 'blockchain_address', None)}")
        # Check for blockchain address and private key
        if not getattr(request.user, 'blockchain_address', None):
            return Response({'error': 'User has no blockchain address assigned.'}, status=status.HTTP_400_BAD_REQUEST)
        if not getattr(request.user, 'blockchain_private_key', None):
            return Response({'error': 'User has no blockchain private key assigned.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate request data
        election_id = request.data.get('election_id')
        candidate_id = request.data.get('candidate_id')
        vote_value = int(candidate_id)  # Ensure vote_value is defined before use
        
        if not election_id or not candidate_id:
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize blockchain service
        blockchain = BlockchainService()
        
        # Get election details
        election = blockchain.get_election_details(election_id)
        if not election:
            return Response(
                {'error': 'Election not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if election is active
        if not election['is_active']:
            return Response(
                {'error': 'Election is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize Paillier encryption for vote encryption
        paillier = PaillierEncryption(key_size=512)
        vote_encryption = VoteEncryption()
        
        # Use the election's stored public key for encryption
        election_obj = Election.objects.get(id=election_id)
        public_key = (int(election_obj.public_key_n), int(election_obj.public_key_g))
        # Encrypt the vote using Paillier
        encrypted_vote = vote_encryption.encrypt_vote(vote_value, public_key)
        
        # Convert encrypted vote to hex for blockchain storage
        encrypted_vote_hex = hex(encrypted_vote)[2:]  # Remove '0x' prefix
        
        # Pad hex string to even length if necessary
        if len(encrypted_vote_hex) % 2 != 0:
            encrypted_vote_hex = '0' + encrypted_vote_hex
        
        encrypted_vote_bytes = bytes.fromhex(encrypted_vote_hex)
        
        # Ensure blockchain address is in checksum format
        voter_address = Web3.to_checksum_address(request.user.blockchain_address)
        
        # Create vote hash for blockchain
        w3 = Web3()
        vote_hash_full = w3.solidity_keccak(
            ['string', 'bytes', 'address'],
            [election_id, encrypted_vote_bytes, voter_address]
        )
        
        # Ensure vote_hash is exactly 32 bytes (bytes32)
        vote_hash_bytes = vote_hash_full[:32]
        
        # Debug prints
        print(f"DEBUG: election_id = {election_id} (type: {type(election_id)})")
        print(f"DEBUG: voter_address = {voter_address} (type: {type(voter_address)})")
        print(f"DEBUG: encrypted_vote_hex = {encrypted_vote_hex} (length: {len(encrypted_vote_hex)})")
        print(f"DEBUG: encrypted_vote_bytes = {encrypted_vote_bytes} (type: {type(encrypted_vote_bytes)})")
        print(f"DEBUG: vote_hash_full = {vote_hash_full} (length: {len(vote_hash_full)})")
        print(f"DEBUG: vote_hash_bytes = {vote_hash_bytes} (length: {len(vote_hash_bytes)})")
        
        # Cast vote on blockchain
        # Convert bytes to hex string with 0x prefix for blockchain
        encrypted_vote_hexstr = '0x' + encrypted_vote_bytes.hex()
        vote_hash_hexstr = '0x' + vote_hash_bytes.hex()
        
        success, tx_hash = blockchain.cast_vote(
            election_id=election_id,
            voter_address=voter_address,
            encrypted_vote=encrypted_vote_hexstr,  # Pass as hex string
            vote_hash=vote_hash_hexstr             # Pass as hex string
        )

        if not success:
            return Response(
                {'error': f'Failed to cast vote: {tx_hash}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save the vote in the database (link to user for now, anonymize after tally)
        import json
        try:
            election_obj = Election.objects.get(id=election_id)
            Vote.objects.create(
                election=election_obj,
                voter=request.user,
                encrypted_vote_data=json.dumps({
                    "encrypted_vote": encrypted_vote_hexstr,
                    "candidate_id": candidate_id
                }),
                vote_hash=vote_hash_hexstr[2:] if vote_hash_hexstr.startswith('0x') else vote_hash_hexstr,  # Remove 0x prefix
                blockchain_tx_hash=tx_hash,
                is_valid=True,
                validation_errors=[]
            )
        except Exception as vote_error:
            return Response(
                {'error': f'Failed to save vote: {vote_error}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'message': 'Vote cast successfully with Paillier encryption',
            'transaction_hash': tx_hash,
            'vote_hash': vote_hash_bytes.hex(),
            'encryption_info': {
                'method': 'Paillier',
                'public_key_n': str(public_key[0]),
                'public_key_g': str(public_key[1])
            }
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verify_vote(request, vote_hash):
    """
    Verify a vote on the blockchain using its hash.
    """
    try:
        blockchain = BlockchainService()
        vote_info = blockchain.verify_vote(vote_hash)
        
        if not vote_info:
            return Response(
                {'error': 'Vote not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(vote_info)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['GET'])
def user_me(request):
    """
    Get current user information
    """
    try:
        print("user_me called. request.user:", request.user, "is_authenticated:", request.user.is_authenticated)
        
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Return user data in the format expected by the frontend
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        }
        
        # Add blockchain address if available
        if hasattr(request.user, 'blockchain_address') and request.user.blockchain_address:
            user_data['blockchain_address'] = request.user.blockchain_address
        
        print("user_me returning:", user_data)
        return Response(user_data)
        
    except Exception as e:
        print(f"user_me error: {e}")
        return Response(
            {'error': 'Failed to get user data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )