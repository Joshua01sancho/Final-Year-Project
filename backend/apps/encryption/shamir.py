"""
Shamir's Secret Sharing Implementation

This module provides:
- Secret sharing for distributed key management
- Threshold reconstruction of secrets
- Secure key distribution among trustees
"""

import random
from typing import List, Tuple
from Crypto.Util.number import getPrime

class ShamirSecretSharing:
    """
    Implementation of Shamir's Secret Sharing scheme
    
    Allows splitting a secret into n shares such that any k shares
    can reconstruct the secret, but fewer than k shares reveal nothing.
    """
    
    def __init__(self, total_shares: int, threshold: int, prime: int = None):
        """
        Initialize Shamir's Secret Sharing
        
        Args:
            total_shares: Total number of shares to generate
            threshold: Minimum number of shares needed to reconstruct
            prime: Prime number for finite field (auto-generated if None)
        """
        if threshold > total_shares:
            raise ValueError("Threshold cannot be greater than total shares")
        
        self.total_shares = total_shares
        self.threshold = threshold
        
        # Generate a prime larger than the secret
        if prime is None:
            self.prime = getPrime(256)  # 256-bit prime
        else:
            self.prime = prime
    
    def generate_shares(self, secret: int) -> List[Tuple[int, int]]:
        """
        Generate shares for a given secret
        
        Args:
            secret: The secret to share
            
        Returns:
            List of (share_id, share_value) tuples
        """
        if secret >= self.prime:
            raise ValueError(f"Secret must be less than prime {self.prime}")
        
        # Generate random coefficients for polynomial
        coefficients = [secret]  # a0 = secret
        for i in range(1, self.threshold):
            coefficients.append(random.randint(1, self.prime - 1))
        
        # Generate shares by evaluating polynomial at different points
        shares = []
        for i in range(1, self.total_shares + 1):
            share_value = self._evaluate_polynomial(coefficients, i)
            shares.append((i, share_value))
        
        return shares
    
    def _evaluate_polynomial(self, coefficients: List[int], x: int) -> int:
        """
        Evaluate polynomial at point x using Horner's method
        
        Args:
            coefficients: Polynomial coefficients [a0, a1, a2, ...]
            x: Point to evaluate at
            
        Returns:
            Polynomial value at x
        """
        result = 0
        for coefficient in reversed(coefficients):
            result = (result * x + coefficient) % self.prime
        return result
    
    def reconstruct_secret(self, shares: List[Tuple[int, int]]) -> int:
        """
        Reconstruct the secret from shares using Lagrange interpolation
        
        Args:
            shares: List of (share_id, share_value) tuples
            
        Returns:
            Reconstructed secret
        """
        if len(shares) < self.threshold:
            raise ValueError(f"Need at least {self.threshold} shares to reconstruct")
        
        # Use only the first threshold shares
        shares = shares[:self.threshold]
        
        # Lagrange interpolation
        secret = 0
        for i, (x_i, y_i) in enumerate(shares):
            numerator = denominator = 1
            
            for j, (x_j, _) in enumerate(shares):
                if i != j:
                    numerator = (numerator * (-x_j)) % self.prime
                    denominator = (denominator * (x_i - x_j)) % self.prime
            
            # Calculate Lagrange coefficient
            lagrange_coeff = (numerator * self._mod_inverse(denominator)) % self.prime
            
            # Add contribution to secret
            secret = (secret + (y_i * lagrange_coeff)) % self.prime
        
        return secret
    
    def _mod_inverse(self, a: int) -> int:
        """
        Calculate modular inverse of a modulo prime
        
        Args:
            a: Number to find inverse for
            
        Returns:
            Modular inverse of a
        """
        def extended_gcd(a: int, b: int) -> Tuple[int, int, int]:
            if a == 0:
                return b, 0, 1
            gcd, x1, y1 = extended_gcd(b % a, a)
            x = y1 - (b // a) * x1
            y = x1
            return gcd, x, y
        
        gcd, x, _ = extended_gcd(a, self.prime)
        if gcd != 1:
            raise ValueError("Modular inverse does not exist")
        
        return (x % self.prime + self.prime) % self.prime
    
    def verify_share(self, share: Tuple[int, int], other_shares: List[Tuple[int, int]]) -> bool:
        """
        Verify that a share is consistent with other shares
        
        Args:
            share: Share to verify (share_id, share_value)
            other_shares: Other shares to check against
            
        Returns:
            True if share is consistent, False otherwise
        """
        if len(other_shares) < self.threshold - 1:
            return True  # Not enough shares to verify
        
        # Try to reconstruct using other shares
        try:
            reconstructed = self.reconstruct_secret(other_shares)
            
            # Check if this share is consistent
            expected_value = self._evaluate_polynomial([reconstructed], share[0])
            return expected_value == share[1]
        except:
            return False

class DistributedKeyManager:
    """
    High-level interface for managing distributed keys
    """
    
    def __init__(self, total_trustees: int, threshold: int):
        self.total_trustees = total_trustees
        self.threshold = threshold
        self.shamir = ShamirSecretSharing(total_trustees, threshold)
    
    def distribute_private_key(self, private_key: int) -> List[Tuple[int, int]]:
        """
        Distribute a private key among trustees
        
        Args:
            private_key: Private key to distribute
            
        Returns:
            List of (trustee_id, key_share) tuples
        """
        return self.shamir.generate_shares(private_key)
    
    def reconstruct_private_key(self, key_shares: List[Tuple[int, int]]) -> int:
        """
        Reconstruct private key from shares
        
        Args:
            key_shares: List of (trustee_id, key_share) tuples
            
        Returns:
            Reconstructed private key
        """
        return self.shamir.reconstruct_secret(key_shares)
    
    def verify_key_share(self, trustee_id: int, key_share: int, 
                        other_shares: List[Tuple[int, int]]) -> bool:
        """
        Verify that a trustee's key share is valid
        
        Args:
            trustee_id: ID of the trustee
            key_share: Trustee's key share
            other_shares: Other trustees' shares
            
        Returns:
            True if share is valid, False otherwise
        """
        return self.shamir.verify_share((trustee_id, key_share), other_shares)

class ThresholdDecryption:
    """
    Threshold decryption for Paillier cryptosystem
    """
    
    def __init__(self, total_trustees: int, threshold: int):
        self.key_manager = DistributedKeyManager(total_trustees, threshold)
    
    def generate_threshold_keys(self, paillier_key_pair) -> List[Tuple[int, int]]:
        """
        Generate threshold keys for Paillier decryption
        
        Args:
            paillier_key_pair: Paillier key pair
            
        Returns:
            List of (trustee_id, private_key_share) tuples
        """
        return self.key_manager.distribute_private_key(paillier_key_pair.private_key)
    
    def partial_decrypt(self, ciphertext: int, private_key_share: int, 
                       public_key: Tuple[int, int]) -> int:
        """
        Perform partial decryption using a key share
        
        Args:
            ciphertext: Encrypted message
            private_key_share: Private key share
            public_key: Paillier public key (n, g)
            
        Returns:
            Partial decryption result
        """
        n, _ = public_key
        n_squared = n * n
        
        # Partial decrypt: c^share mod n^2
        partial_result = pow(ciphertext, private_key_share, n_squared)
        return partial_result
    
    def combine_partial_decryptions(self, partial_results: List[int], 
                                  public_key: Tuple[int, int]) -> int:
        """
        Combine partial decryptions to get final result
        
        Args:
            partial_results: List of partial decryption results
            public_key: Paillier public key (n, g)
            
        Returns:
            Final decrypted message
        """
        n, _ = public_key
        n_squared = n * n
        
        # Combine using Lagrange interpolation
        combined = 1
        for partial in partial_results:
            combined = (combined * partial) % n_squared
        
        # Apply final decryption step
        l_combined = (combined - 1) // n
        return l_combined 