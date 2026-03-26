import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnect from './components/WalletConnect';
import ElectionCard from './components/ElectionCard';
import VoteModal from './components/VoteModal';
import Results from './components/Results';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/UserDashboard';
import LandingPage from './components/LandingPage';
import VoterView from './components/VoterView';
import api from './utils/api';

const SOULBOUND_TOKEN_ABI = [
  "function isEligible(address account) external view returns (bool)",
  "function mint(address to, string memory tokenURI) external returns (uint256)",
  "function hasMinted(address account) external view returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)"
];

const VOTING_ABI = [
  "function getElectionDetails(uint256 electionId) external view returns (string memory, uint256, uint256, uint256, bool, bool, uint256)",
  "function getCandidates(uint256 electionId) external view returns (tuple(string name, string party, string imageHash)[])",
  "function castVoteSimple(uint256 electionId, bytes32 encryptedVote, bytes32 nullifierHash) external",
  "function hasVotedInElection(uint256 electionId, address voter) external view returns (bool)",
  "function getResults(uint256 electionId) external view returns (uint256[])",
  "function registerVoter(uint256 electionId, address voter) external",
  "function endElection(uint256 electionId) external",
  "function tallyVotes(uint256 electionId) external",
  "function owner() external view returns (address)",
  "event VoteCast(uint256 indexed electionId, address indexed voter, bytes32 commitment)",
  "event ElectionEnded(uint256 indexed electionId)",
  "event ResultsTallied(uint256 indexed electionId, uint256[] results)"
];

