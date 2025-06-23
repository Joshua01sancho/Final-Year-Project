"""
Comprehensive Test Suite for E-Voting System

This module contains comprehensive tests for:
- Election management
- Vote processing
- Security validation
- Encryption/decryption
- Blockchain integration
- API endpoints
- Business logic
"""

import json
import hashlib
from datetime import datetime, timedelta
from django.test import TestCase, Client
from django.contrib.auth.models import User, Group
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from apps.elections.models import Election, Candidate, Vote, ElectionCategory
from apps.voters.models import VoterProfile
from apps.elections.business_logic import (
    ElectionManager, VoteProcessor, ResultCalculator, AuditManager
)
from utils.encryption import PaillierEncryption, ShamirSecretSharing
from utils.security_validators import (
    vote_validator, election_validator, biometric_validator
)

class ElectionModelTestCase(TestCase):
    """Test cases for Election model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.category = ElectionCategory.objects.create(
            name='Test Category',
            description='Test category description'
        )
        
        self.election_data = {
            'title': 'Test Election',
            'description': 'Test election description',
            'category': self.category,
            'election_type': 'single',
            'start_date': timezone.now() + timedelta(hours=1),
            'end_date': timezone.now() + timedelta(hours=2),
            'max_choices': 1,
            'min_choices': 1,
            'require_2fa': True,
            'require_biometric': True,
            'created_by': self.user
        }
    
    def test_election_creation(self):
        """Test election creation"""
        election = Election.objects.create(**self.election_data)
        
        self.assertEqual(election.title, 'Test Election')
        self.assertEqual(election.status, 'draft')
        self.assertEqual(election.created_by, self.user)
        self.assertTrue(election.content_hash)
    
    def test_election_validation(self):
        """Test election validation"""
        # Test invalid dates
        invalid_data = self.election_data.copy()
        invalid_data['end_date'] = invalid_data['start_date'] - timedelta(hours=1)
        
        with self.assertRaises(Exception):
            Election.objects.create(**invalid_data)
    
    def test_election_workflow(self):
        """Test election status workflow"""
        election = Election.objects.create(**self.election_data)
        
        # Test approval
        election.approve(self.user)
        self.assertEqual(election.status, 'approved')
        self.assertEqual(election.approved_by, self.user)
        
        # Test activation
        election.activate()
        self.assertEqual(election.status, 'active')
        
        # Test ending
        election.end()
        self.assertEqual(election.status, 'ended')
    
    def test_election_properties(self):
        """Test election properties"""
        election = Election.objects.create(**self.election_data)
        
        # Test is_active property
        self.assertFalse(election.is_active)  # Not yet activated
        
        election.activate()
        self.assertTrue(election.is_active)
        
        # Test has_ended property
        self.assertFalse(election.has_ended)
        
        election.end()
        self.assertTrue(election.has_ended)

class VoteProcessingTestCase(TestCase):
    """Test cases for vote processing"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='voter',
            email='voter@example.com',
            password='voterpass123'
        )
        
        self.election = Election.objects.create(
            title='Test Election',
            description='Test election',
            start_date=timezone.now() - timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=1),
            created_by=self.user,
            status='active'
        )
        
        self.candidate = Candidate.objects.create(
            election=self.election,
            name='Test Candidate',
            description='Test candidate description'
        )
        
        self.vote_data = {
            'encrypted_data': 'encrypted_vote_data_here',
            'vote_hash': hashlib.sha256(b'test_vote').hexdigest(),
            'timestamp': timezone.now().isoformat(),
            'voter_signature': 'test_signature_123'
        }
    
    def test_vote_creation(self):
        """Test vote creation"""
        vote = Vote.objects.create(
            election=self.election,
            voter=self.user,
            encrypted_vote_data=self.vote_data['encrypted_data'],
            vote_hash=self.vote_data['vote_hash'],
            is_valid=True
        )
        
        self.assertEqual(vote.election, self.election)
        self.assertEqual(vote.voter, self.user)
        self.assertTrue(vote.is_valid)
    
    def test_vote_validation(self):
        """Test vote validation"""
        # Test valid vote
        is_valid, message = vote_validator.validate_vote_integrity(
            self.vote_data, self.election.id
        )
        self.assertTrue(is_valid)
        
        # Test invalid vote (missing required field)
        invalid_data = self.vote_data.copy()
        del invalid_data['encrypted_data']
        
        is_valid, message = vote_validator.validate_vote_integrity(
            invalid_data, self.election.id
        )
        self.assertFalse(is_valid)
    
    def test_duplicate_vote_prevention(self):
        """Test duplicate vote prevention"""
        # Create first vote
        Vote.objects.create(
            election=self.election,
            voter=self.user,
            encrypted_vote_data=self.vote_data['encrypted_data'],
            vote_hash=self.vote_data['vote_hash'],
            is_valid=True
        )
        
        # Try to create duplicate vote
        with self.assertRaises(Exception):
            Vote.objects.create(
                election=self.election,
                voter=self.user,
                encrypted_vote_data=self.vote_data['encrypted_data'],
                vote_hash=self.vote_data['vote_hash'],
                is_valid=True
            )

