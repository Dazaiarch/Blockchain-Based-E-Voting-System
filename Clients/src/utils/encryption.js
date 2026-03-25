
class Paillier {
  constructor(keyLength = 256) {
    this.keyLength = keyLength;
    this.publicKey = null;
    this.privateKey = null;
  }

  generateKeys() {
    const p = this.generatePrime(this.keyLength / 2);
    const q = this.generatePrime(this.keyLength / 2);
    
    const n = p * q;
    const lambda = this.lcm(p - 1, q - 1);
    
    const mu = this.modInverse(lambda, n);
    
    this.publicKey = { n, g: n + 1 };
    this.privateKey = { lambda, mu, p, q };
    
    return { publicKey: this.publicKey, privateKey: this.privateKey };
  }

  generatePrime(bits) {
    let prime;
    do {
      prime = this.generateRandomBits(bits);
    } while (!this.isPrime(prime));
    return prime;
  }

  generateRandomBits(bits) {
    const hex = Math.random().toString(16).slice(2, 2 + bits / 4);
    return BigInt('0x' + hex);
  }

  isPrime(n, k = 20) {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;

    const r = n - 1n;
    let s = 0;
    while (r % 2n === 0n) {
      s++;
    }

    for (let i = 0; i < k; i++) {
      const a = this.randomBigIntRange(2n, n - 2n);
      let x = this.modPow(a, r, n);
      
      if (x === 1n || x === n - 1n) continue;
      
      let composite = true;
      for (let j = 0; j < s - 1; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          composite = false;
          break;
        }
      }
      
      if (composite) return false;
    }
    return true;
  }

  randomBigIntRange(min, max) {
    const range = max - min + 1n;
    const hex = range.toString(16).slice(2);
    const random = BigInt('0x' + hex + Math.random().toString(16).slice(2, 6));
    return min + (random % range);
  }

  modPow(base, exp, mod) {
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod;
      }
      exp = exp / 2n;
      base = (base * base) % mod;
    }
    return result;
  }

  modInverse(a, m) {
    let m0 = m;
    let y = 0n;
    let x = 1n;
    
    if (m === 1n) return 0n;
    
    while (a > 1n) {
      const q = a / m;
      let t = m;
      m = a % m;
      a = t;
      t = y;
      y = x - q * y;
      x = t;
    }
    
    if (x < 0n) x += m0;
    return x;
  }

  lcm(a, b) {
    return (a * b) / this.gcd(a, b);
  }

  gcd(a, b) {
    while (b !== 0n) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  encrypt(message, publicKey = this.publicKey) {
    const { n, g } = publicKey;
    const r = this.randomBigIntRange(1n, n);
    const n2 = n * n;
    
    const encrypted = (g * this.modPow(r, n, n2)) % n2;
    const messageEncrypted = (this.modPow(message + 1n, n, n2) * encrypted) % n2;
    
    return messageEncrypted;
  }

  decrypt(ciphertext, publicKey = this.publicKey, privateKey = this.privateKey) {
    const { n } = publicKey;
    const { lambda, mu, p, q } = privateKey;
    const n2 = n * n;

    const u = this.modPow(ciphertext, lambda, n2);
    const v = this.modPow(u, mu, n);

    const plaintext = ((v - 1n) / n) % n;
    return plaintext < 0n ? plaintext + n : plaintext;
  }

  add(cipher1, cipher2, publicKey = this.publicKey) {
    const { n } = publicKey;
    const n2 = n * n;
    return (cipher1 * cipher2) % n2;
  }

  multiply(cipher, scalar, publicKey = this.publicKey) {
    const { n } = publicKey;
    const n2 = n * n;
    return this.modPow(cipher, scalar, n2);
  }

  serializeKey(key) {
    if (typeof key === 'object') {
      return JSON.stringify(key, (k, v) => {
        if (typeof v === 'bigint') return v.toString();
        return v;
      });
    }
    return key;
  }

  deserializeKey(str) {
    return JSON.parse(str, (k, v) => {
      if (typeof v === 'string' && /^\d+n$/.test(v)) return BigInt(v);
      return v;
    });
  }
}

class VoteEncryption {
  constructor() {
    this.paillier = new Paillier(256);
    this.electionPublicKey = null;
    this.electionPrivateKey = null;
  }

  initElection() {
    const keys = this.paillier.generateKeys();
    this.electionPublicKey = keys.publicKey;
    this.electionPrivateKey = keys.privateKey;
    return {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey
    };
  }

  encryptVote(candidateId, publicKey = this.electionPublicKey) {
    return this.paillier.encrypt(BigInt(candidateId + 1), publicKey);
  }

  decryptTally(encryptedVotes, privateKey = this.electionPrivateKey) {
    return this.paillier.decrypt(encryptedVotes, this.electionPublicKey, privateKey);
  }

  aggregateVotes(encryptedVotesList, publicKey = this.electionPublicKey) {
    let aggregate = 1n;
    for (const cipher of encryptedVotesList) {
      aggregate = this.paillier.add(aggregate, cipher, publicKey);
    }
    return aggregate;
  }
}

export { Paillier, VoteEncryption };
