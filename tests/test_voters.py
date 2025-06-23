import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from apps.voters.models import VoterProfile, BiometricData, AuthenticationLog, VoterEligibility
from apps.elections.models import Election
from django.utils import timezone
from datetime import timedelta

class VoterProfileTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_voter_profile_creation(self):
        profile = VoterProfile.objects.create(
            user=self.user,
            national_id='12345',
            phone_number='1234567890',
            is_verified=True
        )
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.national_id, '12345')
        self.assertTrue(profile.is_verified)

    def test_voter_profile_full_name(self):
        self.user.first_name = 'John'
        self.user.last_name = 'Doe'
        self.user.save()
        profile = VoterProfile.objects.create(user=self.user)
        self.assertEqual(profile.full_name, 'John Doe')

    def test_2fa_enable_disable(self):
        profile = VoterProfile.objects.create(user=self.user)
        profile.enable_2fa('secret123')
        self.assertTrue(profile.two_fa_enabled)
        self.assertEqual(profile.two_fa_secret, 'secret123')
        
        profile.disable_2fa()
        self.assertFalse(profile.two_fa_enabled)
        self.assertEqual(profile.two_fa_secret, '')

class BiometricDataTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_biometric_data_creation(self):
        biometric = BiometricData.objects.create(
            user=self.user,
            biometric_type='face',
            encrypted_data=b'encrypted_data',
            data_hash='abc123',
            face_id='face123'
        )
        self.assertEqual(biometric.user, self.user)
        self.assertEqual(biometric.biometric_type, 'face')
        self.assertTrue(biometric.is_active)

    def test_data_hash_verification(self):
        original_data = b'original_data'
        biometric = BiometricData.objects.create(
            user=self.user,
            biometric_type='fingerprint',
            encrypted_data=b'encrypted_data',
            data_hash='abc123'
        )
        # This would fail in real implementation, but shows the concept
        self.assertFalse(biometric.verify_data_hash(original_data))

class AuthenticationLogTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_auth_log_creation(self):
        log = AuthenticationLog.objects.create(
            user=self.user,
            auth_method='password',
            status='success',
            ip_address='127.0.0.1'
        )
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.auth_method, 'password')
        self.assertEqual(log.status, 'success')

class VoterEligibilityTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.election = Election.objects.create(
            title='Test Election',
            description='Test Description',
            election_type='single',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(hours=1),
            created_by=self.user
        )

    def test_eligibility_creation(self):
        eligibility = VoterEligibility.objects.create(
            user=self.user,
            election=self.election,
            is_eligible=True
        )
        self.assertEqual(eligibility.user, self.user)
        self.assertEqual(eligibility.election, self.election)
        self.assertTrue(eligibility.is_eligible)

    def test_eligibility_mark_eligible(self):
        eligibility = VoterEligibility.objects.create(
            user=self.user,
            election=self.election
        )
        eligibility.mark_eligible(reason='Verified voter')
        self.assertTrue(eligibility.is_eligible)
        self.assertEqual(eligibility.eligibility_reason, 'Verified voter')
        self.assertIsNotNone(eligibility.verified_at)

    def test_eligibility_mark_ineligible(self):
        eligibility = VoterEligibility.objects.create(
            user=self.user,
            election=self.election
        )
        eligibility.mark_ineligible(reason='Not registered', verified_by=self.user)
        self.assertFalse(eligibility.is_eligible)
        self.assertEqual(eligibility.eligibility_reason, 'Not registered')
        self.assertEqual(eligibility.verified_by, self.user) 