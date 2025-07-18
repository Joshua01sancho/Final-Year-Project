from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from .blockchain import BlockchainService
from apps.encryption.paillier import PaillierEncryption, VoteEncryption
from web3 import Web3
from .models import Election, ElectionResult
from django.utils import timezone
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cast_vote(request):
    print("[VOTE DEBUG] Entered cast_vote endpoint")
    """
    Cast a vote in an election using the blockchain with Paillier encryption.
    
    Expected request data:
    {
        "election_id": "string",
        "candidate_id": "string"
    }
    """
    try:
        # DEBUG: Print user info
        print('DEBUG: Voting user:', request.user.username)
        print('DEBUG: User blockchain address:', getattr(request.user, 'blockchain_address', None))
        print('DEBUG: User blockchain private key:', getattr(request.user, 'blockchain_private_key', None))
        # Validate request data
        election_id = request.data.get('election_id')
        candidate_id = request.data.get('candidate_id')
        
        if not election_id or not candidate_id:
            print("[VOTE RETURN] Missing required fields, returning 400")
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize blockchain service
        blockchain = BlockchainService()
        
        # Get election details
        election = blockchain.get_election_details(election_id)
        if not election:
            print("[VOTE RETURN] Election not found, returning 404")
            return Response(
                {'error': 'Election not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if election is active
        if not election['is_active']:
            print("[VOTE RETURN] Election is not active, returning 400")
            return Response(
                {'error': 'Election is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize Paillier encryption for vote encryption
        paillier = PaillierEncryption(key_size=512)
        vote_encryption = VoteEncryption()
        
        # For now, we'll use a simple key pair. In production, this should be
        # generated during election setup and distributed securely
        key_pair = paillier.generate_key_pair()
        
        # Convert candidate_id to integer for encryption
        vote_value = int(candidate_id)
        
        # Encrypt the vote using Paillier
        encrypted_vote = vote_encryption.encrypt_vote(vote_value, key_pair.public_key)
        
        # Convert encrypted vote to hex for blockchain storage
        encrypted_vote_hex = hex(encrypted_vote)[2:]  # Remove '0x' prefix
        
        # Create vote hash for blockchain
        w3 = Web3()
        vote_hash = w3.solidity_keccak(
            ['string', 'bytes', 'address'],
            [election_id, encrypted_vote_hex.encode(), request.user.blockchain_address]
        ).hex()
        
        # Cast vote on blockchain
        success, tx_hash = blockchain.cast_vote(
            election_id=election_id,
            voter_address=request.user.blockchain_address,
            encrypted_vote=encrypted_vote_hex.encode(),
            vote_hash=vote_hash
        )
        
        if not success:
            print(f"[VOTE RETURN] Failed to cast vote on blockchain: {tx_hash}, returning 400")
            return Response(
                {'error': f'Failed to cast vote: {tx_hash}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the vote in the database
        from apps.elections.models import Vote, Election
        election_obj = Election.objects.get(id=election_id)
        print("[VOTE DEBUG] About to create Vote object")
        print(f"[VOTE DEBUG] request.user: {request.user} (type: {type(request.user)})")
        existing_votes = Vote.objects.filter(election=election_obj, voter=request.user)
        print(f"[VOTE DEBUG] Existing votes for this election and user: {existing_votes.count()}")
        try:
            vote = Vote.objects.create(
                election=election_obj,
                voter=request.user,
                encrypted_vote_data=json.dumps({
                    "encrypted_vote": encrypted_vote_hex,
                    "candidate_id": candidate_id
                }),
                vote_hash=vote_hash,
                blockchain_tx_hash=tx_hash,
                is_valid=True,
                validation_errors=[]
            )
            print(f"[VOTE LOG] Vote object created: id={vote.id}, election={election_id}, user={request.user.id}, vote_hash={vote_hash}")
            # Anonymize the vote after creation
            vote.voter = None
            vote.save()
        except Exception as vote_error:
            print(f"[VOTE RETURN] Failed to create Vote object: {vote_error}, returning 500")
            return Response(
                {'error': f'Failed to save vote: {vote_error}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        print("[VOTE DEBUG] Returning success response")
        return Response({
            'message': 'Vote cast successfully with Paillier encryption',
            'transaction_hash': tx_hash,
            'vote_hash': vote_hash,
            'encryption_info': {
                'method': 'Paillier',
                'public_key_n': str(key_pair.public_key[0]),
                'public_key_g': str(key_pair.public_key[1])
            }
        })
        
    except Exception as e:
        print(f"[VOTE RETURN] Exception in cast_vote: {e}, returning 500")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
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

@api_view(['GET'])
@permission_classes([AllowAny])
def list_elections(request):
    """List all public elections (for frontend display)"""
    try:
        elections = Election.objects.filter(is_public=True).order_by('-created_at')
        data = []
        
        print(f"DEBUG: Found {elections.count()} public elections")
        
        for election in elections:
            # Check if user has voted in this election
            has_voted = False
            voted_candidate = None
            vote_hash = None
            blockchain_tx_hash = None
            if request.user.is_authenticated:
                vote_obj = election.votes.filter(voter=request.user, is_valid=True).first()
                has_voted = bool(vote_obj)
                if vote_obj:
                    try:
                        vote_data = json.loads(vote_obj.encrypted_vote_data)
                        # Support both single and multiple choice
                        if isinstance(vote_data, dict) and 'candidate_id' in vote_data:
                            voted_candidate = vote_data['candidate_id']
                        elif isinstance(vote_data, dict) and 'candidate_ids' in vote_data:
                            voted_candidate = vote_data['candidate_ids']
                        else:
                            voted_candidate = None
                    except Exception as e:
                        voted_candidate = None
                    vote_hash = vote_obj.vote_hash
                    blockchain_tx_hash = vote_obj.blockchain_tx_hash
            
            # Calculate the proper status for frontend
            now = timezone.now()
            if election.status == 'draft':
                status = 'upcoming'
            elif election.status == 'active':
                if election.start_date <= now <= election.end_date:
                    status = 'active'
                elif now < election.start_date:
                    status = 'upcoming'
                else:
                    status = 'ended'
            elif election.status == 'paused':
                status = 'upcoming'
            elif election.status == 'ended':
                status = 'ended'
            elif election.status == 'cancelled':
                status = 'ended'
            else:
                status = 'upcoming'
            
            print(f"DEBUG: Election '{election.title}' - DB status: {election.status}, Calculated status: {status}, Start: {election.start_date}, End: {election.end_date}, Now: {now}")
            
            election_data = {
                'id': election.id,
                'title': election.title,
                'description': election.description,
                'status': status,  # Use calculated status
                'start_date': election.start_date,
                'end_date': election.end_date,
                'created_by': election.created_by.username if election.created_by else None,
                'has_voted': has_voted,
                'voted_candidate': voted_candidate,
                'vote_hash': vote_hash,
                'blockchain_tx_hash': blockchain_tx_hash,
                'total_candidates': election.candidates.count(),
                'type': election.election_type,
                'instructions': f"Select {election.max_choices} candidate{'s' if election.max_choices > 1 else ''} for this {election.election_type} choice election."
            }
            data.append(election_data)
            
        print(f"DEBUG: Returning {len(data)} elections to frontend")
        return Response({'elections': data})
    except Exception as e:
        print(f"Error in list_elections: {e}")
        return Response(
            {'error': 'Failed to fetch elections'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_election_results(request, election_id):
    try:
        election = Election.objects.get(id=election_id)
        result = ElectionResult.objects.get(election=election)
        return Response({
            'election': election.title,
            'total_votes': result.total_votes,
            'candidate_results': result.candidate_results,  # {candidate_id: vote_count}
        })
    except ElectionResult.DoesNotExist:
        return Response({'error': 'Results not available yet.'}, status=404)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found.'}, status=404) 