import React from 'react';

function VoteModal({ candidate, onConfirm, onCancel, isLoading }) {
  if (!candidate) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Confirm Your Vote</h3>
        <p>
          You are about to cast a <strong>secret ballot</strong> for <strong>{candidate.name}</strong> 
          from <strong>{candidate.party}</strong>.
        </p>
        
        <div style={{ 
          background: 'var(--surface-elevated)', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Your vote will be:
          </p>
          <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
            <li>🔒 <strong>Encrypted</strong> - No one can see your choice</li>
            <li>✓ <strong>Verified</strong> - ZK proof ensures validity</li>
            <li>🔗 <strong>Recorded</strong> - On blockchain permanently</li>
            <li>🗳️ <strong>Anonymous</strong> - Cannot be traced to you</li>
          </ul>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm Vote'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoteModal;
