from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.elections.models import Election, Candidate, Vote, ElectionResult
from apps.voters.models import VoterProfile, BiometricData

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups', 'blockchain_address']

class VoterProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = VoterProfile
        fields = '__all__'

class BiometricDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricData
        exclude = ['encrypted_data']  # Do not expose raw biometric data

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'description', 'image_url', 'order', 'party', 'position', 'metadata']

class ElectionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    class Meta:
        model = Election
        fields = [
            'id', 'title', 'description', 'election_type', 'status', 'start_date', 'end_date',
            'created_at', 'updated_at', 'public_key_n', 'public_key_g', 'max_choices', 'allow_abstention',
            'require_2fa', 'require_biometric', 'blockchain_contract_address', 'blockchain_deployment_tx',
            'created_by', 'is_public', 'metadata', 'candidates', 'total_votes'
        ]

class VoteSerializer(serializers.ModelSerializer):
    voter = UserSerializer(read_only=True)
    class Meta:
        model = Vote
        fields = [
            'id', 'election', 'voter', 'encrypted_vote_data', 'vote_hash', 'blockchain_tx_hash',
            'blockchain_block_number', 'is_valid', 'validation_errors', 'created_at', 'confirmed_at',
            'face_verified', 'fingerprint_verified', 'two_fa_verified', 'ip_address', 'user_agent', 'audit_data'
        ]

class ElectionResultSerializer(serializers.ModelSerializer):
    election = ElectionSerializer(read_only=True)
    class Meta:
        model = ElectionResult
        fields = '__all__' 