const DEPLOYMENTS = {
  localhost: {
    SoulBoundToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    Voting: "0xe7f1725E7734CE288F8367e1Bb1E3e0d3C6f0b35"
  },
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
  const [hasSBT, setHasSBT] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [network, setNetwork] = useState('localhost');
  const [contractOwner, setContractOwner] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [backendElections, setBackendElections] = useState([]);
  const [showAuthMode, setShowAuthMode] = useState(null); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('vote');

  useEffect(() => {
    checkAuth();
    initContracts();
  }, [account, network]);

  const checkAuth = async () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && api.isAuthenticated()) {
      try {
        const userData = await api.getMe();
        setUser(userData);
        setIsAuthenticated(true);
        fetchBackendElections();
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  };

  const fetchBackendElections = async () => {
    try {
      const elections = await api.getElections();
      setBackendElections(elections);
    } catch (err) {
      console.log("Backend not running, using blockchain only");
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthMode(null);
    fetchBackendElections();
  };

  const handleShowAuth = (mode) => {
    setShowAuthMode(mode);
  };

  const handleBackToLanding = () => {
    setShowAuthMode(null);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const initContracts = async () => {
    if (!window.ethereum) {
      setError("MetaMask not installed");
      setIsLoading(false);
      return;
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);

      const networkInfo = await ethersProvider.getNetwork();
      const networkName = networkInfo.chainId === 11155111n ? 'sepolia' : 
                         networkInfo.chainId === 31337n ? 'localhost' : 'localhost';
      setNetwork(networkName);

      const votingAddress = DEPLOYMENTS[networkName]?.Voting;
      const sbtAddress = DEPLOYMENTS[networkName]?.SoulBoundToken;

      if (votingAddress) {
        const voting = new ethers.Contract(votingAddress, VOTING_ABI, ethersProvider);
        setVotingContract(voting);

        try {
          const owner = await voting.owner();
          setContractOwner(owner);
        } catch (e) {
          console.log("Could not get owner:", e);
        }

        try {
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
        } catch (e) {
          console.log("No election found or error:", e);
        }
      }

      if (sbtAddress) {
        const sbt = new ethers.Contract(sbtAddress, SOULBOUND_TOKEN_ABI, ethersProvider);
        setSbtContract(sbt);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Contract init error:", err);
      setError("Failed to initialize. Make sure you're connected to the right network.");
      setIsLoading(false);
    }
  };

  const checkVoterStatus = async (account) => {
    if (!account) return;
    
    try {
      if (sbtContract) {
        const eligible = await sbtContract.isEligible(account);
        setHasSBT(eligible);
      }

      if (votingContract) {
        const voted = await votingContract.hasVotedInElection(0, account);
        setHasVoted(voted);
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const handleConnect = async (account, signer) => {
    setAccount(account);
    setSigner(signer);
    
    if (votingContract && signer) {
      const votingWithSigner = votingContract.connect(signer);
      setVotingContract(votingWithSigner);
    }

    if (sbtContract && signer) {
      const sbtWithSigner = sbtContract.connect(signer);
      setSbtContract(sbtWithSigner);
    }
    
    await checkVoterStatus(account);
  };

  const handleSelectCandidate = (candidateId) => {
    if (!hasSBT) {
      setError("You need a Soulbound Token to vote. Please contact the admin.");
      return;
    }
    if (!election?.active) {
      setError("This election has ended.");
      return;
    }
    if (hasVoted) {
      setError("You have already cast your vote.");
      return;
    }
    setSelectedCandidate(candidateId);
  };

  const handleVote = async () => {
    if (!selectedCandidate || !account) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const nullifier = ethers.randomBytes(32);
      const nullifierHash = ethers.keccak256(nullifier);
      
      const voteData = ethers.solidityPacked(["uint256", "uint256"], [selectedCandidate, 0]);
      const encryptedVote = ethers.keccak256(ethers.solidityPacked(["bytes", "bytes32"], [voteData, nullifier]));
      
      const tx = await votingContract.castVoteSimple(0, encryptedVote, nullifierHash);
      await tx.wait();
      
      setHasVoted(true);
      setShowVoteModal(false);
      setSelectedCandidate(null);
      setSuccess("Vote cast successfully! Your vote has been recorded anonymously.");
    } catch (err) {
      console.error("Vote error:", err);
      setError(err.message || "Failed to cast vote. Make sure you have a Soulbound Token.");
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

  const isAdmin = user?.role === 'admin' || (account && contractOwner && account.toLowerCase() === contractOwner.toLowerCase());

  if (!isAuthenticated) {
    if (showAuthMode) {
      return (
        <>
          <button 
            onClick={handleBackToLanding}
            style={{
              position: 'fixed',
              top: '1rem',
              left: '1rem',
              padding: '0.5rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              zIndex: 1000
            }}
          >
            ← Back
          </button>
          <AuthPage onLogin={handleLogin} initialMode={showAuthMode} />
        </>
      );
    }
    return <LandingPage onLogin={() => handleShowAuth('login')} onRegister={() => handleShowAuth('register')} />;
  }

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
          <div className="logo-icon">🗳️</div>
          <span>DemocraticChain</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="wallet-btn"
            onClick={() => setShowAdminLogin(true)}
            style={{ borderColor: 'var(--secondary)', background: 'var(--surface-elevated)' }}
          >
            <span>🔐 Admin</span>
          </button>
          <WalletConnect onConnect={handleConnect} onDisconnect={() => {
            setAccount(null);
            setSigner(null);
            setHasVoted(false);
            setHasSBT(false);
          }} />
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem', 
                background: 'var(--surface-elevated)', 
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <span>👤 {user?.username}</span>
                {account && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(account);
                      setSuccess('Wallet address copied!');
                    }}
                    style={{
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                    title="Copy wallet address"
                  >
                    📋
                  </button>
                )}
              </div>
              <button 
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid var(--error)',
                  borderRadius: '8px',
                  color: 'var(--error)',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {showAdminPanel && isAdminLoggedIn && (
        <AdminPanel 
          votingContract={votingContract}
          sbtContract={sbtContract}
          election={election}
          signer={signer}
          onError={setError}
          onSuccess={setSuccess}
        />
      )}

      <main className="main">
        <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className={`tab ${activeTab === 'vote' ? 'active' : ''}`}
            onClick={() => setActiveTab('vote')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'vote' ? 'var(--primary)' : 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: activeTab === 'vote' ? '#000' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🗳️ Elections
          </button>
          <button 
            className={`tab ${activeTab === 'vote' ? 'active' : ''}`}
            onClick={() => setActiveTab('vote')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'vote' ? 'var(--primary)' : 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: activeTab === 'vote' ? '#000' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🔗 Blockchain
          </button>
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: activeTab === 'dashboard' ? '#000' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            👤 Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'info' ? 'var(--primary)' : 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: activeTab === 'info' ? '#000' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ℹ️ Info
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            <strong>❌ Error:</strong> {error}
            <button 
              onClick={() => setError(null)}
              style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="success-message" style={{ marginBottom: '1rem' }}>
            <strong>✅ {success}</strong>
            <button 
              onClick={() => setSuccess(null)}
              style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === 'vote' && (
          <VoterView 
            user={user} 
            account={account} 
            walletConnected={!!account}
            onVoteSuccess={() => {
              setSuccess("Vote cast successfully!");
              setHasVoted(true);
            }}
          />
        )}

        {activeTab === 'blockchain' && (
          <div className="voting-section">
            {!account ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
                <h2 style={{ marginBottom: '1rem' }}>Connect Your Wallet</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  Connect your MetaMask wallet to check eligibility and cast your vote.
                </p>
              </div>
            ) : !hasSBT ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: '16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>❌ No Soulbound Token (SBT)</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  You need a Soulbound Token (SBT) to vote. Ask the admin to mint one to your wallet.
                </p>
                
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'var(--surface-elevated)', 
                  borderRadius: '12px',
                  marginTop: '1rem',
                  textAlign: 'left'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>📋 How to Get SBT:</h3>
                  <ol style={{ color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: '1.5rem' }}>
                    <li>Copy your wallet address below</li>
                    <li>Send this address to the election admin</li>
                    <li>Admin will mint an SBT to your wallet</li>
                    <li>Refresh this page - you'll see candidates!</li>
                  </ol>
                  
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      👇 COPY YOUR WALLET ADDRESS:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <code style={{ 
                        flex: 1, 
                        padding: '0.75rem', 
                        background: 'var(--surface)', 
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        wordBreak: 'break-all',
                        color: 'var(--primary)'
                      }}>
                        {account}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(account);
                          alert('Address copied! Send it to the admin.');
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'var(--primary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        title="Copy address"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(108, 92, 231, 0.1)', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--secondary)' }}>
                      💡 <strong>You are the admin</strong> but this account doesn't have SBT (it's the owner account).
                      <br />To test voting, use a DIFFERENT wallet account.
                      <br />Or go to <strong>Admin Panel → Voters</strong> to mint SBT to other wallets.
                    </p>
                  </div>
                )}
              </div>
            ) : election ? (
              <div>
                <div className="voter-status" style={{
                  padding: '1rem',
                  background: hasVoted ? 'rgba(63, 185, 80, 0.1)' : 'rgba(0, 212, 170, 0.1)',
                  border: `1px solid ${hasVoted ? 'var(--success)' : 'var(--primary)'}`,
                  borderRadius: '8px',
                  marginBottom: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{hasVoted ? '✅ You have voted' : '✅ Eligible to vote'}</strong>
                    <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {election.totalVotes} total votes cast
                  </div>
                </div>

                <section className="election-section">
                  <div className="section-header">
                    <div>
                      <h2>{election.name}</h2>
                      <span className={`status-badge ${election.active ? 'active' : 'ended'}`}>
                        {election.active ? '🟢 Active' : '🔴 Ended'}
                      </span>
                    </div>
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
                      ✅ You have already cast your vote. Thank you for participating in this democratic election.
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
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h2>No Active Election</h2>
                <p style={{ color: 'var(--text-secondary)' }}>There is no election currently available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard user={user} elections={backendElections} />
        )}

        {activeTab === 'info' && (
          <div className="info-section">
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

            <div style={{ 
              marginTop: '2rem', 
              padding: '2rem', 
              background: 'var(--surface)', 
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>How to Vote</h3>
              <ol style={{ color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: '1.5rem' }}>
                <li>Connect your MetaMask wallet</li>
                <li>Verify you have a Soulbound Token (required for voting)</li>
                <li>Select your preferred candidate</li>
                <li>Confirm your vote in the popup</li>
                <li>Wait for transaction confirmation</li>
              </ol>
            </div>
          </div>
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

      {showAdminLogin && (
        <AdminLogin 
          onLogin={(success) => {
            if (success) {
              setIsAdminLoggedIn(true);
              setShowAdminLogin(false);
              setShowAdminPanel(true);
            }
          }}
          onCancel={() => setShowAdminLogin(false)}
        />
      )}

      {isAdminLoggedIn && (
        <button
          onClick={() => {
            setIsAdminLoggedIn(false);
            setShowAdminPanel(false);
          }}
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            padding: '0.5rem 1rem',
            background: 'var(--secondary)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          🚪 Logout Admin
        </button>
      )}
    </div>
  );
}

export default App;
