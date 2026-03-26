const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'democraticchain-secret-key-2026';
const PORT = 3001;

let users = [];
let elections = [];
let votes = [];
let sbtHolders = [];

// Predefined parties for voting
const PARTIES = [
  { id: 1, name: 'Kongress', symbol: 'K', color: '#1E88E5', description: 'National Congress Party' },
  { id: 2, name: 'BBP', symbol: 'B', color: '#43A047', description: 'Bharatiya Bijali Party' },
  { id: 3, name: 'AAM', symbol: 'A', color: '#FB8C00', description: 'Aam Aadmi Manchu' }
];

// Initialize with sample election
const initElection = () => {
  elections = [
    {
      id: '1',
      name: 'Presidential Election 2026',
      description: 'Choose your next leader',
      startTime: Date.now(),
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
      parties: PARTIES,
      votes: { 1: 0, 2: 0, 3: 0 },
      totalVotes: 0,
      active: true,
      tallied: false,
      voters: []
    }
  ];
};

initElection();

const ADMIN_USER = {
  id: 'admin',
  username: 'admin',
  password: bcrypt.hashSync('democratic2026', 10),
  role: 'admin',
  walletAddress: null
};

users.push(ADMIN_USER);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// Save votes to file for Excel export
function saveVotesToFile() {
  const voteData = votes.map(v => ({
    timestamp: new Date(v.timestamp).toISOString(),
    electionName: v.electionName,
    voterUsername: v.voterUsername,
    voterWallet: v.voterWallet,
    partyVoted: v.partyName,
    partyId: v.partyId
  }));
  
  fs.writeFileSync(
    './votes_record.json',
    JSON.stringify(voteData, null, 2)
  );
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, walletAddress, email } = req.body;
    
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      walletAddress,
      email,
      role: 'voter',
      hasSBT: false,
      hasVoted: false,
      createdAt: new Date()
    };
    
    users.push(user);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        walletAddress: user.walletAddress,
        hasSBT: user.hasSBT,
        hasVoted: user.hasVoted,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    walletAddress: user.walletAddress,
    hasSBT: user.hasSBT,
    hasVoted: user.hasVoted,
    email: user.email
  });
});

app.get('/api/parties', (req, res) => {
  res.json(PARTIES);
});

app.get('/api/elections', (req, res) => {
  const electionList = elections.map(e => ({
    id: e.id,
    name: e.name,
    description: e.description,
    startTime: e.startTime,
    endTime: e.endTime,
    partyCount: e.parties.length,
    totalVotes: e.totalVotes,
    active: e.active,
    tallied: e.tallied
  }));
  res.json(electionList);
});

app.get('/api/elections/:id', (req, res) => {
  const election = elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  
  res.json(election);
});

app.get('/api/elections/:id/parties', (req, res) => {
  const election = elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  
  res.json(election.parties);
});

app.get('/api/elections/:id/results', (req, res) => {
  const election = elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  
  const results = election.parties.map(p => ({
    partyId: p.id,
    partyName: p.name,
    votes: election.votes[p.id] || 0,
    percentage: election.totalVotes > 0 ? ((election.votes[p.id] || 0) / election.totalVotes * 100).toFixed(1) : 0
  }));
  
  res.json({
    electionId: election.id,
    electionName: election.name,
    totalVotes: election.totalVotes,
    results
  });
});

