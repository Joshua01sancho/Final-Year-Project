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

# Custom forms for immutable voting data
from django import forms

class VoteForm(forms.ModelForm):
    """Custom form for Vote - Read-only for security"""
    
    class Meta:
        model = Vote
        fields = ['election', 'voter', 'encrypted_vote_data', 'vote_hash', 'blockchain_tx_hash', 
                 'blockchain_block_number', 'is_valid', 'face_verified', 
                 'fingerprint_verified', 'two_fa_verified', 'ip_address', 'user_agent']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make all fields read-only for security
        for field_name in self.fields:
            self.fields[field_name].widget.attrs['readonly'] = 'readonly'
            self.fields[field_name].widget.attrs['disabled'] = 'disabled'
    
    def save(self, commit=True):
        # Prevent saving changes to maintain data integrity
        if self.instance.pk:
            # If this is an existing record, don't allow modifications
            return self.instance
        else:
            # Only allow creation of new records (though this is disabled in admin)
            instance = super().save(commit=False)
            if commit:
                instance.save()
            return instance

class ElectionResultForm(forms.ModelForm):
    """Custom form for ElectionResult - Read-only for security"""
    
    class Meta:
        model = ElectionResult
        fields = ['election', 'encrypted_total_votes', 'encrypted_candidate_votes', 
                 'total_votes', 'candidate_results', 'decryption_status']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make all fields read-only for security
        for field_name in self.fields:
            self.fields[field_name].widget.attrs['readonly'] = 'readonly'
            self.fields[field_name].widget.attrs['disabled'] = 'disabled'
    
    def save(self, commit=True):
        # Prevent saving changes to maintain data integrity
        if self.instance.pk:
            return self.instance
        else:
            instance = super().save(commit=False)
            if commit:
                instance.save()
            return instance

class ElectionAuditLogForm(forms.ModelForm):
    """Custom form for ElectionAuditLog - Read-only for security"""
    
    class Meta:
        model = ElectionAuditLog
        fields = ['election', 'event_type', 'event_data', 'user', 'ip_address']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make all fields read-only for security
        for field_name in self.fields:
            self.fields[field_name].widget.attrs['readonly'] = 'readonly'
            self.fields[field_name].widget.attrs['disabled'] = 'disabled'
    
    def save(self, commit=True):
        # Prevent saving changes to maintain data integrity
        if self.instance.pk:
            return self.instance
        else:
            instance = super().save(commit=False)
            if commit:
                instance.save()
            return instance

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    form = VoteForm
    list_display = ('election', 'voter', 'vote_hash', 'is_valid', 'created_at', 'is_confirmed')
    list_filter = ('election', 'is_valid', 'face_verified', 'fingerprint_verified', 'two_fa_verified', 'created_at')
    search_fields = ('election__title', 'voter__username', 'vote_hash', 'blockchain_tx_hash')
    readonly_fields = ('created_at', 'confirmed_at', 'vote_hash', 'encrypted_vote_data', 
                      'blockchain_tx_hash', 'blockchain_block_number', 'validation_errors', 
                      'face_verified', 'fingerprint_verified', 'two_fa_verified', 
                      'ip_address', 'user_agent', 'audit_data')
    actions = ['view_vote_integrity']
    
    def has_add_permission(self, request):
        """Prevent adding new votes through admin"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting votes through admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing but not editing votes"""
        return request.method == 'GET'
    
    fieldsets = (
        ('Vote Information', {
            'fields': ('election', 'voter', 'vote_hash', 'is_valid')
        }),
        ('Encrypted Data (Read Only - Immutable)', {
            'fields': ('encrypted_vote_data',),
            'classes': ('collapse',),
            'description': '⚠️ CRITICAL: Encrypted vote data is immutable for voting integrity. Admins can view but cannot modify to maintain election security.'
        }),
        ('Blockchain Integration', {
            'fields': ('blockchain_tx_hash', 'blockchain_block_number'),
            'classes': ('collapse',),
            'description': 'Blockchain transaction data (immutable)'
        }),
        ('Biometric Verification', {
            'fields': ('face_verified', 'fingerprint_verified', 'two_fa_verified'),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('ip_address', 'user_agent', 'audit_data'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'confirmed_at'),
            'classes': ('collapse',)
        }),
    )
    
    @admin.action(description="View vote integrity hash")
    def view_vote_integrity(self, request, queryset):
        """Display vote hash for integrity verification"""
        if queryset.count() == 1:
            obj = queryset.first()
            message = f"Vote Hash for {obj.election.title} - {obj.voter.username}: {obj.vote_hash}"
            self.message_user(request, message, level=messages.INFO)
        else:
            self.message_user(request, "Please select exactly one vote to view its hash.", level=messages.WARNING)
    
    def get_actions(self, request):
        """Customize available actions"""
        actions = super().get_actions(request)
        # Remove delete action to prevent data loss
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

