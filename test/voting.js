const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SoulBoundToken", function () {
  let soulBoundToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const SoulBoundToken = await ethers.getContractFactory("SoulBoundToken");
    soulBoundToken = await SoulBoundToken.deploy("DemocraticChain SBT", "DCSBT");
    await soulBoundToken.waitForDeployment();
  });

  it("should mint soulbound tokens", async function () {
    const tx = await soulBoundToken.mint(addr1.address, "ipfs://QmTest");
    await tx.wait();
    
    expect(await soulBoundToken.isEligible(addr1.address)).to.equal(true);
    expect(await soulBoundToken.hasMinted(addr1.address)).to.equal(true);
  });

  it("should not allow double minting", async function () {
    await soulBoundToken.mint(addr1.address, "ipfs://QmTest");
    
    await expect(
      soulBoundToken.mint(addr1.address, "ipfs://QmTest2")
    ).to.be.revertedWith("Already minted");
  });

  it("should lock token after minting", async function () {
    await soulBoundToken.mint(addr1.address, "ipfs://QmTest");
    
    expect(await soulBoundToken.locked(0)).to.equal(true);
  });

  it("should lock token after minting", async function () {
    await soulBoundToken.mint(addr1.address, "ipfs://QmTest");
    
    expect(await soulBoundToken.locked(0)).to.equal(true);
  });

  it("should prevent non-owner from transferring", async function () {
    await soulBoundToken.mint(addr1.address, "ipfs://QmTest");
    
    await expect(
      soulBoundToken.transferFrom(addr1.address, addr2.address, 0)
    ).to.be.reverted;
  });
});

describe("Voting", function () {
  let voting;
  let soulBoundToken;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const SoulBoundToken = await ethers.getContractFactory("SoulBoundToken");
    soulBoundToken = await SoulBoundToken.deploy("SBT", "SBT");
    await soulBoundToken.waitForDeployment();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
    
    await voting.createElection(
      "Test Election",
      3,
      7 * 24 * 60 * 60,
      owner.address,
      await soulBoundToken.getAddress(),
      ethers.ZeroAddress
    );
    
    await voting.addCandidates(
      0,
      ["Candidate A", "Candidate B", "Candidate C"],
      ["Party A", "Party B", "Party C"],
      ["ipfs://A", "ipfs://B", "ipfs://C"]
    );
  });

  it("should create election with candidates", async function () {
    const details = await voting.getElectionDetails(0);
    expect(details[0]).to.equal("Test Election");
    expect(details[3]).to.equal(3);
  });

  it("should allow voting with SBT", async function () {
    await soulBoundToken.mint(addr1.address, "ipfs://QmTest");
    
    const nullifierHash = ethers.keccak256(ethers.randomBytes(32));
    const encryptedVote = ethers.keccak256(ethers.solidityPacked(["uint256"], [1]));
    
    await voting.connect(addr1).castVoteSimple(0, encryptedVote, nullifierHash);
    
    expect(await voting.hasVotedInElection(0, addr1.address)).to.equal(true);
  });

  it("should prevent double voting", async function () {
    await soulBoundToken.mint(addr1.address, "ipfs://QmTest");
    
    const nullifierHash = ethers.keccak256(ethers.randomBytes(32));
    const encryptedVote = ethers.keccak256(ethers.solidityPacked(["uint256"], [1]));
    
    await voting.connect(addr1).castVoteSimple(0, encryptedVote, nullifierHash);
    
    await expect(
      voting.connect(addr1).castVoteSimple(0, encryptedVote, nullifierHash)
    ).to.be.revertedWith("Already voted");
  });

  it("should prevent voting without SBT", async function () {
    const nullifierHash = ethers.keccak256(ethers.randomBytes(32));
    const encryptedVote = ethers.keccak256(ethers.solidityPacked(["uint256"], [1]));
    
    await expect(
      voting.connect(addr1).castVoteSimple(0, encryptedVote, nullifierHash)
    ).to.be.revertedWith("Not eligible (no SBT)");
  });
});

describe("DAOAudit", function () {
  let daoAudit;
  let voting;
  let soulBoundToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const SoulBoundToken = await ethers.getContractFactory("SoulBoundToken");
    soulBoundToken = await SoulBoundToken.deploy("SBT", "SBT");
    await soulBoundToken.waitForDeployment();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
    
    await voting.createElection(
      "Test Election",
      3,
      7 * 24 * 60 * 60,
      owner.address,
      await soulBoundToken.getAddress(),
      ethers.ZeroAddress
    );
    
    await voting.addCandidates(
      0,
      ["Candidate A", "Candidate B", "Candidate C"],
      ["Party A", "Party B", "Party C"],
      ["ipfs://A", "ipfs://B", "ipfs://C"]
    );
    
    await soulBoundToken.mint(addr1.address, "ipfs://QmVoter1");
    await soulBoundToken.mint(addr2.address, "ipfs://QmVoter2");
    
    const nullifierHash1 = ethers.keccak256(ethers.randomBytes(32));
    const encryptedVote1 = ethers.keccak256(ethers.solidityPacked(["uint256"], [1]));
    await voting.connect(addr1).castVoteSimple(0, encryptedVote1, nullifierHash1);
    
    const nullifierHash2 = ethers.keccak256(ethers.randomBytes(32));
    const encryptedVote2 = ethers.keccak256(ethers.solidityPacked(["uint256"], [2]));
    await voting.connect(addr2).castVoteSimple(0, encryptedVote2, nullifierHash2);
    
    await voting.endElection(0);
    await voting.tallyVotes(0);
    
    const DAOAudit = await ethers.getContractFactory("DAOAudit");
    daoAudit = await DAOAudit.deploy(
      await voting.getAddress(),
      60,
      2
    );
    await daoAudit.waitForDeployment();
    
    await daoAudit.addAuditor(addr1.address);
    await daoAudit.addAuditor(addr2.address);
  });

  it("should add auditors", async function () {
    expect(await daoAudit.getAuditorCount()).to.equal(2);
  });

  it("should create and execute proposal", async function () {
    const results = await voting.getResults(0);
    const resultsArray = results.map(v => Number(v));
    
    await daoAudit.connect(addr1).createAuditProposal(
      0,
      resultsArray,
      "Test audit proposal"
    );
    
    await daoAudit.connect(addr1).voteOnProposal(0, true);
    await daoAudit.connect(addr2).voteOnProposal(0, true);
    
    await ethers.provider.send("evm_increaseTime", [120]);
    await ethers.provider.send("evm_mine");
    
    await daoAudit.connect(addr1).executeProposal(0);
    
    expect(await daoAudit.hasApprovedResult()).to.equal(true);
  });
});
