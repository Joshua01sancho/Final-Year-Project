const VotingContract = artifacts.require("VotingContract");
const Web3 = require('web3');

module.exports = async function(callback) {
  try {
    // Get the deployed contract
    const voting = await VotingContract.deployed();
    console.log("Contract address:", voting.address);

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const voter = accounts[1]; // Using the second account as voter
    console.log("Voter account:", voter);

    // Get current block timestamp
    const block = await web3.eth.getBlock('latest');
    console.log("\nCurrent blockchain time:", new Date(block.timestamp * 1000).toLocaleString());

    // Election details
    const electionId = "TEST_ELECTION_1";
    const election = await voting.getElection(electionId);
    console.log("\nElection timing:");
    console.log("Start time:", new Date(election.startTime_ * 1000).toLocaleString());
    console.log("End time:", new Date(election.endTime_ * 1000).toLocaleString());
    console.log("Is active:", election.isActive_);
    
    // Create an encrypted vote (simulated encryption for testing)
    const voteData = web3.utils.asciiToHex("CANDIDATE_1");
    const voteHash = web3.utils.soliditySha3(
      { t: 'string', v: electionId },
      { t: 'bytes', v: voteData },
      { t: 'address', v: voter }
    );

    console.log("\nCasting vote...");
    console.log("Election ID:", electionId);
    console.log("Vote Hash:", voteHash);

    // Check if voter has already voted
    const hasVoted = await voting.hasVoted(electionId, voter);
    if (hasVoted) {
      console.log("This voter has already cast a vote in this election!");
      return callback();
    }

    // Cast the vote
    await voting.castVote(
      electionId,
      voteData,
      voteHash,
      { from: voter }
    );

    // Verify the vote was recorded
    const voteInfo = await voting.getVote(voteHash);
    console.log("\nVote details:");
    console.log("- Election ID:", voteInfo.electionId_);
    console.log("- Timestamp:", new Date(voteInfo.timestamp_ * 1000).toLocaleString());
    console.log("- Voter:", voteInfo.voter_);
    console.log("- Is Valid:", voteInfo.isValid_);

    // Get updated election details
    const updatedElection = await voting.getElection(electionId);
    console.log("\nUpdated election details:");
    console.log("- Total votes:", updatedElection.totalVotes_.toString());

    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
}; 