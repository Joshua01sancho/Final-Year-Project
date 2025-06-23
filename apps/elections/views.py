from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponseForbidden
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Election, Candidate, Vote, ElectionResult
from apps.encryption.paillier import vote_encryption
from apps.encryption.shamir import ThresholdDecryption
from django.utils import timezone
from django.db import transaction

class BallotView(LoginRequiredMixin, View):
    def get(self, request, election_id):
        election = get_object_or_404(Election, pk=election_id)
        if not election.is_active:
            return HttpResponseForbidden('Election is not active')
        candidates = election.get_candidates()
        ballot = [{
            'id': c.id,
            'name': c.name,
            'description': c.description,
            'image_url': c.image_url,
            'order': c.order,
        } for c in candidates]
        return JsonResponse({'election': election.title, 'ballot': ballot})

class ResultDecryptionView(LoginRequiredMixin, View):
    def post(self, request, election_id):
        election = get_object_or_404(Election, pk=election_id)
        if not request.user.is_staff:
            return HttpResponseForbidden('Only admins can decrypt results')
        result = election.result
        if result.decryption_status == 'completed':
            return JsonResponse({'status': 'already_decrypted', 'results': result.candidate_results})
        # Simulate threshold decryption (stub)
        threshold = ThresholdDecryption(total_trustees=5, threshold=3)
        # In production, collect partial decryptions from trustees
        # Here, we just mark as completed for demo
        result.decryption_status = 'completed'
        result.decryption_timestamp = timezone.now()
        result.save()
        return JsonResponse({'status': 'decrypted', 'results': result.candidate_results})

class ElectionLogic:
    @staticmethod
    def aggregate_votes(election: Election):
        """Aggregate encrypted votes for an election (homomorphic sum)"""
        votes = election.get_valid_votes()
        encrypted_votes = [int(v.encrypted_vote_data) for v in votes]
        if not encrypted_votes:
            return 0
        return vote_encryption.aggregate_votes(encrypted_votes, election.public_key)

    @staticmethod
    def get_winner(election: Election):
        result = election.result
        if not result or not result.candidate_results:
            return None
        max_votes = max(result.candidate_results.values())
        winners = [cid for cid, v in result.candidate_results.items() if v == max_votes]
        return winners 