class EncryptionTestCase(TestCase):
    """Test cases for encryption functionality"""
    
    def setUp(self):
        """Set up encryption test data"""
        self.encryption = PaillierEncryption()
        self.secret_sharing = ShamirSecretSharing()
        self.test_data = 42
    
    def test_paillier_encryption(self):
        """Test Paillier encryption/decryption"""
        # Generate keys
        public_key, private_key = self.encryption.generate_keys()
        
        # Encrypt data
        encrypted = self.encryption.encrypt(self.test_data, public_key)
        
        # Decrypt data
        decrypted = self.encryption.decrypt(encrypted, private_key)
        
        self.assertEqual(decrypted, self.test_data)
    
    def test_homomorphic_addition(self):
        """Test homomorphic addition"""
        public_key, private_key = self.encryption.generate_keys()
        
        # Encrypt two values
        encrypted1 = self.encryption.encrypt(10, public_key)
        encrypted2 = self.encryption.encrypt(20, public_key)
        
        # Add encrypted values
        encrypted_sum = self.encryption.add(encrypted1, encrypted2, public_key)
        
        # Decrypt result
        decrypted_sum = self.encryption.decrypt(encrypted_sum, private_key)
        
        self.assertEqual(decrypted_sum, 30)
    
    def test_shamir_secret_sharing(self):
        """Test Shamir's Secret Sharing"""
        # Split secret
        shares = self.secret_sharing.split_secret(
            self.test_data, 
            total_shares=5, 
            threshold=3
        )
        
        # Reconstruct secret with threshold shares
        reconstructed = self.secret_sharing.reconstruct_secret(shares[:3])
        
        self.assertEqual(reconstructed, self.test_data)
    
    def test_insufficient_shares(self):
        """Test that insufficient shares cannot reconstruct secret"""
        shares = self.secret_sharing.split_secret(
            self.test_data, 
            total_shares=5, 
            threshold=3
        )
        
        # Try to reconstruct with insufficient shares
        with self.assertRaises(Exception):
            self.secret_sharing.reconstruct_secret(shares[:2])

class SecurityValidationTestCase(TestCase):
    """Test cases for security validation"""
    
    def setUp(self):
        """Set up security test data"""
        self.election_data = {
            'encryption_enabled': True,
            'encryption_key_size': 2048,
            'decryption_threshold': 3,
            'total_trustees': 5,
            'require_2fa': True,
            'require_biometric': True,
            'start_date': timezone.now() + timedelta(hours=1),
            'end_date': timezone.now() + timedelta(hours=2)
        }
    
    def test_election_security_validation(self):
        """Test election security validation"""
        is_valid, message = election_validator.validate_election_security(self.election_data)
        self.assertTrue(is_valid)
    
    def test_biometric_validation(self):
        """Test biometric data validation"""
        # Test valid face data
        face_data = b'fake_image_data_that_is_long_enough'
        is_valid, message = biometric_validator.validate_face_data(face_data)
        self.assertTrue(is_valid)
        
        # Test invalid face data (too small)
        small_face_data = b'small'
        is_valid, message = biometric_validator.validate_face_data(small_face_data)
        self.assertFalse(is_valid)
    
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        user_id = 1
        ip_address = '192.168.1.1'
        
        # Test auth rate limiting
        for i in range(5):
            allowed, message = rate_limit_validator.check_rate_limit(
                user_id, 'auth_attempts', ip_address
            )
            self.assertTrue(allowed)
        
        # Exceed rate limit
        allowed, message = rate_limit_validator.check_rate_limit(
            user_id, 'auth_attempts', ip_address
        )
        self.assertFalse(allowed)

