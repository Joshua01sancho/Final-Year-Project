from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.contrib import messages
from django import forms
from .models import Voter, VoterProfile, BiometricData
from django.contrib.auth import get_user_model
from web3 import Web3

User = get_user_model()

class BiometricDataForm(forms.ModelForm):
    """Custom form for BiometricData - Read-only for security"""
    
    class Meta:
        model = BiometricData
        fields = ['user', 'biometric_type', 'face_id', 'face_features', 'is_active']
        exclude = ['encrypted_data', 'data_hash']  # Exclude binary fields
    
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

@admin.register(Voter)
class VoterAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'blockchain_address', 'blockchain_private_key', 'is_active', 'date_joined')
    fields = ('username', 'email', 'blockchain_address', 'blockchain_private_key', 'is_active', 'date_joined', 'last_login', 'groups', 'user_permissions')
    readonly_fields = ('date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'blockchain_address')
    ordering = ('-date_joined',)
    actions = ['view_registration_stats', 'verify_voters', 'unverify_voters']
    
    def has_face_data(self, obj):
        return BiometricData.objects.filter(user=obj, biometric_type='face', face_id__isnull=False).exists()
    has_face_data.boolean = True
    has_face_data.short_description = 'Has Face Data'
    
    @admin.action(description="View registration statistics")
    def view_registration_stats(self, request, queryset):
        return HttpResponseRedirect(reverse('admin:registration_statistics'))
    
    @admin.action(description="Verify selected voters")
    def verify_voters(self, request, queryset):
        for user in queryset:
            profile, created = VoterProfile.objects.get_or_create(
                user=user,
                defaults={'is_verified': True}
            )
            if not created:
                profile.is_verified = True
                profile.save()
        self.message_user(request, f"{queryset.count()} voters have been verified.")
    
    @admin.action(description="Unverify selected voters")
    def unverify_voters(self, request, queryset):
        VoterProfile.objects.filter(user__in=queryset).update(is_verified=False)
        self.message_user(request, f"{queryset.count()} voters have been unverified.")

@admin.register(VoterProfile)
class VoterProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_verified', 'national_id', 'phone_number', 'created_at')
    list_filter = ('is_verified', 'created_at', 'two_fa_enabled', 'biometric_enabled')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name', 'national_id')
    readonly_fields = ('created_at', 'updated_at')
    actions = ['verify_voters', 'unverify_voters']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'national_id', 'phone_number', 'date_of_birth')
        }),
        ('Address Information', {
            'fields': ('address', 'city', 'state', 'postal_code', 'country'),
            'classes': ('collapse',)
        }),
        ('Verification Status', {
            'fields': ('is_verified', 'verification_date', 'verified_by')
        }),
        ('Security Settings', {
            'fields': ('two_fa_enabled', 'two_fa_secret', 'biometric_enabled'),
            'classes': ('collapse',)
        }),
        ('Preferences', {
            'fields': ('preferred_language', 'accessibility_needs'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    @admin.action(description="Verify selected voters")
    def verify_voters(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"{updated} voters have been verified.")

    @admin.action(description="Unverify selected voters")
    def unverify_voters(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f"{updated} voters have been unverified.")

@admin.register(BiometricData)
class BiometricDataAdmin(admin.ModelAdmin):
    form = BiometricDataForm
    list_display = ('user', 'biometric_type', 'has_face_id', 'created_at', 'face_preview')
    list_filter = ('biometric_type', 'created_at', 'is_active')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at', 'face_preview', 'data_hash', 'face_id', 'face_features')
    actions = ['test_face_recognition', 'view_data_hash']
    
    def has_add_permission(self, request):
        """Prevent adding new biometric data through admin"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting biometric data through admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing but not editing biometric data"""
        return request.method == 'GET'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'biometric_type', 'is_active')
        }),
        ('Face Data (Read Only - Immutable)', {
            'fields': ('face_id', 'face_features', 'face_preview'),
            'classes': ('collapse',),
            'description': '⚠️ CRITICAL: Face data is immutable for security. Admins can view but cannot modify to maintain voting integrity.'
        }),
        ('Security Information', {
            'fields': ('data_hash',),
            'classes': ('collapse',),
            'description': 'Data hash for verification (encrypted data is managed programmatically)'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_face_id(self, obj):
        return bool(obj.face_id)
    has_face_id.boolean = True
    has_face_id.short_description = 'Has Face ID'
    
    def face_preview(self, obj):
        if obj.face_features:
            try:
                attrs = obj.face_features
                age = attrs.get('age', 'N/A')
                gender = attrs.get('gender', 'N/A')
                return format_html(
                    '<div style="background: #f0f0f0; padding: 8px; border-radius: 4px;">'
                    '<strong>Age:</strong> {}<br>'
                    '<strong>Gender:</strong> {}<br>'
                    '<strong>Glasses:</strong> {}<br>'
                    '<strong>Smile:</strong> {:.2f}'
                    '</div>',
                    age, gender, attrs.get('glasses', 'N/A'), attrs.get('smile', 0)
                )
            except:
                return "Error parsing attributes"
        return "No face data"
    face_preview.short_description = 'Face Attributes'
    
    @admin.action(description="Test face recognition")
    def test_face_recognition(self, request, queryset):
        return HttpResponseRedirect(reverse('admin:test_face_recognition'))
    
    @admin.action(description="View data integrity hash")
    def view_data_hash(self, request, queryset):
        """Display data hash for integrity verification"""
        if queryset.count() == 1:
            obj = queryset.first()
            message = f"Data Hash for {obj.user.username}: {obj.data_hash}"
            self.message_user(request, message, level=messages.INFO)
        else:
            self.message_user(request, "Please select exactly one record to view its hash.", level=messages.WARNING)
    
    def get_actions(self, request):
        """Customize available actions"""
        actions = super().get_actions(request)
        # Remove delete action to prevent data loss
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
    
    def changelist_view(self, request, extra_context=None):
        """Add security warning to the changelist view"""
        extra_context = extra_context or {}
        extra_context['security_warning'] = True
        return super().changelist_view(request, extra_context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add security warning to the change view"""
        extra_context = extra_context or {}
        extra_context['security_warning'] = True
        return super().change_view(request, object_id, form_url, extra_context) 