 import React, { useState , useEffect} from 'react';
function Results({ electionID ,votingcontract, Candidates}){
const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [electionId, votingContract]);

  const fetchResults = async () => {
    if (!votingContract) return;

    try {
      setIsLoading(true);
      const voteResults = await votingContract.getResults(electionId);
      setResults(voteResults.map(v => Number(v)));
      setTotalVotes(voteResults.reduce((a, b) => a + Number(b), 0));
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setIsLoading(false);
    }
  };
const getPercentage =(votes) => {
    if (totalVotes === 0) return 0;
    return ((votes / totalVotes) * 100).toFixed(1);
  };

  const getWinner = () => {
    if (results.length === 0) return null;
    let maxVotes = -1;
    let winnerIndex = -1;
    results.forEach((votes, index) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winnerIndex = index;
      }
    });
    return { index: winnerIndex, votes: maxVotes };
  };

  const winner = getWinner();

  if (isLoading) {
    return (
      <div className="results-section">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  } 
return (
    <div className="results-section">
      <h3>📊 Election Results</h3>
      
      {winner && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            Winner
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#000' }}>
            {candidates[winner.index]?.name}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000', opacity: 0.8 }}>
            {winner.votes} votes ({getPercentage(winner.votes)}%)
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Total votes: {totalVotes}
      </div>

      {results.map((votes, index) => (
        <div key={index} className="result-bar">
          <div className="result-label"> 
            <span>{candidates[index]?.name}</span>
            <span>{votes} votes ({getPercentage(votes)}%)</span>
          </div>
          <div className="result-progress">
            <div 
              className="result-fill" 
              style={{ width: `${getPercentage(votes)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Results;

