from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponseRedirect
from .models import Election, Candidate, Vote, ElectionResult, ElectionAuditLog

class CandidateInline(admin.TabularInline):
    model = Candidate
    extra = 1
    fields = ('name', 'description', 'image', 'image_url', 'order', 'party', 'position')
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        form = formset.form
        
        # Add help text for image field
        if 'image' in form.base_fields:
            form.base_fields['image'].help_text = "Upload a profile picture for this candidate. Recommended size: 400x400 pixels."
        
        return formset

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('name', 'election', 'order', 'party', 'position', 'display_image_preview')
    list_filter = ('election', 'party', 'position')
    search_fields = ('name', 'election__title', 'party', 'position')
    fieldsets = (
        (None, {
            'fields': ('election', 'name', 'description', 'order')
        }),
        ('Image', {
            'fields': ('image', 'image_url'),
            'description': 'Upload an image file or provide an image URL. Image upload is preferred.'
        }),
        ('Additional Information', {
            'fields': ('party', 'position', 'metadata'),
            'classes': ('collapse',)
        }),
    )
    
    def display_image_preview(self, obj):
        """Display image preview in admin list"""
        if obj.display_image:
            return format_html(
                '<img src="{}" style="max-width: 50px; max-height: 50px; border-radius: 4px;" />',
                obj.display_image
            )
        return "No image"
    display_image_preview.short_description = 'Image'
    
    def save_model(self, request, obj, form, change):
        """Handle image upload and processing"""
        if form.cleaned_data.get('image') and form.cleaned_data.get('image_url'):
            messages.warning(request, 'Both image file and URL provided. Image file will be used.')
            obj.image_url = ''  # Clear URL when file is uploaded
        
        super().save_model(request, obj, form, change)
        
        # Process image if uploaded
        if obj.image:
            try:
                obj.process_image()
                obj.save(update_fields=['image'])
                messages.success(request, f'Image processed successfully for {obj.name}')
            except Exception as e:
                messages.error(request, f'Error processing image for {obj.name}: {str(e)}')

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