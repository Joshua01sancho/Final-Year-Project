from django.contrib import admin
from .models import Election, Candidate, Vote, ElectionResult, ElectionAuditLog

admin.site.register(Election)
admin.site.register(Candidate)
admin.site.register(Vote)
admin.site.register(ElectionResult)
admin.site.register(ElectionAuditLog) 