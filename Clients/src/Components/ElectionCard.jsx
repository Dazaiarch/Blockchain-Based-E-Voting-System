import React from 'react';
function ElectionCard({ election, candidates, selectedCandidate, hasVoted, onSelect }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div className="election-card">
    <div className="election-header">
    <div>
    <div className="election-title">{election.name}</div>
    <div className="election-meta">
    <span>🗳️ {election.totalVotes} votes cast</span>
    <span>📅 Ends: {formatDate(election.endTime)}</span>
    </div>
    </div>
     </div>

      <div className="candidates-grid">
      {candidates.map((candidate, index) => (
      <div
            key={candidate.id}
            className={`candidate-card ${selectedCandidate === index ? 'selected' : ''}`}
            onClick={() => onSelect(index)}
            style={{ 
              opacity: hasVoted || !election.active ? 0.7 : 1,
              cursor: hasVoted || !election.active ? 'not-allowed' : 'pointer'
            }}
          >
      <div className="candidate-avatar">
        {candidate.name.charAt(0)}
       </div>
         <div className="candidate-name">{candidate.name}</div>
         <div className="candidate-party">{candidate.party}</div>
         </div>
        ))}
      </div>
    </div>
  );
}

export default ElectionCard;

