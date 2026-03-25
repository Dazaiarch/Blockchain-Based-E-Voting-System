import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface IVoting {
    function getResults(uint256 electionId) external view returns (uint256[] memory);
    function electionResultsTallied(uint256 electionId) external view returns (bool);
}

contract DAOAudit is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Proposal {
        uint256 electionId;
        uint256[] proposedResults;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 creationTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }
uint256 public proposalCounter;
    mapping(uint256 => Proposal) public proposals;
    EnumerableSet.AddressSet private auditors;
    
    address public votingContract;
    uint256 public votingPeriod;
    uint256 public quorum;
    
    uint256 public latestApprovedResult;
    uint256 public latestApprovedElection;
    bool public hasApprovedResult;

    event ProposalCreated(uint256 indexed proposalId, uint256 indexed electionId, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ResultApproved(uint256 indexed electionId, uint256[] results);
    event AuditorAdded(address indexed auditor);
    event AuditorRemoved(address indexed auditor);
function addAuditor(address auditor) external onlyOwner {
        require(!auditors.contains(auditor), "Already an auditor");
        auditors.add(auditor);
        emit AuditorAdded(auditor);
    }

    function removeAuditor(address auditor) external onlyOwner {
        require(auditors.contains(auditor), "Not an auditor");
        auditors.remove(auditor);
        emit AuditorRemoved(auditor);
    }

    function getAuditorCount() external view returns (uint256) {
        return auditors.length();
    }

    function getAuditor(uint256 index) external view returns (address) {
        return auditors.at(index);
    }

    function createAuditProposal(
        uint256 electionId,
        uint256[] memory proposedResults,
        string memory description
    ) external onlyAuditor returns (uint256) {
        require(IVoting(votingContract).electionResultsTallied(electionId), "Results not yet tallied");
        
uint256 proposalId = proposalCounter++;
            
            Proposal storage proposal = proposals[proposalId];
            proposal.electionId = electionId;
            proposal.proposedResults = proposedResults;
            proposal.description = description;
            proposal.forVotes = 0;
            proposal.againstVotes = 0;
            proposal.creationTime = block.timestamp;
            proposal.executed = false;
            
            emit ProposalCreated(proposalId, electionId, description);
            return proposalId;
        }
        function voteOnProposal(uint256 proposalId, bool support) external onlyAuditor {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(
            block.timestamp <= proposal.creationTime + votingPeriod,
            "Voting period ended"
        );
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }
        
        emit VoteCast(proposalId, msg.sender, support);
    }
function executeProposal(uint256 proposalId) external onlyAuditor {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(
            block.timestamp > proposal.creationTime + votingPeriod,
            "Voting period not ended"
        );
        require(proposal.forVotes >= quorum, "Quorum not reached");
        require(proposal.forVotes > proposal.againstVotes, "Vote failed");
        
        proposal.executed = true;
        latestApprovedResult = uint256(keccak256(abi.encodePacked(proposal.proposedResults)));
        latestApprovedElection = proposal.electionId;
        hasApprovedResult = true;
        
        emit ResultApproved(proposal.electionId, proposal.proposedResults);
    }
    function getProposalVotes(uint256 proposalId) external view returns (uint256 forVotes, uint256 againstVotes) {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.forVotes, proposal.againstVotes);
    }

    function hasAuditorVoted(uint256 proposalId, address auditor) external view returns (bool) {
        return proposals[proposalId].hasVoted[auditor];
    }

    function verifyResult(uint256 electionId, uint256[] memory claimedResults) external view returns (bool) {
        if (!hasApprovedResult || latestApprovedElection != electionId) {
            return false;
        }
        
        uint256 claimedHash = uint256(keccak256(abi.encodePacked(claimedResults)));
        return claimedHash == latestApprovedResult;
    }
    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        votingPeriod = _votingPeriod;
    }

    function setQuorum(uint256 _quorum) external onlyOwner {
        quorum = _quorum;
    }

    function setVotingContract(address _votingContract) external onlyOwner {
        votingContract = _votingContract;
    }
}












































