const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  console.log("\n=== Deploying SoulBoundToken ===");
  const SoulBoundToken = await hre.ethers.getContractFactory("SoulBoundToken");
  const soulBoundToken = await SoulBoundToken.deploy("DemocraticChain SBT", "DCSBT");
  await soulBoundToken.waitForDeployment();
  const soulBoundTokenAddress = await soulBoundToken.getAddress();
  console.log("SoulBoundToken deployed to:", soulBoundTokenAddress);

  console.log("\n=== Deploying ZKVerifier ===");
  const ZKVerifier = await hre.ethers.getContractFactory("ZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log("ZKVerifier deployed to:", zkVerifierAddress);

  console.log("\n=== Deploying Voting ===");
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("Voting deployed to:", votingAddress);

  console.log("\n=== Deploying DAOAudit ===");
  const DAOAudit = await hre.ethers.getContractFactory("DAOAudit");
  const daoAudit = await DAOAudit.deploy(votingAddress, 7 * 24 * 60 * 60, 3);
  await daoAudit.waitForDeployment();
  const daoAuditAddress = await daoAudit.getAddress();
  console.log("DAOAudit deployed to:", daoAuditAddress);

  console.log("\n=== Setting up Voting contract ===");
  const tx = await voting.createElection(
    "Presidential Election 2026",
    3,
    7 * 24 * 60 * 60,
    deployer.address,
    soulBoundTokenAddress,
    zkVerifierAddress
  );
  await tx.wait();
  console.log("Election created successfully");

  const candidates = [
    ["Candidate A", "Party A", "ipfs://QmCandidateA"],
    ["Candidate B", "Party B", "ipfs://QmCandidateB"],
    ["Candidate C", "Party C", "ipfs://QmCandidateC"]
  ];
  
  const names = candidates.map(c => c[0]);
  const parties = candidates.map(c => c[1]);
  const imageHashes = candidates.map(c => c[2]);
  
  const tx2 = await voting.addCandidates(0, names, parties, imageHashes);
  await tx2.wait();
  console.log("Candidates added successfully");

  const config = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      SoulBoundToken: soulBoundTokenAddress,
      ZKVerifier: zkVerifierAddress,
      Voting: votingAddress,
      DAOAudit: daoAuditAddress
    },
    election: {
      id: 0,
      name: "Presidential Election 2026",
      candidateCount: 3
    },
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(config, null, 2)
  );
  console.log("\nDeployment configuration saved to deployments.json");

  console.log("\n=== Deployment Complete ===");
  console.log("SoulBoundToken:", soulBoundTokenAddress);
  console.log("ZKVerifier:", zkVerifierAddress);
  console.log("Voting:", votingAddress);
  console.log("DAOAudit:", daoAuditAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
