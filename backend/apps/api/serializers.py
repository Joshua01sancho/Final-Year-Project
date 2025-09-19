from rest_framework import serializers
from django.contrib.auth.models import User
from apps.voters.models import Voter, BiometricData
from apps.elections.models import Election, Candidate, Vote, ElectionResult

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class VoterSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Voter
        fields = ['id', 'user', 'blockchain_address', 'national_id', 'is_verified', 'created_at']

class BiometricDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricData
        exclude = ['encrypted_data']  # Do not expose raw biometric data

class CandidateSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'description', 'image', 'image_url', 'display_image', 'order', 'party', 'position', 'metadata']
    
    def get_display_image(self, obj):
        """Get the display image URL - prioritize uploaded image over URL"""
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        elif obj.image_url:
            return obj.image_url
        return None

class ElectionSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    total_voters = serializers.SerializerMethodField()
    
    class Meta:
        model = Election
        fields = [
            'id', 'title', 'description', 'election_type', 'status', 
            'start_date', 'end_date', 'max_choices', 'allow_abstention',
            'require_2fa', 'require_biometric', 'is_public', 'candidates',
            'total_votes', 'total_voters', 'created_at', 'updated_at'
        ]
    
    def get_total_votes(self, obj):
        """Get total number of valid votes for this election"""
        return obj.votes.filter(is_valid=True).count()
    
    def get_total_voters(self, obj):
        """Get total number of eligible voters for this election"""
        from apps.voters.models import VoterEligibility
        eligible_voters = VoterEligibility.objects.filter(election=obj, is_eligible=True).count()
        if eligible_voters == 0:
            # Fallback to total users in the system
            from django.contrib.auth import get_user_model
            User = get_user_model()
            return User.objects.count()
        return eligible_voters

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = [
            'id', 'election', 'voter', 'encrypted_vote_data', 'vote_hash',
            'blockchain_tx_hash', 'is_valid', 'created_at', 'confirmed_at',
            'face_verified', 'fingerprint_verified', 'two_fa_verified'
        ]
        read_only_fields = ['vote_hash', 'blockchain_tx_hash', 'confirmed_at']

class ElectionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectionResult
        fields = [
            'id', 'election', 'total_votes', 'candidate_results',
            'decryption_status', 'decryption_timestamp', 'created_at', 'updated_at'
        ]
        read_only_fields = ['decryption_timestamp', 'created_at', 'updated_at'] 