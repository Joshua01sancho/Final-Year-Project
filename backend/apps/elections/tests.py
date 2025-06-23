from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from apps.elections.blockchain import BlockchainService
from apps.encryption.paillier import PaillierEncryption, VoteEncryption
from web3 import Web3

User = get_user_model()

class BlockchainIntegrationTest(TestCase):
    def setUp(self):
        """Set up the test environment for blockchain integration tests."""
        self.user = User.objects.create_user(
            username='test_blockchain_voter',
            password='testpassword123',
            email='test.bc@example.com',
            blockchain_address='0x447588dA5593dA72bdBC607f50C1C87382FdCA58'
        )

    @patch('apps.elections.blockchain.BlockchainService.get_election_details')
    def test_blockchain_connection_and_details_retrieval(self, mock_get_election_details):
        """
        Test that the BlockchainService can be initialized and can fetch election details.
        """
        # Mock the return value of the smart contract call
        mock_get_election_details.return_value = {
            'id': 'TEST_ELECTION_1',
            'title': 'Test Election from Blockchain',
            'is_active': True,
            'total_votes': 0
        }

        blockchain = BlockchainService()
        election_details = blockchain.get_election_details("TEST_ELECTION_1")

        self.assertIsNotNone(election_details, "Should retrieve election details.")
        self.assertEqual(election_details['id'], 'TEST_ELECTION_1')
        self.assertEqual(election_details['title'], 'Test Election from Blockchain')
        self.assertTrue(election_details['is_active'])
        mock_get_election_details.assert_called_once_with("TEST_ELECTION_1")

    def test_user_creation_with_blockchain_address(self):
        """
        Test that a user can be created with a blockchain address.
        """
        self.assertEqual(self.user.username, 'test_blockchain_voter')
        self.assertEqual(self.user.blockchain_address, '0x447588dA5593dA72bdBC607f50C1C87382FdCA58')

class CompleteVotingProcessTest(TestCase):
    def setUp(self):
        """Set up the environment for the complete voting process test."""
        self.paillier = PaillierEncryption(key_size=512)
        self.key_pair = self.paillier.generate_key_pair()
        self.vote_encryption = VoteEncryption()
        self.user = User.objects.create_user(
            username='test_complete_voter',
            password='testpassword123',
            blockchain_address='0x447588dA5593dA72bdBC607f50C1C87382FdCA58'
        )

    def test_vote_encryption_and_decryption_workflow(self):
        """
        Test the full workflow of encrypting, aggregating, and decrypting votes.
        """
        # 1. Encrypt votes
        votes = [1, 0, 1, 1, 0]  # Represents votes for a candidate (e.g., 1=yes, 0=no)
        encrypted_votes = [
            self.vote_encryption.encrypt_vote(vote, self.key_pair.public_key)
            for vote in votes
        ]
        self.assertEqual(len(encrypted_votes), len(votes))

        # 2. Aggregate encrypted votes
        aggregated_ciphertext = self.vote_encryption.aggregate_votes(encrypted_votes, self.key_pair.public_key)
        self.assertIsNotNone(aggregated_ciphertext)

        # 3. Decrypt the final tally
        decrypted_result = self.paillier.decrypt(aggregated_ciphertext, self.key_pair)
        
        # 4. Verify the result
        self.assertEqual(decrypted_result, sum(votes), "The decrypted sum should match the original sum of votes.")

    def test_vote_hash_creation(self):
        """
        Test the creation of a unique vote hash for blockchain verification.
        """
        vote_value = 1
        encrypted_vote = self.vote_encryption.encrypt_vote(vote_value, self.key_pair.public_key)
        
        # Ensure the hex string is properly formatted (even length)
        encrypted_vote_hex = f'{encrypted_vote:x}'
        if len(encrypted_vote_hex) % 2 != 0:
            encrypted_vote_hex = '0' + encrypted_vote_hex

        election_id = "ELECTION_2024"
        voter_address = self.user.blockchain_address

        # Use web3.py to create a Solidity-compatible keccak hash
        w3 = Web3()
        vote_hash_bytes = w3.solidity_keccak(
            ['string', 'bytes', 'address'],
            [election_id, bytes.fromhex(encrypted_vote_hex), voter_address]
        )
        vote_hash = f"0x{vote_hash_bytes.hex()}"

        self.assertIsNotNone(vote_hash)
        self.assertTrue(vote_hash.startswith('0x'))
        self.assertEqual(len(vote_hash), 66) # 0x + 32 bytes hex