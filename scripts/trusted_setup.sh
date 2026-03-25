set -e

echo "=== ZK Voting System Trusted Setup ==="
echo ""

BUILD_DIR="build"
CIRCUITS_DIR="circuits"

mkdir -p $BUILD_DIR

echo "Step 1: Compiling circuit..."
circom $CIRCUITS_DIR/vote.circom --r1cs --wasm --sym -o $BUILD_DIR
echo "Circuit compiled successfully"

echo ""
echo "Step 2: Powers of Tau (Phase 1)..."
cd $BUILD_DIR
snarkjs powersoftau new bn128 18 pot00_0000.ptau -v
snarkjs powersoftau contribute pot00_0000.ptau pot01_0001.ptau --name="First contribution" -e="random1" -v
snarkjs powersoftau contribute pot01_0001.ptau pot02_0002.ptau --name="Second contribution" -e="random2" -v

echo ""
echo "Step 3: Phase 2 (Setup)..."
snarkjs powersoftau prepare phase2 pot02_0002.ptau pot_final.ptau -v

echo ""
echo "Step 4: Generating zKey..."
snarkjs groth16 setup vote.r1cs pot_final.ptau vote_0000.zkey

echo ""
echo "Step 5: Contributing to ceremony..."
snarkjs zkey contribute vote_0000.zkey vote_0001.zkey --name="User contribution" -e="random3" -v

echo ""
echo "Step 6: Exporting verification key..."
snarkjs zkey export verificationkey vote_0001.zkey verification_key.json

echo ""
echo "Step 7: Generating Solidity verifier..."
snarkjs zkey export solidityverifier vote_0001.zkey $BUILD_DIR/Verifier.sol

echo ""
echo "=== Trusted Setup Complete ==="
echo "Files generated:"
echo "  - $BUILD_DIR/vote.wasm (proving key)"
echo "  - $BUILD_DIR/vote_final.zkey (proving key)"
echo "  - $BUILD_DIR/verification_key.json (verification key)"
echo "  - $BUILD_DIR/Verifier.sol (on-chain verifier)"
echo ""
echo "Next steps:"
echo "  1. Deploy Verifier.sol to Sepolia"
echo "  2. Initialize verifier in Voting contract"
echo "  3. Use vote.wasm in frontend for proof generation"