@admin.register(ElectionResult)
class ElectionResultAdmin(admin.ModelAdmin):
    form = ElectionResultForm
    list_display = ('election', 'total_votes', 'decryption_status', 'created_at')
    list_filter = ('decryption_status', 'created_at')
    search_fields = ('election__title',)
    readonly_fields = ('created_at', 'updated_at', 'encrypted_total_votes', 'encrypted_candidate_votes',
                      'total_votes', 'candidate_results', 'trustees_participated', 'decryption_timestamp')
    actions = ['view_result_integrity']
    
    def has_add_permission(self, request):
        """Prevent adding new results through admin"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting results through admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing but not editing results"""
        return request.method == 'GET'
    
    fieldsets = (
        ('Election Information', {
            'fields': ('election', 'decryption_status')
        }),
        ('Encrypted Results (Read Only - Immutable)', {
            'fields': ('encrypted_total_votes', 'encrypted_candidate_votes'),
            'classes': ('collapse',),
            'description': '⚠️ CRITICAL: Encrypted election results are immutable for voting integrity. Admins can view but cannot modify to maintain election security.'
        }),
        ('Decrypted Results (Read Only)', {
            'fields': ('total_votes', 'candidate_results'),
            'classes': ('collapse',),
            'description': 'Decrypted results (immutable once decrypted)'
        }),
        ('Decryption Process', {
            'fields': ('trustees_participated', 'decryption_timestamp'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    @admin.action(description="View result integrity")
    def view_result_integrity(self, request, queryset):
        """Display result information for integrity verification"""
        if queryset.count() == 1:
            obj = queryset.first()
            message = f"Election Result for {obj.election.title}: {obj.total_votes} total votes, Status: {obj.decryption_status}"
            self.message_user(request, message, level=messages.INFO)
        else:
            self.message_user(request, "Please select exactly one result to view its details.", level=messages.WARNING)
    
    def get_actions(self, request):
        """Customize available actions"""
        actions = super().get_actions(request)
        # Remove delete action to prevent data loss
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

@admin.register(ElectionAuditLog)
class ElectionAuditLogAdmin(admin.ModelAdmin):
    form = ElectionAuditLogForm
    list_display = ('election', 'event_type', 'user', 'timestamp')
    list_filter = ('event_type', 'timestamp', 'election')
    search_fields = ('election__title', 'event_type', 'user__username')
    readonly_fields = ('timestamp', 'election', 'event_type', 'event_data', 'user', 'ip_address')
    
    def has_add_permission(self, request):
        """Prevent adding new audit logs through admin"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting audit logs through admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing but not editing audit logs"""
        return request.method == 'GET'
    
    fieldsets = (
        ('Audit Information', {
            'fields': ('election', 'event_type', 'event_data')
        }),
        ('User and Context', {
            'fields': ('user', 'ip_address'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )
    
    def get_actions(self, request):
        """Customize available actions"""
        actions = super().get_actions(request)
        # Remove delete action to prevent data loss
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

admin.site.register(Election, ElectionAdmin)
admin.site.register(Candidate) 