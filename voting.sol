import "@openzeppelin/contracts/access/Ownable.sol";

interface ISoulBoundToken {
    function isEligible(address account) external view returns (bool);
    function locked(uint256 tokenId) external view returns (bool);
}

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) external view returns (bool);
}

contract Voting is Ownable {
    struct Election {
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 candidateCount;
        address authority;
        address soulBoundToken;
        address verifier;
        bool active;
    }
ionCreated(uint256 indexed electionId, string name, address authority);
    event VoterRegistered(uint256 instruct Candidate {
        string name;
        string party;
        string imageHash;
    }

    mapping(uint256 => Election) public elections;
    mapping(uint256 => Candidate[]) public candidates;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bytes32)) public voteCommitments;
    mapping(uint256 => mapping(address => uint256)) public voterTokenIds;
    
    mapping(uint256 => mapping(uint256 => bytes32)) public encryptedVotes;
    mapping(uint256 => uint256) public voteCount;
    mapping(uint256 => bool) public electionResultsTallied;
    mapping(uint256 => uint256[]) public electionResults;
    
    uint256 public electionCounter;
   event Electdexed electionId, address indexed voter);
    event VoteCast(uint256 indexed electionId, address indexed voter, bytes32 commitment);
    event ElectionEnded(uint256 indexed electionId);
    event ResultsTallied(uint256 indexed electionId, uint256[] results);
    event CandidateAdded(uint256 indexed electionId, uint256 candidateId, string name);
function createElection(
        string memory name,
        uint256 candidateCount,
        uint256 duration,
        address authority,
        address soulBoundToken,
        address verifier
    ) external onlyOwner returns (uint256) {
        uint256 electionId = electionCounter++;
        
        elections[electionId] = Election({
            name: name,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            candidateCount: candidateCount,
            authority: authority,
            soulBoundToken: soulBoundToken,
            verifier: verifier,
            active: true
        });
        
        emit ElectionCreated(electionId, name, authority);
        return electionId;
    }

    function addCandidates(
        uint256 electionId,
        string[] memory names,
        string[] memory parties,
        string[] memory imageHashes
    ) external {
        require(elections[electionId].authority == msg.sender || msg.sender == owner(), "Not authorized");
        
        for (uint256 i = 0; i < names.length; i++) {
            candidates[electionId].push(Candidate({
                name: names[i],
                party: parties[i],
                imageHash: imageHashes[i]
            }));
            emit CandidateAdded(electionId, i, names[i]);
        }
    }

    function registerVoter(uint256 electionId, address voter) external {
        Election storage election = elections[electionId];
        require(election.active, "Election not active");
        require(block.timestamp <= election.endTime, "Election ended");
        require(!hasVoted[electionId][voter], "Already registered");
        
        ISoulBoundToken sbt = ISoulBoundToken(election.soulBoundToken);
        require(sbt.isEligible(voter), "Not eligible (no SBT)");
        
        hasVoted[electionId][voter] = false;
        
        emit VoterRegistered(electionId, voter);
    }

    function castVote(
        uint256 electionId,
        bytes32 encryptedVote,
        bytes32 nullifierHash,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) external {
        Election storage election = elections[electionId];
        require(election.active, "Election not active");
        require(block.timestamp <= election.endTime, "Election ended");
        
        ISoulBoundToken sbt = ISoulBoundToken(election.soulBoundToken);
        require(sbt.isEligible(msg.sender), "Not eligible (no SBT)");
        require(!hasVoted[electionId][msg.sender], "Already voted");
        
        require(voteCommitments[electionId][msg.sender] == bytes32(0), "Vote already cast");
        if (election.verifier != address(0)) {
            IVerifier verifier = IVerifier(election.verifier);
            uint256[3] memory input = [
                uint256(uint160(msg.sender)),
                uint256(nullifierHash),
                electionId
            ];
            require(verifier.verifyProof(a, b, c, input), "Invalid proof");
        }
        
        voteCommitments[electionId][msg.sender] = keccak256(abi.encodePacked(encryptedVote, nullifierHash));
        encryptedVotes[electionId][voteCount[electionId]] = encryptedVote;
        voteCount[electionId]++;
        hasVoted[electionId][msg.sender] = true;
        
        emit VoteCast(electionId, msg.sender, voteCommitments[electionId][msg.sender]);
    }

    function castVoteSimple(
        uint256 electionId,
        bytes32 encryptedVote,
        bytes32 nullifierHash
    ) external {
        Election storage election = elections[electionId];
        require(election.active, "Election not active");
        require(block.timestamp <= election.endTime, "Election ended");
        
        ISoulBoundToken sbt = ISoulBoundToken(election.soulBoundToken);
        require(sbt.isEligible(msg.sender), "Not eligible (no SBT)");
        require(!hasVoted[electionId][msg.sender], "Already voted");
        require(voteCommitments[electionId][msg.sender] == bytes32(0), "Vote already cast");
        
        voteCommitments[electionId][msg.sender] = keccak256(abi.encodePacked(encryptedVote, nullifierHash));
        encryptedVotes[electionId][voteCount[electionId]] = encryptedVote;
        voteCount[electionId]++;
        hasVoted[electionId][msg.sender] = true;
        
        emit VoteCast(electionId, msg.sender, voteCommitments[electionId][msg.sender]);
    }

    function endElection(uint256 electionId) external {
        require(elections[electionId].authority == msg.sender || msg.sender == owner(), "Not authorized");
        elections[electionId].active = false;
        emit ElectionEnded(electionId);
    }
    function tallyVotes(uint256 electionId) external {
        require(!electionResultsTallied[electionId], "Already tallied");
        require(!elections[electionId].active || block.timestamp > elections[electionId].endTime, "Election still active");
        
        uint256 candidateCount = elections[electionId].candidateCount;
        uint256[] memory results = new uint256[](candidateCount);
        
        for (uint256 i = 0; i < voteCount[electionId]; i++) {
            bytes32 vote = encryptedVotes[electionId][i];
            uint256 candidateIndex = uint256(vote) % candidateCount;
            results[candidateIndex]++;
            }
            function getElectionDetails(uint256 electionId) external view returns (
        string memory name,
        uint256 startTime,
        uint256 endTime,
        uint256 candidateCount,
        bool active,
        bool tallied,
        uint256 totalVotes
    ) {
        Election memory e = elections[electionId];
        return (
            e.name,
            e.startTime,
            e.endTime,
            e.candidateCount,
            e.active,
            electionResultsTallied[electionId],
            voteCount[electionId]
        );
    }
     function getCandidates(uint256 electionId) external view returns (Candidate[] memory) {
        return candidates[electionId];
    }

    function getResults(uint256 electionId) external view returns (uint256[] memory) {
        require(electionResultsTallied[electionId], "Results not tallied");
        return electionResults[electionId];
    }

    function hasVotedInElection(uint256 electionId, address voter) external view returns (bool) {
        return hasVoted[electionId][voter];
    } 
}





    
