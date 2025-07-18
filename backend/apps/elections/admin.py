from django.contrib import admin, messages
from .models import Election, Candidate, Vote, ElectionResult, ElectionAuditLog
from .blockchain import BlockchainService

@admin.action(description="Deploy selected elections to the blockchain")
def deploy_on_chain(modeladmin, request, queryset):
    blockchain = BlockchainService()
    for election in queryset:
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
    actions = [deploy_on_chain]

admin.site.register(Election, ElectionAdmin)
admin.site.register(Candidate)
admin.site.register(Vote)
admin.site.register(ElectionResult)
admin.site.register(ElectionAuditLog) 