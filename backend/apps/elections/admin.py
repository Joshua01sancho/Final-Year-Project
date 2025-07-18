from django.contrib import admin, messages
from .models import Election, Candidate, Vote, ElectionResult, ElectionAuditLog
from .blockchain import BlockchainService
from apps.encryption.paillier import PaillierEncryption
from functools import reduce
import json

@admin.action(description="Decrypt and tally votes for selected elections")
def decrypt_tally(modeladmin, request, queryset):
    for election in queryset:
        votes = Vote.objects.filter(election=election, is_valid=True)
        if not votes.exists():
            messages.warning(request, f"No votes for {election.title}")
            continue

        # Use the election's stored key if available, else generate (for demo)
        if election.public_key_n and election.public_key_g and election.private_key_lambda and election.private_key_mu:
            public_key = (int(election.public_key_n), int(election.public_key_g))
            private_key = (int(election.private_key_lambda), int(election.private_key_mu))
            key_pair = type('KeyPair', (), {})()
            key_pair.public_key = public_key
            key_pair.private_key = private_key
            key_pair.lambda_val = private_key[0]
            key_pair.mu = private_key[1]
            # Provide n and g for compatibility
            key_pair.n = public_key[0]
            key_pair.g = public_key[1]
            paillier = PaillierEncryption(key_size=512)
        else:
            paillier = PaillierEncryption(key_size=512)
            key_pair = paillier.generate_key_pair()

        candidate_results = {}
        total_votes = 0
        candidates = election.get_candidates()
        print(f"[DEBUG] Candidates for election '{election.title}': {[c.id for c in candidates]}")
        for candidate in candidates:
            print(f"[DEBUG] Processing candidate: {candidate.id} ({candidate.name})")
            # Collect encrypted votes for this candidate
            candidate_votes = []
            for v in votes:
                try:
                    enc_data = v.encrypted_vote_data
                    if enc_data.startswith('{'):
                        enc_json = json.loads(enc_data)
                        vote_cid = enc_json.get('candidate_id')
                        print(f"[DEBUG] Vote {v.id} candidate_id: {vote_cid}")
                        # Robust comparison: compare as strings and ints
                        if str(vote_cid) == str(candidate.id) or int(vote_cid) == int(candidate.id):
                            enc = enc_json.get('encrypted_vote')
                            if isinstance(enc, str):
                                if enc.startswith('0x'):
                                    enc = int(enc, 16)
                                else:
                                    enc = int(enc)
                            candidate_votes.append(enc)
                    # If not JSON, skip (legacy or invalid)
                except Exception as e:
                    print(f"[DEBUG] Error processing vote {v.id}: {e}")
                    continue
            print(f"[DEBUG] Found {len(candidate_votes)} votes for candidate {candidate.id}")
            if candidate_votes:
                n = key_pair.public_key[0]
                n_squared = n ** 2
                aggregated_ciphertext = reduce(lambda x, y: (x * y) % n_squared, candidate_votes)
                if isinstance(aggregated_ciphertext, str):
                    if aggregated_ciphertext.startswith('0x'):
                        aggregated_ciphertext = int(aggregated_ciphertext, 16)
                    else:
                        aggregated_ciphertext = int(aggregated_ciphertext)
                try:
                    tally = paillier.decrypt(aggregated_ciphertext, key_pair)
                except Exception as e:
                    messages.error(request, f"Decryption failed for {candidate.name}: {e}")
                    tally = 0
            else:
                tally = 0
            candidate_results[str(candidate.id)] = tally
            total_votes += tally
        print(f"[DEBUG] Final candidate_results: {candidate_results}")
        print(f"[DEBUG] Final total_votes: {total_votes}")
        # Save to ElectionResult model
        from apps.elections.models import ElectionResult
        ElectionResult.objects.update_or_create(
            election=election,
            defaults={
                'candidate_results': candidate_results,
                'total_votes': total_votes
            }
        )
        messages.success(request, f"Tally for {election.title} complete. Total votes: {total_votes}")

@admin.action(description="Deploy selected elections to the blockchain")
def deploy_on_chain(modeladmin, request, queryset):
    blockchain = BlockchainService()
    for election in queryset:
        # Generate and store Paillier key pair if not already set
        if not (election.public_key_n and election.public_key_g and election.private_key_lambda and election.private_key_mu):
            paillier = PaillierEncryption(key_size=512)
            key_pair = paillier.generate_key_pair()
            election.public_key_n = key_pair.public_key[0]
            election.public_key_g = key_pair.public_key[1]
            election.private_key_lambda = key_pair.lambda_val
            election.private_key_mu = key_pair.mu
            election.save()
        success, tx_hash = blockchain.create_election(
            str(election.id),
            election.title,
            election.start_date,
            election.end_date
        )
        if success:
            messages.success(request, f"Election '{election.title}' deployed! TX: {tx_hash}")
        else:
            messages.error(request, f"Failed to deploy '{election.title}': {tx_hash}")

class ElectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'start_date', 'end_date', 'is_public')
    actions = [decrypt_tally, deploy_on_chain]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not change:  # Only log creation, not edits
            try:
                from backend.middleware.audit import VoteAuditLogger
                election_data = {
                    'title': obj.title,
                    'start_date': obj.start_date.isoformat() if obj.start_date else '',
                    'end_date': obj.end_date.isoformat() if obj.end_date else '',
                }
                VoteAuditLogger.log_election_creation(request, obj.id, election_data)
            except Exception as e:
                import logging
                logging.getLogger('audit').error(f"Failed to log election creation: {e}")

admin.site.register(Election, ElectionAdmin)
admin.site.register(Candidate)
admin.site.register(Vote)
admin.site.register(ElectionResult)
admin.site.register(ElectionAuditLog) 