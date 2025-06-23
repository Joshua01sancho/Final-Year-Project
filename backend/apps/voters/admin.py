from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.contrib import messages
from django import forms
from .models import Voter, VoterProfile, BiometricData

class BiometricDataForm(forms.ModelForm):
    """Custom form for BiometricData to handle encrypted fields"""
    
    class Meta:
        model = BiometricData
        fields = ['user', 'biometric_type', 'face_id', 'face_features', 'is_active']
        exclude = ['encrypted_data', 'data_hash']  # Exclude binary fields
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Set default encrypted data if not provided
        if not hasattr(instance, 'encrypted_data') or not instance.encrypted_data:
            # Create a placeholder encrypted data (this should be handled properly in production)
            import hashlib
            placeholder_data = b'placeholder_encrypted_data'
            instance.encrypted_data = placeholder_data
            instance.data_hash = hashlib.sha256(placeholder_data).hexdigest()
        
        if commit:
            instance.save()
        return instance

@admin.register(Voter)
class VoterAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'blockchain_address', 'has_face_data', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'blockchain_address')
    ordering = ('-date_joined',)
    actions = ['view_registration_stats', 'verify_voters', 'unverify_voters']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Blockchain Information', {
            'fields': ('blockchain_address',)
        }),
        ('Face Recognition Note', {
            'fields': (),
            'description': 'Users register their own face data during signup for privacy. Admins cannot upload face images.',
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Blockchain Information', {
            'fields': ('blockchain_address',)
        }),
    )
    
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
    readonly_fields = ('created_at', 'updated_at', 'face_preview', 'data_hash')
    actions = ['test_face_recognition']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'biometric_type', 'is_active')
        }),
        ('Face Data (Read Only)', {
            'fields': ('face_id', 'face_features', 'face_preview'),
            'classes': ('collapse',),
            'description': 'Face data is uploaded by users during registration for privacy. Admins can view but not modify.'
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