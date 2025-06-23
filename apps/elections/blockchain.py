from web3 import Web3
from django.conf import settings
import json

class BlockchainService:
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        self.contract = None
        self.contract_address = settings.BLOCKCHAIN_CONTRACT_ADDRESS
        self.abi = self._load_contract_abi()
        if self.contract_address and self.abi:
            self.contract = self.web3.eth.contract(address=self.contract_address, abi=self.abi)

    def _load_contract_abi(self):
        # In production, load ABI from a file or environment
        # Here, use a minimal ABI for demonstration
        return [
            {
                "inputs": [
                    {"internalType": "string", "name": "_electionId", "type": "string"},
                    {"internalType": "bytes", "name": "_encryptedVote", "type": "bytes"}
                ],
                "name": "castVote",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "string", "name": "_electionId", "type": "string"}
                ],
                "name": "getVoteCount",
                "outputs": [
                    {"internalType": "uint256", "name": "", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    def cast_vote(self, election_id, encrypted_vote, private_key):
        if not self.contract:
            raise Exception('Blockchain contract not initialized')
        account = self.web3.eth.account.privateKeyToAccount(private_key)
        nonce = self.web3.eth.get_transaction_count(account.address)
        txn = self.contract.functions.castVote(
            str(election_id),
            bytes.fromhex(encrypted_vote)
        ).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 200000,
            'gasPrice': self.web3.toWei('5', 'gwei')
        })
        signed_txn = self.web3.eth.account.sign_transaction(txn, private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        return tx_hash.hex()

    def get_vote_count(self, election_id):
        if not self.contract:
            raise Exception('Blockchain contract not initialized')
        return self.contract.functions.getVoteCount(str(election_id)).call()

    def get_transaction_receipt(self, tx_hash):
        return self.web3.eth.get_transaction_receipt(tx_hash)

blockchain_service = BlockchainService() 