// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title E-Voting Smart Contract
 * @dev Secure voting contract with encryption support and fraud prevention
 */
contract VotingContract {
    
    struct Election {
        string electionId;
        string title;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool resultsPublished;
        uint256 totalVotes;
        address creator;
        mapping(address => bool) hasVoted;
        mapping(bytes32 => bool) voteHashes;
    }
    
    struct Vote {
        string electionId;
        bytes encryptedVote;
        bytes32 voteHash;
        uint256 timestamp;
        address voter;
        bool isValid;
    }
    
    // State variables
    mapping(string => Election) public elections;
    mapping(bytes32 => Vote) public votes;
    mapping(address => uint256) public voterVoteCount;
    
    // Events
    event ElectionCreated(string indexed electionId, string title, address creator);
    event VoteCast(string indexed electionId, bytes32 indexed voteHash, address voter);
    event VoteVerified(bytes32 indexed voteHash, bool isValid);
    event ElectionEnded(string indexed electionId, uint256 totalVotes);
    event ResultsPublished(string indexed electionId);
    
    // Modifiers
    modifier onlyElectionCreator(string memory electionId) {
        require(elections[electionId].creator == msg.sender, "Only election creator can perform this action");
        _;
    }
    
    modifier electionExists(string memory electionId) {
        require(elections[electionId].startTime > 0, "Election does not exist");
        _;
    }
    
    modifier electionActive(string memory electionId) {
        require(elections[electionId].isActive, "Election is not active");
        require(block.timestamp >= elections[electionId].startTime, "Election has not started");
        require(block.timestamp <= elections[electionId].endTime, "Election has ended");
        _;
    }
    
    modifier electionNotEnded(string memory electionId) {
        require(block.timestamp <= elections[electionId].endTime, "Election has ended");
        _;
    }
    
    /**
     * @dev Create a new election
     * @param electionId Unique identifier for the election
     * @param title Title of the election
     * @param startTime Start time of the election
     * @param endTime End time of the election
     */
    function createElection(
        string memory electionId,
        string memory title,
        uint256 startTime,
        uint256 endTime
    ) public {
        require(bytes(electionId).length > 0, "Election ID cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(elections[electionId].startTime == 0, "Election already exists");
        
        Election storage election = elections[electionId];
        election.electionId = electionId;
        election.title = title;
        election.startTime = startTime;
        election.endTime = endTime;
        election.isActive = true;
        election.resultsPublished = false;
        election.totalVotes = 0;
        election.creator = msg.sender;
        
        emit ElectionCreated(electionId, title, msg.sender);
    }
    
    /**
     * @dev Cast a vote in an election
     * @param electionId Election identifier
     * @param encryptedVote Encrypted vote data
     * @param voteHash Hash of the vote for verification
     */
    function castVote(
        string memory electionId,
        bytes memory encryptedVote,
        bytes32 voteHash
    ) public electionExists(electionId) electionActive(electionId) {
        Election storage election = elections[electionId];
        
        // Check if voter has already voted
        require(!election.hasVoted[msg.sender], "Voter has already voted");
        
        // Check if vote hash is unique
        require(!election.voteHashes[voteHash], "Vote hash already exists");
        
        // Validate vote data
        require(encryptedVote.length > 0, "Vote data cannot be empty");
        require(voteHash != bytes32(0), "Vote hash cannot be zero");
        
        // Record the vote
        Vote storage vote = votes[voteHash];
        vote.electionId = electionId;
        vote.encryptedVote = encryptedVote;
        vote.voteHash = voteHash;
        vote.timestamp = block.timestamp;
        vote.voter = msg.sender;
        vote.isValid = true;
        
        // Update election state
        election.hasVoted[msg.sender] = true;
        election.voteHashes[voteHash] = true;
        election.totalVotes++;
        
        // Update voter statistics
        voterVoteCount[msg.sender]++;
        
        emit VoteCast(electionId, voteHash, msg.sender);
    }
    
    /**
     * @dev Verify a vote's integrity
     * @param voteHash Hash of the vote to verify
     * @param isValid Whether the vote is valid
     */
    function verifyVote(bytes32 voteHash, bool isValid) public {
        require(votes[voteHash].timestamp > 0, "Vote does not exist");
        
        votes[voteHash].isValid = isValid;
        
        emit VoteVerified(voteHash, isValid);
    }
    
    /**
     * @dev End an election
     * @param electionId Election identifier
     */
    function endElection(string memory electionId) 
        public 
        electionExists(electionId) 
        onlyElectionCreator(electionId) 
        electionNotEnded(electionId) 
    {
        Election storage election = elections[electionId];
        election.isActive = false;
        
        emit ElectionEnded(electionId, election.totalVotes);
    }
    
    /**
     * @dev Publish election results
     * @param electionId Election identifier
     */
    function publishResults(string memory electionId) 
        public 
        electionExists(electionId) 
        onlyElectionCreator(electionId) 
    {
        Election storage election = elections[electionId];
        require(!election.isActive, "Election must be ended first");
        require(!election.resultsPublished, "Results already published");
        
        election.resultsPublished = true;
        
        emit ResultsPublished(electionId);
    }
    
    /**
     * @dev Check if a voter has voted in an election
     * @param electionId Election identifier
     * @param voter Address of the voter
     * @return True if voter has voted
     */
    function hasVoted(string memory electionId, address voter) 
        public 
        view 
        electionExists(electionId) 
        returns (bool) 
    {
        return elections[electionId].hasVoted[voter];
    }
    
    /**
     * @dev Get election information
     * @param electionId Election identifier
     * @return title The title of the election
     * @return startTime The start time of the election
     * @return endTime The end time of the election
     * @return isActive The active state of the election
     * @return totalVotes The total votes cast in the election
     * @return creator The address of the election's creator
     */
    function getElectionInfo(string memory electionId) 
        public
        view
        electionExists(electionId)
        returns (
            string memory title,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            uint256 totalVotes,
            address creator
        )
    {
        Election storage election = elections[electionId];
        return (
            election.title,
            election.startTime,
            election.endTime,
            election.isActive,
            election.totalVotes,
            election.creator
        );
    }
    
    /**
     * @dev Get vote information
     * @param voteHash Hash of the vote
     * @return electionId The election the vote belongs to
     * @return timestamp The time the vote was cast
     * @return voter The address of the voter
     * @return isValid The validity status of the vote
     */
    function getVoteInfo(bytes32 voteHash) 
        public
        view
        returns (
            string memory electionId,
            uint256 timestamp,
            address voter,
            bool isValid
        )
    {
        Vote storage vote = votes[voteHash];
        require(vote.timestamp > 0, "Vote does not exist");
        
        return (
            vote.electionId,
            vote.timestamp,
            vote.voter,
            vote.isValid
        );
    }
    
    /**
     * @dev Get voter's vote count across all elections
     * @param voter Address of the voter
     * @return Total number of votes cast by the voter
     */
    function getVoterVoteCount(address voter) public view returns (uint256) {
        return voterVoteCount[voter];
    }
    
    /**
     * @dev Check if a vote hash exists
     * @param voteHash Hash to check
     * @return True if vote hash exists
     */
    function voteHashExists(bytes32 voteHash) public view returns (bool) {
        return votes[voteHash].timestamp > 0;
    }
    
    /**
     * @dev Emergency function to pause election (only creator)
     * @param electionId Election identifier
     */
    function pauseElection(string memory electionId) 
        public 
        electionExists(electionId) 
        onlyElectionCreator(electionId) 
    {
        Election storage election = elections[electionId];
        require(election.isActive, "Election is not active");
        
        election.isActive = false;
    }
    
    /**
     * @dev Resume paused election (only creator)
     * @param electionId Election identifier
     */
    function resumeElection(string memory electionId) 
        public 
        electionExists(electionId) 
        onlyElectionCreator(electionId) 
    {
        Election storage election = elections[electionId];
        require(!election.isActive, "Election is already active");
        require(block.timestamp <= election.endTime, "Election has ended");
        
        election.isActive = true;
    }
} 