app.post('/api/elections/:id/vote', authenticateToken, (req, res) => {
  const election = elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  
  if (!election.active) return res.status(400).json({ error: 'Election has ended' });
  
  const user = users.find(u => u.id === req.user.id);
  if (!user.hasSBT) return res.status(400).json({ error: 'No Soulbound Token - contact admin' });
  if (user.hasVoted) return res.status(400).json({ error: 'You have already voted' });
  
  const { partyId } = req.body;
  const party = election.parties.find(p => p.id === partyId);
  if (!party) return res.status(400).json({ error: 'Invalid party' });
  
  // Increment vote for party
  election.votes[partyId] = (election.votes[partyId] || 0) + 1;
  election.totalVotes++;
  user.hasVoted = true;
  
  // Record vote with full details
  const voteRecord = {
    id: uuidv4(),
    electionId: election.id,
    electionName: election.name,
    userId: user.id,
    voterUsername: user.username,
    voterWallet: user.walletAddress,
    voterEmail: user.email,
    partyId: party.id,
    partyName: party.name,
    timestamp: Date.now()
  };
  
  votes.push(voteRecord);
  saveVotesToFile();
  
  res.json({ 
    message: 'Vote cast successfully!', 
    party: party.name,
    voterDetails: {
      username: user.username,
      wallet: user.walletAddress,
      partyVoted: party.name
    }
  });
});

app.get('/api/user/votes', authenticateToken, (req, res) => {
  const userVotes = votes.filter(v => v.userId === req.user.id);
  res.json(userVotes);
});

app.get('/api/votes/export', authenticateAdmin, (req, res) => {
  const allVotes = votes.map(v => ({
    'Timestamp': new Date(v.timestamp).toLocaleString(),
    'Election': v.electionName,
    'Voter Username': v.voterUsername,
    'Wallet Address': v.voterWallet || 'N/A',
    'Email': v.voterEmail || 'N/A',
    'Party Voted': v.partyName,
    'Party ID': v.partyId
  }));
  
  res.json(allVotes);
});

app.post('/api/admin/mint-sbt', authenticateAdmin, (req, res) => {
  const { walletAddress, username } = req.body;
  
  if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });
  
  let user = users.find(u => u.walletAddress === walletAddress);
  
  if (!user) {
    user = {
      id: uuidv4(),
      username: username || `voter_${walletAddress.slice(2, 8)}`,
      password: bcrypt.hashSync(uuidv4(), 10),
      walletAddress,
      email: null,
      role: 'voter',
      hasSBT: true,
      hasVoted: false,
      createdAt: new Date()
    };
    users.push(user);
  } else {
    user.hasSBT = true;
  }
  
  if (!sbtHolders.find(s => s.walletAddress === walletAddress)) {
    sbtHolders.push({ walletAddress, userId: user.id, mintedAt: Date.now() });
  }
  
  res.json({ 
    message: 'Soulbound Token minted successfully', 
    walletAddress,
    voterName: user.username
  });
});

app.post('/api/admin/end-election/:id', authenticateAdmin, (req, res) => {
  const election = elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  
  election.active = false;
  res.json({ message: 'Election ended successfully' });
});

app.post('/api/admin/tally-votes/:id', authenticateAdmin, (req, res) => {
  const election = elections.find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  if (election.tallied) return res.status(400).json({ error: 'Already tallied' });
  
  election.tallied = true;
  res.json({ message: 'Votes tallied successfully', results: election.parties.map(p => ({ party: p.name, votes: election.votes[p.id] || 0 })) });
});

app.get('/api/admin/voters', authenticateAdmin, (req, res) => {
  const voters = users.filter(u => u.role === 'voter').map(u => ({
    id: u.id,
    username: u.username,
    walletAddress: u.walletAddress,
    email: u.email,
    hasSBT: u.hasSBT,
    hasVoted: u.hasVoted
  }));
  res.json(voters);
});

app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const stats = {
    totalUsers: users.length,
    totalVoters: users.filter(u => u.role === 'voter').length,
    sbtHolders: sbtHolders.length,
    totalVotes: votes.length,
    activeElections: elections.filter(e => e.active).length,
    completedElections: elections.filter(e => !e.active).length,
    partyStats: elections[0] ? {
      Kongress: elections[0].votes[1] || 0,
      BBP: elections[0].votes[2] || 0,
      AAM: elections[0].votes[3] || 0
    } : {}
  };
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`DemocraticChain API running on http://localhost:${PORT}`);
  console.log(`Parties: ${PARTIES.map(p => p.name).join(', ')}`);
});
