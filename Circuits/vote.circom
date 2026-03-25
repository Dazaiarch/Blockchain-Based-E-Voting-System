include "circom/poseidon.circom";
include "circom/bitify.circom";
include "circom/switcher.circom";

template VoteValidator(){
    signal input nullifierHash;
    signal input electionId;
    signal input commitment;
    signal input voterAddress;
    signal input nullifier;
    signal input encryptedVote;
    signal input candidateId;
    signal input candidateCount;
    component candidateCheck = GreaterEqThan(252);
    candidateCheck.in[0] <== candidateId;
    candidateCheck.in[1] <== candidateCount;
    candidateCheck.out === 1;
   component candidateUpper = LessThan(252);
    candidateUpper.in[0] <== candidateId;
    candidateUpper.in[1] <== candidateCount;
    candidateUpper.out === 1;
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== voterAddress;
    nullifierHasher.inputs[1] <== nullifier;
    nullifierHasher.out === nullifierHash;
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== encryptedVote;
    commitmentHasher.inputs[1] <== nullifier;
    commitmentHasher.out === commitment;
    component voteValid = IsZero();
    voteValid.in <== candidateId * (candidateId - 1);
}
template VoteValidatorMulti() {
signal input nullifierHash;
    signal input electionId;
    signal input commitment;
    signal input voterAddress;
    signal input nullifier;
    signal input candidateCount;
    signal input selectedCandidate;
    signal input[100] candidateVotes;
    component sum = Sum(100);
    for (var i = 0; i < 100; i++) {
        sum.in[i] <== candidateVotes[i];
    }
    sum.out === 1;
    component validIndex = LessThan(252);
    validIndex.in[0] <== selectedCandidate;
    validIndex.in[1] <== candidateCount;
    validIndex.out === 1;
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== voterAddress;
    nullifierHasher.inputs[1] <== nullifier;
    nullifierHasher.out === nullifierHash;
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== selectedCandidate;
    commitmentHasher.inputs[1] <== nullifier;
    commitmentHasher.out === commitment;
}
template Sum(n) {
    signal input in[n];
    signal output out;
    signal temp[n+1];
    temp[0] <== 0;
    for (var i = 0; i < n; i++) {
        temp[i+1] <== temp[i] + in[i];
    }
    out <== temp[n];
}

component main {public [nullifierHash, electionId, commitment]} = VoteValidator();



