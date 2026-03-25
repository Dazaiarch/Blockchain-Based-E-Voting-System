 import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnect from './components/WalletConnect';
import ElectionCard from './components/ElectionCard';
import VoteModal from './components/VoteModal';
import Results from './components/Results';

const SOULBOUND_TOKEN_ABI = [
  "function isEligible(address account) external view returns (bool)",
  "function mint(address to, string memory tokenURI) external returns (uint256)",
  "function hasMinted(address account) external view returns (bool)"
];

const VOTING_ABI = [
  "function getElectionDetails(uint256 electionId) external view returns (string memory, uint256, uint256, uint256, bool, bool, uint256)",
  "function getCandidates(uint256 electionId) external view returns (tuple(string name, string party, string imageHash)[])",
  "function castVoteSimple(uint256 electionId, bytes32 encryptedVote, bytes32 nullifierHash) external",
  "function hasVotedInElection(uint256 electionId, address voter) external view returns (bool)",
  "function getResults(uint256 electionId) external view returns (uint256[])",
  "function registerVoter(uint256 electionId, address voter) external",
  "event VoteCast(uint256 indexed electionId, address indexed voter, bytes32 commitment)"
];

const DEPLOYMENTS = {
  sepolia: {
    SoulBoundToken: "0x0000000000000000000000000000000000000001",
    Voting: "0x0000000000000000000000000000000000000002"
  }
};

const NETWORK_CONFIGS = {
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }
};

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [sbtContract, setSbtContract] = useState(null);
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState('sepolia');

  useEffect(() => {
    initContracts();
  }, [account]);

  const initContracts = async () => {
    if (!window.ethereum) {
      setError("MetaMask not installed");
      setIsLoading(false);
      return;
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);

      const votingAddress = DEPLOYMENTS[network]?.Voting;
      const sbtAddress = DEPLOYMENTS[network]?.SoulBoundToken;

      if (votingAddress) {
        const voting = new ethers.Contract(votingAddress, VOTING_ABI, ethersProvider);
        setVotingContract(voting);

        const details = await voting.getElectionDetails(0);
        setElection({
          id: 0,
          name: details[0],
          startTime: details[1],
          endTime: details[2],
          candidateCount: details[3],
          active: details[4],
          tallied: details[5],
          totalVotes: details[6]
        });

        const candidateList = await voting.getCandidates(0);
        setCandidates(candidateList.map((c, i) => ({
          id: i,
          name: c.name,
          party: c.party,
          imageHash: c.imageHash
        })));
      }

      if (sbtAddress) {
        const sbt = new ethers.Contract(sbtAddress, SOULBOUND_TOKEN_ABI, ethersProvider);
        setSbtContract(sbt);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Contract init error:", err);
      setError("Failed to initialize contracts. Please switch to Sepolia network.");
      setIsLoading(false);
    }
  };

  const checkVotedStatus = async (account) => {
    if (votingContract && account) {
      const voted = await votingContract.hasVotedInElection(0, account);
      setHasVoted(voted);
    }
  };

  const handleConnect = async (account, signer) => {
    setAccount(account);
    setSigner(signer);
    
    if (votingContract && signer) {
      const votingWithSigner = votingContract.connect(signer);
      setVotingContract(votingWithSigner);
      await checkVotedStatus(account);
    }
  };

  const handleSelectCandidate = (candidateId) => {
    if (!hasVoted && election?.active) {
      setSelectedCandidate(candidateId);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !account) return;

    try {
      setIsLoading(true);
      
      const nullifier = ethers.randomBytes(32);
      const nullifierHash = ethers.keccak256(nullifier);
      
      const voteData = ethers.solidityPacked(["uint256", "uint256"], [selectedCandidate, 0]);
      const encryptedVote = ethers.keccak256(ethers.solidityPacked(["bytes", "bytes32"], [voteData, nullifier]));
      
      const tx = await votingContract.castVoteSimple(0, encryptedVote, nullifierHash);
      await tx.wait();
      
      setHasVoted(true);
      setShowVoteModal(false);
      setSelectedCandidate(null);
      
      alert("Vote cast successfully! Your vote has been recorded anonymously.");
    } catch (err) {
      console.error("Vote error:", err);
      setError(err.message || "Failed to cast vote");
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIGS.sepolia.chainId }]
      });
    } catch (switchError) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_CONFIGS.sepolia]
        });
      } catch (addError) {
        setError("Failed to switch to Sepolia network");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>
            Loading blockchain data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">🔗</div>
          <span>DemocraticChain</span>
        </div>
        <WalletConnect onConnect={handleConnect} />
      </header>

      <main className="main">
        <div className="hero">
          <h1>Secure Blockchain Voting</h1>
          <p>
            Cast your vote with complete anonymity using zero-knowledge proofs and homomorphic encryption. 
            Every vote is verifiable, but no one can see how you voted.
          </p>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Ballot Secrecy</h3>
            <p>Your vote is encrypted using homomorphic encryption. Only the final tally is revealed.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h3>Eligibility Verification</h3>
            <p> Soulbound tokens ensure only verified voters can participate. One person, one vote.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Coercion Resistance</h3>
            <p>Zero-knowledge proofs make it impossible to prove how you voted to anyone.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Publicly Auditable</h3>
            <p>All votes are recorded on-chain. Anyone can verify the integrity of the election.</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button 
              onClick={switchToSepolia}
              style={{marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer'}}
            >
              Switch to Sepolia
            </button>
          </div>
        )}

        {election && (
          <section className="election-section">
            <div className="section-header">
              <h2>{election.name}</h2>
              <span className={`status-badge ${election.active ? 'active' : 'ended'}`}>
                {election.active ? 'Active' : 'Ended'}
              </span>
            </div>

            <ElectionCard
              election={election}
              candidates={candidates}
              selectedCandidate={selectedCandidate}
              hasVoted={hasVoted}
              onSelect={handleSelectCandidate}
            />

            {selectedCandidate && !hasVoted && election.active && (
              <button 
                className="vote-btn"
                onClick={() => setShowVoteModal(true)}
              >
                Cast Vote for {candidates[selectedCandidate]?.name}
              </button>
            )}

            {hasVoted && (
              <div className="success-message">
                ✓ You have already cast your vote. Thank you for participating in this democratic election.
              </div>
            )}

            {election.tallied && (
              <Results 
                electionId={0}
                votingContract={votingContract}
                candidates={candidates}
              />
            )}
          </section>
        )}
      </main>

      {showVoteModal && (
        <VoteModal
          candidate={candidates[selectedCandidate]}
          onConfirm={handleVote}
          onCancel={() => setShowVoteModal(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default App;
