from web3 import Web3
import json
import time
import pytz
import datetime

# --- CONFIGURE THESE ---
provider_url = "http://127.0.0.1:7545"
contract_address = "0x4A8A2B46125715171936334Df41EDf073b529f84"  # Your contract address
admin_private_key = "0x6d9f7dd4ab13967cbb725811913f70086a9ca2dac2edd8e60e4b5321c2fce64f"  # Replace with yor Ganache admin private key
admin_address = "0xE2E445F2053470497A96ff3ae1386dcc7DAbCf33"          # Replace with your Ganache admin address

# Load ABI
with open("truffle/build/contracts/VotingContract.json") as f:
    contract_abi = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(provider_url))
contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=contract_abi)

election_id = "3"
title = "Unzasu"

# Election times in Africa/Lusaka local time
local_tz = pytz.timezone("Africa/Lusaka")
start_dt = local_tz.localize(datetime.datetime(2025, 6, 26, 17, 11, 47))
end_dt = local_tz.localize(datetime.datetime(2025, 6, 27, 17, 9, 12))

# Convert to UTC
start_utc = start_dt.astimezone(pytz.utc)
end_utc = end_dt.astimezone(pytz.utc)

# Get Unix timestamps
start_time = int(start_utc.timestamp())
end_time = int(end_utc.timestamp())

print("Start time (UTC):", start_time)
print("End time (UTC):", end_time)

nonce = w3.eth.get_transaction_count(admin_address)
txn = contract.functions.createElection(election_id, title, start_time, end_time).build_transaction({
    'from': admin_address,
    'nonce': nonce,
    'gas': 2000000,
    'gasPrice': w3.to_wei('20', 'gwei')
})

signed_txn = w3.eth.account.sign_transaction(txn, private_key=admin_private_key)
tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
print("Transaction hash:", w3.to_hex(tx_hash))
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Transaction receipt:", receipt) 