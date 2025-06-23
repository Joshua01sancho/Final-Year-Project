from django.contrib import admin
from .models import Election, Candidate, Vote, ElectionResult, ElectionAuditLog

class CandidateInline(admin.TabularInline):
    model = Candidate
    extra = 1
    fields = ('name', 'description', 'image_url', 'order', 'party', 'position')

@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'election_type', 'status', 'start_date', 'end_date', 'created_by', 'is_public')
    list_filter = ('status', 'election_type', 'is_public', 'created_by')
    search_fields = ('title', 'description', 'created_by__username')
    inlines = [CandidateInline]
    readonly_fields = ('created_at', 'updated_at', 'public_key_n', 'public_key_g', 'blockchain_contract_address', 'blockchain_deployment_tx')
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'election_type', 'status', 'start_date', 'end_date', 'created_by', 'is_public')
        }),
        ('Security & Blockchain', {
            'fields': ('public_key_n', 'public_key_g', 'private_key_shares', 'blockchain_contract_address', 'blockchain_deployment_tx')
        }),
        ('Settings', {
            'fields': ('max_choices', 'allow_abstention', 'require_2fa', 'require_biometric', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'election', 'order', 'party', 'position')
    list_filter = ('election', 'party', 'position')
    search_fields = ('name', 'election__title', 'party', 'position')

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('election', 'voter', 'is_valid', 'created_at', 'blockchain_tx_hash', 'confirmed_at')
    list_filter = ('election', 'is_valid', 'face_verified', 'fingerprint_verified', 'two_fa_verified')
    search_fields = ('voter__username', 'election__title', 'vote_hash', 'blockchain_tx_hash')
    readonly_fields = ('created_at', 'confirmed_at', 'vote_hash', 'blockchain_tx_hash', 'blockchain_block_number')

@admin.register(ElectionResult)
class ElectionResultAdmin(admin.ModelAdmin):
    list_display = ('election', 'total_votes', 'decryption_status', 'decryption_timestamp')
    list_filter = ('decryption_status',)
    search_fields = ('election__title',)
    readonly_fields = ('created_at', 'updated_at', 'decryption_timestamp')

@admin.register(ElectionAuditLog)
class ElectionAuditLogAdmin(admin.ModelAdmin):
    list_display = ('election', 'event_type', 'user', 'ip_address', 'timestamp')
    list_filter = ('event_type', 'election')
    search_fields = ('election__title', 'event_type', 'user__username', 'ip_address')
    readonly_fields = ('timestamp',) 