class APITestCase(APITestCase):
    """Test cases for API endpoints"""
    
    def setUp(self):
        """Set up API test data"""
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='apipass123'
        )
        
        self.client.force_authenticate(user=self.user)
        
        self.election = Election.objects.create(
            title='API Test Election',
            description='API test election',
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            created_by=self.user
        )
    
    def test_election_list_api(self):
        """Test election list API"""
        url = reverse('api:election-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_election_detail_api(self):
        """Test election detail API"""
        url = reverse('api:election-detail', args=[self.election.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'API Test Election')
    
    def test_vote_api(self):
        """Test vote API"""
        url = reverse('api:vote-create')
        vote_data = {
            'election': self.election.id,
            'encrypted_data': 'test_encrypted_data',
            'vote_hash': hashlib.sha256(b'test_vote').hexdigest()
        }
        
        response = self.client.post(url, vote_data, format='json')
        
        # Should fail because election is not active
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthorized_access(self):
        """Test unauthorized API access"""
        self.client.force_authenticate(user=None)
        
        url = reverse('api:election-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class BusinessLogicTestCase(TestCase):
    """Test cases for business logic"""
    
    def setUp(self):
        """Set up business logic test data"""
        self.user = User.objects.create_user(
            username='businessuser',
            email='business@example.com',
            password='businesspass123'
        )
        
        self.election_manager = ElectionManager()
        self.vote_processor = VoteProcessor()
        self.result_calculator = ResultCalculator()
        self.audit_manager = AuditManager()
    
    def test_election_creation_business_logic(self):
        """Test election creation with business logic"""
        election_data = {
            'title': 'Business Logic Test Election',
            'description': 'Test election for business logic',
            'start_date': timezone.now() + timedelta(hours=1),
            'end_date': timezone.now() + timedelta(hours=2),
            'candidates': [
                {'name': 'Candidate 1', 'description': 'First candidate'},
                {'name': 'Candidate 2', 'description': 'Second candidate'}
            ]
        }
        
        election = self.election_manager.create_election(election_data, self.user)
        
        self.assertEqual(election.title, 'Business Logic Test Election')
        self.assertEqual(election.candidates.count(), 2)
        self.assertTrue(election.public_key_n)
    
    def test_vote_processing_business_logic(self):
        """Test vote processing with business logic"""
        # Create active election
        election = Election.objects.create(
            title='Vote Test Election',
            description='Test election for voting',
            start_date=timezone.now() - timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=1),
            created_by=self.user,
            status='active'
        )
        
        Candidate.objects.create(
            election=election,
            name='Test Candidate'
        )
        
        vote_data = {
            'encrypted_data': 'test_encrypted_vote',
            'vote_hash': hashlib.sha256(b'test_vote').hexdigest(),
            'timestamp': timezone.now().isoformat(),
            'voter_signature': 'test_signature'
        }
        
        vote = self.vote_processor.process_vote(election.id, self.user, vote_data)
        
        self.assertEqual(vote.election, election)
        self.assertEqual(vote.voter, self.user)
        self.assertTrue(vote.is_valid)
    
    def test_result_calculation(self):
        """Test result calculation"""
        # Create ended election with votes
        election = Election.objects.create(
            title='Result Test Election',
            description='Test election for results',
            start_date=timezone.now() - timedelta(hours=2),
            end_date=timezone.now() - timedelta(hours=1),
            created_by=self.user,
            status='ended'
        )
        
        candidate = Candidate.objects.create(
            election=election,
            name='Test Candidate'
        )
        
        # Create some votes
        for i in range(5):
            Vote.objects.create(
                election=election,
                voter=User.objects.create_user(
                    username=f'voter{i}',
                    password='pass123'
                ),
                encrypted_vote_data=json.dumps({'candidate_id': candidate.id}),
                vote_hash=hashlib.sha256(f'test_vote_{i}'.encode()).hexdigest(),
                is_valid=True
            )
        
        results = self.result_calculator.calculate_results(election.id)
        
        self.assertIn('candidate_results', results)
        self.assertEqual(results['metadata']['total_votes'], 5)
    
    def test_audit_logging(self):
        """Test audit logging"""
        election = Election.objects.create(
            title='Audit Test Election',
            description='Test election for audit',
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            created_by=self.user
        )
        
        self.audit_manager.log_election_action(
            election, 'TEST_ACTION', self.user, {'test': 'data'}
        )
        
        audit_trail = self.audit_manager.get_election_audit_trail(election.id)
        
        self.assertEqual(len(audit_trail), 1)
        self.assertEqual(audit_trail[0]['action'], 'TEST_ACTION')

class IntegrationTestCase(TestCase):
    """Integration tests for complete workflows"""
    
    def setUp(self):
        """Set up integration test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True
        )
        
        self.voter_user = User.objects.create_user(
            username='voter',
            email='voter@example.com',
            password='voterpass123'
        )
        
        # Create voter profile
        VoterProfile.objects.create(
            user=self.voter_user,
            is_verified=True
        )
    
    def test_complete_election_workflow(self):
        """Test complete election workflow from creation to results"""
        # 1. Create election
        election_data = {
            'title': 'Integration Test Election',
            'description': 'Complete workflow test',
            'start_date': timezone.now() + timedelta(hours=1),
            'end_date': timezone.now() + timedelta(hours=2),
            'candidates': [
                {'name': 'Candidate A', 'description': 'First candidate'},
                {'name': 'Candidate B', 'description': 'Second candidate'}
            ]
        }
        
        election_manager = ElectionManager()
        election = election_manager.create_election(election_data, self.admin_user)
        
        # 2. Approve election
        election.approve(self.admin_user)
        
        # 3. Activate election
        election.activate()
        
        # 4. Cast votes
        vote_processor = VoteProcessor()
        candidate_a = election.candidates.first()
        
        for i in range(3):
            voter = User.objects.create_user(
                username=f'voter{i}',
                password='pass123'
            )
            VoterProfile.objects.create(user=voter, is_verified=True)
            
            vote_data = {
                'encrypted_data': json.dumps({'candidate_id': candidate_a.id}),
                'vote_hash': hashlib.sha256(f'vote_{i}'.encode()).hexdigest(),
                'timestamp': timezone.now().isoformat(),
                'voter_signature': f'signature_{i}'
            }
            
            vote_processor.process_vote(election.id, voter, vote_data)
        
        # 5. End election
        election.end()
        
        # 6. Calculate results
        result_calculator = ResultCalculator()
        results = result_calculator.calculate_results(election.id)
        
        # 7. Verify results
        self.assertEqual(results['metadata']['total_votes'], 3)
        self.assertIn('candidate_results', results)
    
    def test_security_integration(self):
        """Test security features integration"""
        # Create election with security requirements
        election = Election.objects.create(
            title='Security Test Election',
            description='Security integration test',
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            created_by=self.admin_user,
            require_2fa=True,
            require_biometric=True
        )
        
        # Test vote validation with security checks
        vote_data = {
            'encrypted_data': 'test_encrypted_data',
            'vote_hash': hashlib.sha256(b'test_vote').hexdigest(),
            'timestamp': timezone.now().isoformat(),
            'voter_signature': 'test_signature',
            'biometric_verified': True,
            '2fa_verified': True
        }
        
        # Should fail because election is not active
        with self.assertRaises(Exception):
            self.vote_processor.process_vote(election.id, self.voter_user, vote_data)

# Run tests
if __name__ == '__main__':
    import django
    django.setup()
    
    # Run specific test cases
    import unittest
    unittest.main() 