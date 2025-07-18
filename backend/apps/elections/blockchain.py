import json
import os
from web3 import Web3
from django.conf import settings
from datetime import datetime

class BlockchainService:
    def __init__(self):
        # Connect to local Ganache instance
        self.w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
        
        # Load contract ABI and address
        contract_path = os.path.join(settings.BASE_DIR, '..', 'truffle', 'build', 'contracts', 'VotingContract.json')
        print(f"DEBUG: Contract path = {contract_path}")
        print(f"DEBUG: Contract file exists = {os.path.exists(contract_path)}")
        
        with open(contract_path) as f:
            contract_json = json.load(f)
            self.contract_abi = contract_json['abi']
            self.contract_address = contract_json['networks']['5777']['address']
            print(f"DEBUG: Contract address = {self.contract_address}")
        
        # Initialize contract
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        
        # Get admin account - use the account that corresponds to our private key
        # The private key 0x0ed17026394b4281656acc55a667c779fe602966a48596a8148076ad043c81f5
        # corresponds to account 2: 0xff26aef8e8315c2cd84846a3e4312f2d71b51a7e
        self.admin_account = self.w3.eth.accounts[2]  # Use account 2 instead of 0
        print(f"DEBUG: Admin account = {self.admin_account}")
        
    def create_election(self, election_id, title, start_time, end_time):
        """Create a new election on the blockchain."""
        try:
            # Convert datetime to Unix timestamp
            start_timestamp = int(start_time.timestamp())
            end_timestamp = int(end_time.timestamp())
            
            # Build transaction
            tx = self.contract.functions.createElection(
                election_id,
                title,
                start_timestamp,
                end_timestamp
            ).build_transaction({
                'from': self.admin_account,
                'gas': 2000000,
                'nonce': self.w3.eth.get_transaction_count(self.admin_account)
            })
            
            # Sign and send transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=settings.ADMIN_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return True, receipt.transactionHash.hex()
            
        except Exception as e:
            return False, str(e)
    
    def cast_vote(self, election_id, voter_address, encrypted_vote, vote_hash):
        """Cast a vote in an election."""
        try:
            print(f"DEBUG: cast_vote called with:")
            print(f"  election_id = {election_id} (type: {type(election_id)})")
            print(f"  voter_address = {voter_address} (type: {type(voter_address)})")
            print(f"  encrypted_vote = {encrypted_vote} (type: {type(encrypted_vote)})")
            print(f"  vote_hash = {vote_hash} (type: {type(vote_hash)})")
            
            # Convert hex strings to bytes if necessary
            if isinstance(encrypted_vote, str) and encrypted_vote.startswith('0x'):
                encrypted_vote_bytes = bytes.fromhex(encrypted_vote[2:])
            else:
                encrypted_vote_bytes = encrypted_vote
            if isinstance(vote_hash, str) and vote_hash.startswith('0x'):
                vote_hash_bytes = bytes.fromhex(vote_hash[2:])
            else:
                vote_hash_bytes = vote_hash
            print(f"  encrypted_vote_bytes = {encrypted_vote_bytes} (type: {type(encrypted_vote_bytes)})")
            print(f"  vote_hash_bytes = {vote_hash_bytes} (type: {type(vote_hash_bytes)})")
            
            # Check if voter has already voted
            has_voted = self.contract.functions.hasVoted(election_id, voter_address).call()
            if has_voted:
                return False, "Voter has already cast a vote in this election"
            
            # Build transaction
            tx = self.contract.functions.castVote(
                election_id,
                encrypted_vote_bytes,
                vote_hash_bytes
            ).build_transaction({
                'from': voter_address,
                'gas': 2000000,
                'nonce': self.w3.eth.get_transaction_count(voter_address)
            })
            
            # Sign and send transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=settings.VOTER_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return True, receipt.transactionHash.hex()
            
        except Exception as e:
            print(f"DEBUG: cast_vote exception = {e}")
            return False, str(e)
    
    def get_election_details(self, election_id):
        """Get election details from the blockchain."""
        try:
            details = self.contract.functions.getElection(election_id).call()
            return {
                'id': details[0],
                'title': details[1],
                'start_time': datetime.fromtimestamp(details[2]),
                'end_time': datetime.fromtimestamp(details[3]),
                'is_active': details[4],
                'total_votes': details[5],
                'creator': details[6]
            }
        except Exception as e:
            return None
    
    def verify_vote(self, vote_hash):
        """Verify a vote on the blockchain."""
        try:
            details = self.contract.functions.getVote(vote_hash).call()
            return {
                'election_id': details[0],
                'timestamp': datetime.fromtimestamp(details[1]),
                'voter': details[2],
                'is_valid': details[3]
            }
        except Exception as e:
            return None
    
    def end_election(self, election_id):
        """End an election on the blockchain."""
        try:
            tx = self.contract.functions.endElection(election_id).build_transaction({
                'from': self.admin_account,
                'gas': 2000000,
                'nonce': self.w3.eth.get_transaction_count(self.admin_account)
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=settings.ADMIN_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return True, receipt.transactionHash.hex()
            
        except Exception as e:
            return False, str(e) 