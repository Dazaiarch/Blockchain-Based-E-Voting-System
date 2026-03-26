import React from 'react';

function UserDashboard({ user, elections }) {
  const userElections = elections.filter(e => e.voters?.includes(user?.id));
  
  return (
    <div style={{
      padding: '2rem',
      background: 'var(--surface)',
      borderRadius: '16px',
      border: '1px solid var(--border)'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>👤 My Dashboard</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'var(--surface-elevated)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {user?.hasSBT ? '✅' : '❌'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Soulbound Token
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: user?.hasSBT ? 'var(--success)' : 'var(--error)'
          }}>
            {user?.hasSBT ? 'Active' : 'Not Available'}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: 'var(--surface-elevated)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {user?.hasVoted ? '🗳️' : '⏳'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Vote Status
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: user?.hasVoted ? 'var(--success)' : 'var(--warning)'
          }}>
            {user?.hasVoted ? 'Voted' : 'Not Voted'}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: 'var(--surface-elevated)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Elections
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: 'var(--primary)'
          }}>
            {elections.length} Available
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Account Details</h3>
        <div style={{ 
          padding: '1rem', 
          background: 'var(--surface-elevated)', 
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Username:</strong> {user?.username}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Role:</strong> <span style={{ color: 'var(--primary)' }}>{user?.role}</span>
          </p>
          {user?.walletAddress && (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Wallet:</strong> <code>{user.walletAddress.slice(0, 10)}...</code>
            </p>
          )}
          <p>
            <strong>Email:</strong> {user?.email || 'Not provided'}
          </p>
        </div>
      </div>
      
      <div>
        <h3 style={{ marginBottom: '1rem' }}>How to Get SBT (Voting Rights)</h3>
        <div style={{
          padding: '1rem',
          background: 'var(--surface-elevated)',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <li>Contact the election administrator</li>
            <li>Provide your wallet address</li>
            <li>Admin will mint a Soulbound Token to your wallet</li>
            <li>Once you have SBT, you can vote in elections</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;