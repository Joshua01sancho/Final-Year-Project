from web3 import Web3
import json
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.elections.models import Election

# --- CONFIGURE THESE ---
provider_url = "http://127.0.0.1:7545"
contract_address = "0x4A8A2B46125715171936334Df41EDf073b529f84"  # Your contract address

election_title = "Unzasu"  # Set the election title you want to check

election_obj = Election.objects.filter(title=election_title).first()
if not election_obj:
    print(f"Election with title '{election_title}' not found in the database.")
    sys.exit(1)

election_id = str(election_obj.id)  # or election_obj.election_id if you use a custom field
print(f"Using election ID: {election_id} for title '{election_title}'")

# Load ABI
with open("truffle/build/contracts/VotingContract.json") as f:
    contract_abi = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(provider_url))
contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=contract_abi)

try:
    election = contract.functions.getElection(election_id).call()
    print(f"Election details for '{election_id}':", election)
except Exception as e:
    print(f"Error fetching election '{election_id}':", e) 