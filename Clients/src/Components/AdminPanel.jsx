import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function AdminPanel({ votingContract, sbtContract, election, signer, onError, onSuccess }) {
  const [voterAddress, setVoterAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('voters');
  const [voters, setVoters] = useState([]);
  const [stats, setStats] = useState({});
  const [mintMode, setMintMode] = useState('backend'); // 'backend' or 'blockchain'

  const [candidateName, setCandidateName] = useState('');
  const [candidateParty, setCandidateParty] = useState('');
  const [candidateImage, setCandidateImage] = useState('');

  useEffect(() => {
    loadVoters();
    loadStats();
  }, []);

  const loadVoters = async () => {
    try {
      const data = await api.getVoters();
      setVoters(data);
    } catch (err) {
      console.log("Could not load voters");
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.log("Could not load stats");
    }
  };

  const mintTokenBackend = async () => {
    if (!voterAddress) {
      onError("Please enter a voter wallet address");
      return;
    }

    if (!voterAddress.startsWith('0x') || voterAddress.length !== 42) {
      onError("Invalid Ethereum address format");
      return;
    }

    try {
      setIsLoading(true);
      await api.mintSBT(voterAddress);
      onSuccess(`✅ SBT minted to ${voterAddress.slice(0, 10)}...${voterAddress.slice(-4)}`);
      setVoterAddress('');
      loadVoters();
      loadStats();
    } catch (err) {
      console.error("Mint error:", err);
      onError(err.message || "Failed to mint SBT");
    } finally {
      setIsLoading(false);
    }
  };

  const mintTokenBlockchain = async () => {
    if (!voterAddress) {
      onError("Please enter a voter address");
      return;
    }

    if (!sbtContract) {
      onError("Blockchain contract not connected. Make sure you're on the right network.");
      return;
    }

    try {
      setIsLoading(true);
      const tx = await sbtContract.mint(voterAddress, "ipfs://QmDemocraticChainToken");
      await tx.wait();
      onSuccess(`✅ SBT minted on blockchain to ${voterAddress.slice(0, 10)}...${voterAddress.slice(-4)}`);
      setVoterAddress('');
    } catch (err) {
      console.error("Mint error:", err);
      onError(err.message || "Failed to mint on blockchain. Make sure contracts are deployed.");
    } finally {
      setIsLoading(false);
    }
  };

  const mintToken = () => {
    if (mintMode === 'backend') {
      mintTokenBackend();
    } else {
      mintTokenBlockchain();
    }
  };

  const addCandidate = async () => {
    if (!candidateName || !candidateParty) {
      onError("Please fill in candidate name and party");
      return;
    }

    try {
      setIsLoading(true);
      const tx = await votingContract.addCandidates(
        0,
        [candidateName],
        [candidateParty],
        [candidateImage || "ipfs://placeholder"]
      );
      await tx.wait();
      onSuccess(`Successfully added candidate: ${candidateName}`);
      setCandidateName('');
      setCandidateParty('');
      setCandidateImage('');
    } catch (err) {
      console.error("Add candidate error:", err);
      onError(err.message || "Failed to add candidate. Make sure contracts are deployed.");
    } finally {
      setIsLoading(false);
    }
  };

  const endElection = async () => {
    try {
      setIsLoading(true);
      const tx = await votingContract.endElection(0);
      await tx.wait();
      onSuccess("Election ended successfully");
      loadStats();
    } catch (err) {
      console.error("End election error:", err);
      onError(err.message || "Failed to end election");
    } finally {
      setIsLoading(false);
    }
  };

  const tallyVotes = async () => {
    try {
      setIsLoading(true);
      const tx = await votingContract.tallyVotes(0);
      await tx.wait();
      onSuccess("Votes tallied successfully! Results are now available.");
      loadStats();
    } catch (err) {
      console.error("Tally error:", err);
      onError(err.message || "Failed to tally votes");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    onSuccess("Address copied!");
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--secondary)',
      borderRadius: '12px',
      padding: '1.5rem',
      margin: '1rem 2rem',
      maxWidth: 'calc(100% - 4rem)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--secondary)' }}>🔧 Admin Panel</h2>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          padding: '1rem',
          background: 'var(--surface-elevated)',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '100px'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {stats.totalVoters || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Voters</div>
        </div>
        <div style={{
          padding: '1rem',
          background: 'var(--surface-elevated)',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '100px'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {stats.sbtHolders || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SBT Holders</div>
        </div>
        <div style={{
          padding: '1rem',
          background: 'var(--surface-elevated)',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '100px'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
            {stats.totalVotes || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Votes</div>
        </div>
        <div style={{
          padding: '1rem',
          background: 'var(--surface-elevated)',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '100px'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
            {stats.activeElections || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['voters', 'parties', 'votes', 'election'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            style={{
              padding: '0.5rem 1rem',
              background: activeSection === section ? 'var(--secondary)' : 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: activeSection === section ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {section === 'voters' && '👥 '}
            {section === 'parties' && '🏛️ '}
            {section === 'votes' && '🗳️ '}
            {section === 'election' && '📊 '}
            {section}
          </button>
        ))}
      </div>

      {activeSection === 'voters' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>🎁 Mint Soulbound Token (SBT)</h3>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'var(--surface-elevated)',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setMintMode('backend')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: mintMode === 'backend' ? 'var(--primary)' : 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: mintMode === 'backend' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              🌐 Via Backend API (Easy)
            </button>
            <button
              onClick={() => setMintMode('blockchain')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: mintMode === 'blockchain' ? 'var(--primary)' : 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: mintMode === 'blockchain' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              ⛓️ Via Blockchain
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="0x..."
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            />
            <button
              onClick={mintToken}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? '⏳ Minting...' : '🎁 Mint SBT'}
            </button>
          </div>

          <div style={{ 
            padding: '1rem', 
            background: 'var(--surface-elevated)', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <strong>How to get a wallet address:</strong>
            </p>
            <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Ask the voter to open MetaMask</li>
              <li>Click on their account address to copy it</li>
              <li>Paste it here and click "Mint SBT"</li>
              <li>The voter can now vote!</li>
            </ol>
          </div>

          <h4 style={{ marginBottom: '0.5rem' }}>Registered Voters ({voters.length})</h4>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {voters.map((v) => (
              <div key={v.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'var(--surface-elevated)',
                borderRadius: '6px',
                marginBottom: '0.5rem'
              }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {v.walletAddress ? `${v.walletAddress.slice(0, 8)}...${v.walletAddress.slice(-6)}` : v.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {v.username}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    background: v.hasSBT ? 'rgba(63, 185, 80, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                    color: v.hasSBT ? 'var(--success)' : 'var(--error)',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    SBT: {v.hasSBT ? '✅' : '❌'}
                  </span>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    background: v.hasVoted ? 'rgba(63, 185, 80, 0.2)' : 'rgba(210, 153, 34, 0.2)',
                    color: v.hasVoted ? 'var(--success)' : 'var(--warning)',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    Voted: {v.hasVoted ? '✅' : '⏳'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'candidates' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>🗳️ Add Candidate</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Candidate Name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              style={{
                padding: '0.75rem',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <input
              type="text"
              placeholder="Party"
              value={candidateParty}
              onChange={(e) => setCandidateParty(e.target.value)}
              style={{
                padding: '0.75rem',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <input
              type="text"
              placeholder="Image Hash (optional)"
              value={candidateImage}
              onChange={(e) => setCandidateImage(e.target.value)}
              style={{
                padding: '0.75rem',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={addCandidate}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Adding...' : '➕ Add Candidate'}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'parties' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>🏛️ Party Voting Statistics</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: '#1E88E5', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.partyStats?.Kongress || 0}</div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Kongress Votes</div>
            </div>
            <div style={{ padding: '1.5rem', background: '#43A047', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.partyStats?.BBP || 0}</div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>BBP Votes</div>
            </div>
            <div style={{ padding: '1.5rem', background: '#FB8C00', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.partyStats?.AAM || 0}</div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>AAM Votes</div>
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: 'var(--surface-elevated)', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '1rem' }}>📊 Vote Distribution</h4>
            {['Kongress', 'BBP', 'AAM'].map((party, idx) => {
              const colors = ['#1E88E5', '#43A047', '#FB8C00'];
              const votes = stats.partyStats?.[party] || 0;
              const total = stats.totalVotes || 1;
              const percentage = ((votes / total) * 100).toFixed(1);
              return (
                <div key={party} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>{party}</span>
                    <span>{votes} votes ({percentage}%)</span>
                  </div>
                  <div style={{ height: '20px', background: 'var(--background)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      background: colors[idx],
                      borderRadius: '10px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'votes' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>🗳️ Vote Records (Excel Export)</h3>
          <button
            onClick={async () => {
              try {
                const data = await api.exportVotes();
                const csv = [
                  ['Timestamp', 'Election', 'Voter Username', 'Wallet Address', 'Email', 'Party Voted', 'Party ID'],
                  ...data.map(v => [v.Timestamp, v.Election, v['Voter Username'], v['Wallet Address'], v.Email, v['Party Voted'], v['Party ID']])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'votes_export.csv';
                a.click();
                onSuccess('Votes exported to CSV!');
              } catch (err) {
                onError('Failed to export votes');
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            📥 Export to CSV / Excel
          </button>
          
          <div style={{ 
            padding: '1rem', 
            background: 'var(--surface-elevated)', 
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem'
          }}>
            <strong>Note:</strong> Click "Export to CSV / Excel" to download all voting records in a spreadsheet format that can be opened in Excel.
          </div>
          
          <div style={{ 
            padding: '1rem', 
            background: 'var(--background)', 
            borderRadius: '8px',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Voter</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Wallet</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Party</th>
                </tr>
              </thead>
              <tbody id="votesTable">
                <tr>
                  <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading votes... (Click export to see all)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'election' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>📊 Election Management</h3>
          {election && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-elevated)', borderRadius: '8px' }}>
              <p><strong>Election:</strong> {election.name}</p>
              <p><strong>Status:</strong> {election.active ? '🟢 Active' : '🔴 Ended'}</p>
              <p><strong>Candidates:</strong> {election.candidateCount}</p>
              <p><strong>Votes Cast:</strong> {election.totalVotes}</p>
              <p><strong>Results Tallied:</strong> {election.tallied ? '✅ Yes' : '❌ No'}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {election?.active && (
              <button
                onClick={endElection}
                disabled={isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--error)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                🛑 End Election
              </button>
            )}
            {!election?.tallied && election && !election.active && (
              <button
                onClick={tallyVotes}
                disabled={isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? '⏳ Tallying...' : '📊 Tally Votes'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;