const snarkjs = require('snarkjs');

class ZKProofGenerator {
  constructor(wasmPath, zkeyPath) {
    this.wasmPath = wasmPath;
    this.zkeyPath = zkeyPath;
  }

  async generateVoteProof(voterAddress, candidateId, candidateCount, nullifier) {
    const input = {
      voterAddress: BigInt(voterAddress),
      candidateId: BigInt(candidateId),
      candidateCount: BigInt(candidateCount),
      nullifier: BigInt(nullifier)
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      this.wasmPath,
      this.zkeyPath
    );

    return {
      proof: this.flattenProof(proof),
      nullifierHash: publicSignals[0],
      electionId: publicSignals[1],
      commitment: publicSignals[2]
    };
  }

  flattenProof(proof) {
    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][0], proof.pi_b[0][1]],
        [proof.pi_b[1][0], proof.pi_b[1][1]]
      ],
      c: [proof.pi_c[0], proof.pi_c[1]]
    };
  }

  async verifyProof(proof, publicSignals, vKey) {
    return await snarkjs.groth16.verify(vKey, publicSignals, proof);
  }
}

module.exports = ZKProofGenerator;

