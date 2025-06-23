const VotingContract = artifacts.require("VotingContract");

module.exports = async function(callback) {
  try {
    // Get the deployed contract
    const voting = await VotingContract.deployed();
    console.log("Contract address:", voting.address);

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0];
    console.log("Admin account:", admin);

    // Get current block timestamp
    const block = await web3.eth.getBlock('latest');
    const currentTime = block.timestamp;
    console.log("\nCurrent blockchain time:", new Date(currentTime * 1000).toLocaleString());

    // Create an election
    const electionId = "TEST_ELECTION_1";
    const title = "Test Election 2024";
    const startTime = currentTime + 30; // Start in 30 seconds
    const endTime = startTime + 3600; // Run for 1 hour

    console.log("\nCreating election...");
    console.log("Start time:", new Date(startTime * 1000).toLocaleString());
    console.log("End time:", new Date(endTime * 1000).toLocaleString());
    
    await voting.createElection(
      electionId,
      title,
      startTime,
      endTime,
      { from: admin }
    );

    // Get election details
    console.log("\nFetching election details...");
    const election = await voting.getElection(electionId);
    console.log("Election details:");
    console.log("- ID:", election.id_);
    console.log("- Title:", election.title_);
    console.log("- Start time:", new Date(election.startTime_ * 1000).toLocaleString());
    console.log("- End time:", new Date(election.endTime_ * 1000).toLocaleString());
    console.log("- Is active:", election.isActive_);
    console.log("- Total votes:", election.totalVotes_.toString());
    console.log("- Creator:", election.creator_);

    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
}; 