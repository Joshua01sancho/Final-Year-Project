import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from apps.elections.models import Election, Candidate, Vote, ElectionResult
from apps.encryption.paillier import PaillierEncryption
from django.utils import timezone
from datetime import timedelta

class ElectionModelTest(TestCase):
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

    def test_election_creation(self):
        self.assertEqual(self.election.title, 'Test Election')
        self.assertEqual(self.election.status, 'draft')
        self.assertTrue(self.election.is_public)

    def test_election_is_active(self):
        self.assertFalse(self.election.is_active)  # status is 'draft'
        self.election.status = 'active'
        self.election.save()
        self.assertTrue(self.election.is_active)

    def test_candidate_creation(self):
        candidate = Candidate.objects.create(
            election=self.election,
            name='Test Candidate',
            description='Test Candidate Description',
            order=1
        )
        self.assertEqual(candidate.name, 'Test Candidate')
        self.assertEqual(candidate.election, self.election)

class VoteModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.election = Election.objects.create(
            title='Test Election',
            description='Test Description',
            election_type='single',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(hours=1),
            created_by=self.user,
            status='active'
        )

    def test_vote_creation(self):
        vote = Vote.objects.create(
            election=self.election,
            voter=self.user,
            encrypted_vote_data='12345',
            vote_hash='abc123'
        )
        self.assertEqual(vote.election, self.election)
        self.assertEqual(vote.voter, self.user)
        self.assertTrue(vote.is_valid)

class ElectionResultTest(TestCase):
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

    def test_result_creation(self):
        result = ElectionResult.objects.create(
            election=self.election,
            total_votes=10,
            candidate_results={'1': 5, '2': 5}
        )
        self.assertEqual(result.election, self.election)
        self.assertEqual(result.total_votes, 10)
        self.assertEqual(result.decryption_status, 'pending')

class PaillierEncryptionTest(TestCase):
    def setUp(self):
        self.paillier = PaillierEncryption()

    def test_key_generation(self):
        key_pair = self.paillier.generate_key_pair()
        self.assertIsNotNone(key_pair.public_key)
        self.assertIsNotNone(key_pair.private_key)

    def test_encryption_decryption(self):
        key_pair = self.paillier.generate_key_pair()
        message = 42
        encrypted = self.paillier.encrypt(message, key_pair.public_key)
        decrypted = self.paillier.decrypt(encrypted, key_pair)
        self.assertEqual(message, decrypted)

    def test_homomorphic_addition(self):
        key_pair = self.paillier.generate_key_pair()
        m1, m2 = 10, 20
        c1 = self.paillier.encrypt(m1, key_pair.public_key)
        c2 = self.paillier.encrypt(m2, key_pair.public_key)
        c_sum = self.paillier.add_ciphertexts(c1, c2, key_pair.public_key)
        decrypted_sum = self.paillier.decrypt(c_sum, key_pair)
        self.assertEqual(decrypted_sum, m1 + m2) 