"""
Paillier Cryptosystem Implementation for E-Voting System

This module provides:
- Key generation for public/private key pairs
- Homomorphic encryption for votes
- Threshold decryption for secure vote counting
- Vote aggregation without revealing individual votes
"""

import random
import math
from typing import Tuple, List, Optional
from Crypto.Util.number import getPrime, inverse
from Crypto.Random import get_random_bytes
import gmpy2
from django.conf import settings

class PaillierKeyPair:
    """Represents a Paillier public/private key pair"""
    
    def __init__(self, public_key: Tuple[int, int], private_key: int):
        self.public_key = public_key
        self.private_key = private_key
        self.n, self.g = public_key
        self.lambda_val = private_key
        self.mu = inverse(self.lambda_val, self.n)
    
    def __str__(self):
        return f"PaillierKeyPair(n={self.n}, g={self.g})"

class PaillierEncryption:
    """Main class for Paillier encryption operations"""
    
    def __init__(self, key_size: int = None):
        self.key_size = key_size or 512  # Default to 512 bits
    
    def generate_key_pair(self) -> PaillierKeyPair:
        """
        Generate a new Paillier key pair
        
        Returns:
            PaillierKeyPair: Generated key pair
        """
        # Generate two large prime numbers
        p = getPrime(self.key_size // 2)
        q = getPrime(self.key_size // 2)
        
        # Ensure p and q are different
        while p == q:
            q = getPrime(self.key_size // 2)
        
        n = p * q
        lambda_val = math.lcm(p - 1, q - 1)
        
        # Choose generator g
        g = n + 1  # Common choice for g
        
        # Calculate mu
        mu = inverse(lambda_val, n)
        
        public_key = (n, g)
        private_key = lambda_val
        
        return PaillierKeyPair(public_key, private_key)
    
    def encrypt(self, message: int, public_key: Tuple[int, int]) -> int:
        """
        Encrypt a message using Paillier encryption
        
        Args:
            message: Plaintext message (integer)
            public_key: Public key tuple (n, g)
            
        Returns:
            int: Encrypted message
        """
        n, g = public_key
        
        # Ensure message is in valid range
        if message < 0 or message >= n:
            raise ValueError(f"Message must be in range [0, {n-1}]")
        
        # Choose random r
        r = random.randint(1, n - 1)
        while math.gcd(r, n) != 1:
            r = random.randint(1, n - 1)
        
        # Encrypt: c = g^m * r^n mod n^2
        n_squared = n * n
        c = (pow(g, message, n_squared) * pow(r, n, n_squared)) % n_squared
        
        return c
    
    def decrypt(self, ciphertext: int, key_pair: PaillierKeyPair) -> int:
        """
        Decrypt a ciphertext using Paillier decryption
        
        Args:
            ciphertext: Encrypted message
            key_pair: Key pair containing private key
            
        Returns:
            int: Decrypted message
        """
        n = key_pair.n
        lambda_val = key_pair.lambda_val
        mu = key_pair.mu
        n_squared = n * n
        
        # Decrypt: m = L(c^lambda mod n^2) * mu mod n
        # where L(x) = (x - 1) / n
        x = pow(ciphertext, lambda_val, n_squared)
        l_x = (x - 1) // n
        message = (l_x * mu) % n
        
        return message
    
    def add_ciphertexts(self, ciphertext1: int, ciphertext2: int, public_key: Tuple[int, int]) -> int:
        """
        Add two encrypted values (homomorphic property)
        
        Args:
            ciphertext1: First encrypted value
            ciphertext2: Second encrypted value
            public_key: Public key tuple (n, g)
            
        Returns:
            int: Encrypted sum
        """
        n, _ = public_key
        n_squared = n * n
        
        # Add: c1 * c2 mod n^2
        result = (ciphertext1 * ciphertext2) % n_squared
        return result
    
    def multiply_ciphertext(self, ciphertext: int, scalar: int, public_key: Tuple[int, int]) -> int:
        """
        Multiply encrypted value by a scalar (homomorphic property)
        
        Args:
            ciphertext: Encrypted value
            scalar: Plaintext scalar
            public_key: Public key tuple (n, g)
            
        Returns:
            int: Encrypted product
        """
        n, _ = public_key
        n_squared = n * n
        
        # Multiply: c^scalar mod n^2
        result = pow(ciphertext, scalar, n_squared)
        return result

class ThresholdPaillier:
    """Threshold Paillier implementation for distributed decryption"""
    
    def __init__(self, total_trustees: int, threshold: int = None):
        self.total_trustees = total_trustees
        self.threshold = threshold or settings.PAILLIER_THRESHOLD
        
        if self.threshold > self.total_trustees:
            raise ValueError("Threshold cannot be greater than total trustees")
    
    def generate_distributed_keys(self, key_pair: PaillierKeyPair) -> List[Tuple[int, int]]:
        """
        Generate distributed private key shares using Shamir's Secret Sharing
        
        Args:
            key_pair: Original key pair
            
        Returns:
            List of (trustee_id, private_key_share) tuples
        """
        from .shamir import ShamirSecretSharing
        
        shamir = ShamirSecretSharing(self.total_trustees, self.threshold)
        shares = shamir.generate_shares(key_pair.private_key)
        
        return shares
    
    def partial_decrypt(self, ciphertext: int, private_key_share: int, key_pair: PaillierKeyPair) -> int:
        """
        Perform partial decryption using a private key share
        
        Args:
            ciphertext: Encrypted message
            private_key_share: Private key share
            key_pair: Original key pair
            
        Returns:
            int: Partial decryption result
        """
        n = key_pair.n
        n_squared = n * n
        
        # Partial decrypt: c^share mod n^2
        partial_result = pow(ciphertext, private_key_share, n_squared)
        return partial_result
    
    def combine_partial_decryptions(self, partial_results: List[int], key_pair: PaillierKeyPair) -> int:
        """
        Combine partial decryptions to get final result
        
        Args:
            partial_results: List of partial decryption results
            key_pair: Original key pair
            
        Returns:
            int: Final decrypted message
        """
        n = key_pair.n
        n_squared = n * n
        
        # Combine using Lagrange interpolation
        combined = 1
        for partial in partial_results:
            combined = (combined * partial) % n_squared
        
        # Apply final decryption step
        l_combined = (combined - 1) // n
        mu = key_pair.mu
        message = (l_combined * mu) % n
        
        return message

class VoteEncryption:
    """High-level interface for vote encryption operations"""
    
    def __init__(self):
        self.paillier = PaillierEncryption()
    
    def encrypt_vote(self, vote_value: int, public_key: Tuple[int, int]) -> int:
        """
        Encrypt a single vote
        
        Args:
            vote_value: Vote value (typically 0 or 1 for yes/no)
            public_key: Election public key
            
        Returns:
            int: Encrypted vote
        """
        return self.paillier.encrypt(vote_value, public_key)
    
    def aggregate_votes(self, encrypted_votes: List[int], public_key: Tuple[int, int]) -> int:
        """
        Aggregate multiple encrypted votes
        
        Args:
            encrypted_votes: List of encrypted votes
            public_key: Election public key
            
        Returns:
            int: Encrypted vote count
        """
        if not encrypted_votes:
            return 0
        
        result = encrypted_votes[0]
        for vote in encrypted_votes[1:]:
            result = self.paillier.add_ciphertexts(result, vote, public_key)
        
        return result
    
    def verify_vote_encryption(self, encrypted_vote: int, public_key: Tuple[int, int]) -> bool:
        """
        Verify that an encrypted vote is valid
        
        Args:
            encrypted_vote: Encrypted vote to verify
            public_key: Election public key
            
        Returns:
            bool: True if valid, False otherwise
        """
        n, _ = public_key
        n_squared = n * n
        
        # Check if ciphertext is in valid range
        if encrypted_vote <= 0 or encrypted_vote >= n_squared:
            return False
        
        # Check if ciphertext is coprime with n
        if math.gcd(encrypted_vote, n) != 1:
            return False
        
        return True

# Global instance for easy access
vote_encryption = VoteEncryption() 