from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from .blockchain import BlockchainService
from apps.encryption.paillier import PaillierEncryption, VoteEncryption
from web3 import Web3

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cast_vote(request):
    """
    Cast a vote in an election using the blockchain with Paillier encryption.
    
    Expected request data:
    {
        "election_id": "string",
        "candidate_id": "string"
    }
    """
    try:
        # Validate request data
        election_id = request.data.get('election_id')
        candidate_id = request.data.get('candidate_id')
        
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
            return Response(
                {'error': f'Failed to cast vote: {tx_hash}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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