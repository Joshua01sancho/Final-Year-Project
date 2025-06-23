from web3 import Web3
import json
import os
import subprocess
import tempfile

def load_contract_data():
    """
    Loads the pre-compiled contract ABI and BIN from the build directory.
    """
    build_dir = 'blockchain/build'
    # The file is named after the contract, i.e., VotingContract.abi and VotingContract.bin
    abi_file_path = os.path.join(build_dir, 'VotingContract.abi')
    bin_file_path = os.path.join(build_dir, 'VotingContract.bin')

    if not os.path.exists(abi_file_path) or not os.path.exists(bin_file_path):
        raise FileNotFoundError(
            "Contract ABI or BIN not found. "
            "Please compile the contract first using: solc --abi --bin -o ./blockchain/build ./blockchain/VotingContract.sol"
        )

    with open(abi_file_path, 'r') as f:
        abi = json.load(f)
    
    with open(bin_file_path, 'r') as f:
        bytecode = f.read()

    return {'abi': abi, 'bin': bytecode}

def deploy_contract(w3, contract_interface, account):
    Contract = w3.eth.contract(
        abi=contract_interface['abi'],
        bytecode=contract_interface['bin']
    )

    # Deploy the contract
    tx_hash = Contract.constructor().transact({'from': account})
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    # Save contract address and ABI
    contract_data = {
        'address': tx_receipt.contractAddress,
        'abi': contract_interface['abi']
    }
    
    with open('blockchain/contract_data.json', 'w') as f:
        json.dump(contract_data, f, indent=2)

    return tx_receipt.contractAddress

def main():
    try:
        # Connect to Ganache
        w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
        
        # Ensure connection is successful
        if not w3.is_connected():
            raise Exception("Couldn't connect to Ganache. Make sure Ganache is running on port 7545")

        # Get the first account from Ganache
        account = w3.eth.accounts[0]
        
        print("Connected to Ganache successfully!")
        print(f"Using account: {account}")
        
        # Load pre-compiled contract data
        print("Loading pre-compiled contract data...")
        contract_interface = load_contract_data()
        
        print("Deploying contract...")
        contract_address = deploy_contract(w3, contract_interface, account)
        
        print(f"\nContract deployed successfully!")
        print(f"Contract address: {contract_address}")
        print(f"Contract data saved to blockchain/contract_data.json")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("\nPlease make sure:")
        print("1. Ganache is running on http://127.0.0.1:7545")
        print("2. You have sufficient ETH in your account")
        print("3. The contract has been compiled and the ABI/BIN files are in blockchain/build/")

if __name__ == "__main__":
    main() 