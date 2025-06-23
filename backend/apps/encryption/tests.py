from django.test import TestCase
from .paillier import PaillierEncryption, VoteEncryption, ThresholdPaillier

class PaillierEncryptionTest(TestCase):
    def setUp(self):
        """Set up the test environment for Paillier encryption tests."""
        self.paillier = PaillierEncryption(key_size=512)  # Use smaller key for testing
        self.key_pair = self.paillier.generate_key_pair()
        self.vote_encryption = VoteEncryption()

    def test_basic_paillier_encryption(self):
        """Test basic Paillier encryption and decryption."""
        test_message = 42
        encrypted = self.paillier.encrypt(test_message, self.key_pair.public_key)
        decrypted = self.paillier.decrypt(encrypted, self.key_pair)
        self.assertEqual(test_message, decrypted, "Basic encryption/decryption should work.")

    def test_homomorphic_properties(self):
        """Test the homomorphic properties of Paillier."""
        # Test homomorphic addition
        m1, m2 = 10, 20
        c1 = self.paillier.encrypt(m1, self.key_pair.public_key)
        c2 = self.paillier.encrypt(m2, self.key_pair.public_key)
        c_sum = self.paillier.add_ciphertexts(c1, c2, self.key_pair.public_key)
        decrypted_sum = self.paillier.decrypt(c_sum, self.key_pair)
        self.assertEqual(decrypted_sum, m1 + m2, "Homomorphic addition should work.")

        # Test homomorphic multiplication by a constant
        message = 5
        scalar = 3
        encrypted = self.paillier.encrypt(message, self.key_pair.public_key)
        encrypted_product = self.paillier.multiply_ciphertext(encrypted, scalar, self.key_pair.public_key)
        decrypted_product = self.paillier.decrypt(encrypted_product, self.key_pair)
        self.assertEqual(decrypted_product, message * scalar, "Homomorphic multiplication should work.")

    def test_vote_encryption_and_aggregation(self):
        """Test the vote encryption and aggregation functionality."""
        vote_value = 1  # A "yes" vote
        encrypted_vote = self.vote_encryption.encrypt_vote(vote_value, self.key_pair.public_key)
        self.assertIsNotNone(encrypted_vote, "Vote should be encrypted.")

        # Test vote aggregation
        votes = [1, 0, 1, 1, 0]  # 3 yes votes, 2 no votes
        encrypted_votes = [
            self.vote_encryption.encrypt_vote(vote, self.key_pair.public_key)
            for vote in votes
        ]
        aggregated_ciphertext = self.vote_encryption.aggregate_votes(encrypted_votes, self.key_pair.public_key)
        decrypted_total = self.paillier.decrypt(aggregated_ciphertext, self.key_pair)
        self.assertEqual(decrypted_total, sum(votes), "Vote aggregation should produce the correct sum.")

    def test_vote_verification(self):
        """Test the verification of an encrypted vote."""
        vote_value = 1
        encrypted_vote = self.vote_encryption.encrypt_vote(vote_value, self.key_pair.public_key)
        is_valid = self.vote_encryption.verify_vote_encryption(encrypted_vote, self.key_pair.public_key)
        self.assertTrue(is_valid, "A validly encrypted vote should be verifiable.")

class ThresholdPaillierTest(TestCase):
    def setUp(self):
        """Set up for threshold Paillier tests."""
        self.total_trustees = 5
        self.threshold = 3
        self.threshold_paillier = ThresholdPaillier(total_trustees=self.total_trustees, threshold=self.threshold)
        # Use a key size compatible with Shamir's scheme
        self.paillier = PaillierEncryption(key_size=256)
        self.key_pair = self.paillier.generate_key_pair()

    def test_distributed_key_generation(self):
        """Test the generation of distributed key shares."""
        shares = self.threshold_paillier.generate_distributed_keys(self.key_pair)
        self.assertEqual(len(shares), self.total_trustees, "Should generate the correct number of shares.")
        self.assertTrue(all(isinstance(share, tuple) for share in shares), "Each share should be a tuple.")

    def test_partial_decryption(self):
        """Test the partial decryption functionality."""
        shares = self.threshold_paillier.generate_distributed_keys(self.key_pair)
        message = 42
        encrypted = self.paillier.encrypt(message, self.key_pair.public_key)
        
        # Test with one share
        partial_result = self.threshold_paillier.partial_decrypt(encrypted, shares[0][1], self.key_pair)
        self.assertIsNotNone(partial_result, "Partial decryption should produce a result.") 