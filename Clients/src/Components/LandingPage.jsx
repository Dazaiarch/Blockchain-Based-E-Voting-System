import React from 'react';

function LandingPage({ onLogin, onRegister }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem'
          }}>
            🗳️
          </div>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 700, 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DemocraticChain
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Secure, anonymous, and verifiable blockchain voting system. 
            Your vote is encrypted and your identity is protected.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '4rem'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Ballot Secrecy</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your vote is encrypted using homomorphic encryption. 
              Only the final tally is revealed.
            </p>
          </div>
          
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>One Person, One Vote</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Soulbound Tokens ensure only verified voters can participate.
              Each wallet gets exactly one vote.
            </p>
          </div>
          
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Coercion Resistant</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Zero-knowledge proofs make it impossible to prove 
              how you voted to anyone.
            </p>
          </div>
          
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Publicly Auditable</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              All votes are recorded on-chain. Anyone can verify 
              the integrity without revealing your choice.
            </p>
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Ready to Vote?</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Connect with MetaMask and verify your eligibility to cast your vote.
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={onLogin}
                style={{
                  padding: '1rem 2rem',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔐 Login
              </button>
              
              <button
                onClick={onRegister}
                style={{
                  padding: '1rem 2rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📝 Register
              </button>
            </div>
          </div>
          
          <div style={{
            padding: '1rem',
            background: 'var(--surface-elevated)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>Don't have a Soulbound Token?</strong>
            <p style={{ marginTop: '0.5rem' }}>
              Contact the election administrator to get your voting rights.
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '3rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem'
        }}>
          <p>Powered by Ethereum Blockchain • Smart Contracts • Zero-Knowledge Proofs</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;