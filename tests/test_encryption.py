import pytest
from django.test import TestCase
from apps.encryption.paillier import PaillierEncryption, ThresholdPaillier, VoteEncryption
from apps.encryption.shamir import ShamirSecretSharing, DistributedKeyManager, ThresholdDecryption

class PaillierEncryptionTest(TestCase):
    def setUp(self):
        self.paillier = PaillierEncryption()

    def test_key_pair_creation(self):
        key_pair = self.paillier.generate_key_pair()
        self.assertIsNotNone(key_pair.public_key)
        self.assertIsNotNone(key_pair.private_key)
        self.assertEqual(len(key_pair.public_key), 2)  # (n, g)

    def test_basic_encryption_decryption(self):
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

    def test_homomorphic_multiplication(self):
        key_pair = self.paillier.generate_key_pair()
        message = 5
        scalar = 3
        encrypted = self.paillier.encrypt(message, key_pair.public_key)
        encrypted_product = self.paillier.multiply_ciphertext(encrypted, scalar, key_pair.public_key)
        decrypted_product = self.paillier.decrypt(encrypted_product, key_pair)
        self.assertEqual(decrypted_product, message * scalar)

class ShamirSecretSharingTest(TestCase):
    def setUp(self):
        self.shamir = ShamirSecretSharing(total_shares=5, threshold=3)

    def test_share_generation(self):
        secret = 12345
        shares = self.shamir.generate_shares(secret)
        self.assertEqual(len(shares), 5)
        for share_id, share_value in shares:
            self.assertIsInstance(share_id, int)
            self.assertIsInstance(share_value, int)

    def test_secret_reconstruction(self):
        secret = 12345
        shares = self.shamir.generate_shares(secret)
        # Use only threshold number of shares
        threshold_shares = shares[:3]
        reconstructed = self.shamir.reconstruct_secret(threshold_shares)
        self.assertEqual(secret, reconstructed)

    def test_insufficient_shares(self):
        secret = 12345
        shares = self.shamir.generate_shares(secret)
        # Try with fewer than threshold shares
        insufficient_shares = shares[:2]
        with self.assertRaises(ValueError):
            self.shamir.reconstruct_secret(insufficient_shares)

class DistributedKeyManagerTest(TestCase):
    def setUp(self):
        self.key_manager = DistributedKeyManager(total_trustees=5, threshold=3)

    def test_key_distribution(self):
        private_key = 12345
        shares = self.key_manager.distribute_private_key(private_key)
        self.assertEqual(len(shares), 5)

    def test_key_reconstruction(self):
        private_key = 12345
        shares = self.key_manager.distribute_private_key(private_key)
        reconstructed = self.key_manager.reconstruct_private_key(shares[:3])
        self.assertEqual(private_key, reconstructed)

class ThresholdPaillierTest(TestCase):
    def setUp(self):
        self.threshold_paillier = ThresholdPaillier(total_trustees=5, threshold=3)

    def test_distributed_key_generation(self):
        paillier = PaillierEncryption()
        key_pair = paillier.generate_key_pair()
        shares = self.threshold_paillier.generate_distributed_keys(key_pair)
        self.assertEqual(len(shares), 5)

    def test_partial_decryption(self):
        paillier = PaillierEncryption()
        key_pair = paillier.generate_key_pair()
        message = 42
        encrypted = paillier.encrypt(message, key_pair.public_key)
        
        shares = self.threshold_paillier.generate_distributed_keys(key_pair)
        partial_result = self.threshold_paillier.partial_decrypt(
            encrypted, shares[0][1], key_pair
        )
        self.assertIsNotNone(partial_result)

class VoteEncryptionTest(TestCase):
    def setUp(self):
        self.vote_encryption = VoteEncryption()

    def test_vote_encryption(self):
        paillier = PaillierEncryption()
        key_pair = paillier.generate_key_pair()
        vote_value = 1  # Yes vote
        encrypted_vote = self.vote_encryption.encrypt_vote(vote_value, key_pair.public_key)
        self.assertIsNotNone(encrypted_vote)

    def test_vote_aggregation(self):
        paillier = PaillierEncryption()
        key_pair = paillier.generate_key_pair()
        votes = [1, 0, 1, 1, 0]  # 3 yes votes, 2 no votes
        encrypted_votes = [
            self.vote_encryption.encrypt_vote(vote, key_pair.public_key)
            for vote in votes
        ]
        aggregated = self.vote_encryption.aggregate_votes(encrypted_votes, key_pair.public_key)
        self.assertIsNotNone(aggregated)

    def test_vote_verification(self):
        paillier = PaillierEncryption()
        key_pair = paillier.generate_key_pair()
        vote_value = 1
        encrypted_vote = self.vote_encryption.encrypt_vote(vote_value, key_pair.public_key)
        is_valid = self.vote_encryption.verify_vote_encryption(encrypted_vote, key_pair.public_key)
        self.assertTrue(is_valid) 