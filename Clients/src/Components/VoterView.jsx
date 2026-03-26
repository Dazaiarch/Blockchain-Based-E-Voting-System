import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function VoterView({ user, account, walletConnected, onVoteSuccess }) {
  const [elections, setElections] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [myVotes, setMyVotes] = useState([]);
  const [voteResult, setVoteResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [electionData, partiesData, votesData] = await Promise.all([
        api.getElections(),
        api.getParties(),
        api.getMyVotes()
      ]);
      setElections(electionData);
      setParties(partiesData);
      setMyVotes(votesData);
      setHasVoted(votesData.length > 0);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedParty) return;
    
    try {
      const result = await api.castVote('1', selectedParty);
      setHasVoted(true);
      setShowVoteModal(false);
      setSelectedParty(null);
      setVoteResult(result);
      loadData();
      onVoteSuccess && onVoteSuccess();
    } catch (err) {
      setError(err.message || "Failed to cast vote");
    }
  };

  const selectedPartyData = parties.find(p => p.id === selectedParty);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>
          Loading elections...
        </p>
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
        <h2 style={{ marginBottom: '1rem' }}>Connect Your Wallet</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Please connect your MetaMask wallet to vote. You need a Soulbound Token to participate.
        </p>
      </div>
    );
  }

  if (!user?.hasSBT) {
    const copyAddress = () => {
      if (account) {
        navigator.clipboard.writeText(account);
        alert('Wallet address copied! Send it to the admin to get your SBT.');
      }
    };

    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--warning)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>Soulbound Token Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You need a Soulbound Token (SBT) to vote in this election. 
          <br />Copy your wallet address and send it to the admin.
        </p>
        
        <div style={{ 
          padding: '1.5rem', 
          background: 'var(--surface-elevated)', 
          borderRadius: '12px',
          maxWidth: '400px',
          margin: '0 auto 1.5rem'
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            👇 Your Wallet Address (click to copy):
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <code style={{ 
              flex: 1, 
              padding: '0.75rem', 
              background: 'var(--background)', 
              borderRadius: '6px',
              fontSize: '0.8rem',
              wordBreak: 'break-all',
              color: 'var(--primary)',
              fontFamily: 'monospace'
            }}>
              {account}
            </code>
            <button 
              onClick={copyAddress}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              title="Copy address"
            >
              📋
            </button>
          </div>
        </div>

        <div style={{ 
          padding: '1rem', 
          background: 'rgba(108, 92, 231, 0.1)', 
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
            📝 <strong>What to do:</strong>
          </p>
          <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'left', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>Click the 📋 button to copy your address</li>
            <li>Send the address to the admin</li>
            <li>Admin will mint an SBT to your wallet</li>
            <li>Refresh this page - you can now vote!</li>
          </ol>
        </div>
      </div>
    );
  }

  if (hasVoted && voteResult) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--success)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Vote Cast Successfully!</h2>
        
        <div style={{ 
          padding: '2rem', 
          background: 'var(--surface-elevated)', 
          borderRadius: '12px',
          maxWidth: '500px',
          margin: '0 auto 2rem',
          textAlign: 'left'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>📋 Your Vote Receipt</h3>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Voted For</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: voteResult.party === 'Kongress' ? '#1E88E5' : voteResult.party === 'BBP' ? '#43A047' : '#FB8C00' }}>
              🎯 {voteResult.party}
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Voter</p>
              <p style={{ fontSize: '0.875rem' }}>{voteResult.voterDetails?.username}</p>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Wallet</p>
              <p style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{voteResult.voterDetails?.wallet?.slice(0, 8)}...</p>
            </div>
          </div>
          
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
            Your vote has been recorded. Thank you for participating in this democratic election!
          </p>
        </div>
        
        <button 
          onClick={() => setVoteResult(null)}
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{
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
          {account && <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>}
        </div>
        {hasVoted && (
          <div style={{ fontSize: '0.875rem', color: 'var(--success)' }}>
            Vote recorded!
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>🏆 Presidential Election 2026</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Cast your vote for your preferred party. Your vote is secure and anonymous.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {parties.map((party) => (
            <div
              key={party.id}
              onClick={() => !hasVoted && setSelectedParty(party.id)}
              style={{
                background: 'var(--surface)',
                border: `3px solid ${selectedParty === party.id ? party.color : 'var(--border)'}`,
                borderRadius: '16px',
                padding: '2rem',
                cursor: hasVoted ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                transform: selectedParty === party.id ? 'scale(1.02)' : 'none',
                boxShadow: selectedParty === party.id ? `0 0 20px ${party.color}40` : 'none'
              }}
            >
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: party.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#fff',
                margin: '0 auto 1rem'
              }}>
                {party.symbol}
              </div>
              
              <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', color: party.color }}>
                {party.name}
              </h3>
              
              <p style={{ 
                textAlign: 'center', 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                marginBottom: '1rem'
              }}>
                {party.description}
              </p>
              
              {selectedParty === party.id && !hasVoted && (
                <div style={{ 
                  textAlign: 'center',
                  padding: '0.5rem',
                  background: party.color,
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  ✓ Selected
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedParty && !hasVoted && (
        <button 
          className="vote-btn"
          onClick={() => setShowVoteModal(true)}
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'block',
            margin: '0 auto'
          }}
        >
          🗳️ Vote for {parties.find(p => p.id === selectedParty)?.name}
        </button>
      )}

      {hasVoted && (
        <div className="success-message" style={{ textAlign: 'center' }}>
          ✅ You have already cast your vote. Thank you for participating in this democratic election!
        </div>
      )}

      {showVoteModal && selectedPartyData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '450px',
            width: '90%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: selectedPartyData.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#fff',
                margin: '0 auto 1rem'
              }}>
                {selectedPartyData.symbol}
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>Confirm Your Vote</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You are about to vote for <strong style={{ color: selectedPartyData.color }}>{selectedPartyData.name}</strong>
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              background: 'var(--surface-elevated)', 
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Your vote will be:
              </p>
              <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
                <li>🔒 <strong>Encrypted</strong> - No one can see your choice</li>
                <li>✓ <strong>Recorded</strong> - On blockchain permanently</li>
                <li>🗳️ <strong>Anonymous</strong> - Cannot be traced to you</li>
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowVoteModal(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: selectedPartyData.color,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoterView;