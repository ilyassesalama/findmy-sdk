import { createHash, pbkdf2Sync, randomBytes } from "node:crypto";

/**
 * SRP-6a client for Apple's iCloud sign-in (GSA mode, SHA-256, 2048-bit group).
 * Ported byte-for-byte from the protocol used by @foxt/js-srp.
 */

// RFC 5054 2048-bit group.
const N =
  0xac6bdb41324a9a9bf166de5e1389582faf72b6651987ee07fc3192943db56050a37329cbb4a099ed8193e0757767a13dd52312ab4b03310dcd7f48a9da04fd50e8083969edb767b0cf6095179a163ab3661a05fbd5faaae82918a9962f0b93b855f97993ec975eeaa80d740adbf4ff747359d041d5c33ea71d281e446b14773bca97b43a23fb801676bd207a436c6481f1d2b9078717461a5b9d32e688f87748544523b524b0d57d5ea77a2775d2ecfa032cfbdbf52fb3786160279004e57ae6af874e7303ce53299ccc041c7bc308d82a5698f3a8d0c38271ae35f8e9dbfbb694b5c803d89f7ae435de236d525f54759b65e372fcd68ef20fa7111f9e4aff73n;
const g = 2n;
const GROUP_BYTES = 256;

const sha256 = (data: Buffer): Buffer => createHash("sha256").update(data).digest();

function bytesFromBigint(v: bigint): Buffer {
  let hex = v.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  return Buffer.from(hex, "hex");
}

const bigintFromBytes = (buf: Buffer): bigint =>
  buf.length === 0 ? 0n : BigInt("0x" + buf.toString("hex"));

/** Left-pad a bigint's big-endian bytes to `n` bytes. */
function pad(v: bigint, n: number): Buffer {
  const b = bytesFromBigint(v);
  if (b.length >= n) return b;
  return Buffer.concat([Buffer.alloc(n - b.length), b]);
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  base = ((base % mod) + mod) % mod;
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

const hashInt = (buf: Buffer): bigint => bigintFromBytes(sha256(buf));

export interface SrpChallenge {
  salt: string; // base64
  b: string; // base64 server public value B
  iteration: number;
  protocol: "s2k" | "s2k_fo";
}

/**
 * Computes the SRP proof for a sign-in. Call {@link SrpClient.publicKey} to get
 * `A` for the init request, then {@link SrpClient.proof} with the server's
 * challenge to obtain M1/M2 for the complete request.
 */
export class SrpClient {
  private readonly a: bigint;
  private readonly A: bigint;

  constructor(
    private readonly username: string,
    private readonly password: string,
  ) {
    this.a = bigintFromBytes(randomBytes(GROUP_BYTES));
    this.A = modPow(g, this.a, N);
  }

  /** base64-encoded client public value A. */
  publicKey(): string {
    return bytesFromBigint(this.A).toString("base64");
  }

  proof(challenge: SrpChallenge): { m1: string; m2: string } {
    const salt = Buffer.from(challenge.salt, "base64");
    const B = Buffer.from(challenge.b, "base64");
    const Bn = bigintFromBytes(B);
    if (Bn % N === 0n) throw new Error("Invalid server public key");

    // Derive the passphrase `p` from the password.
    let passHash: Buffer = sha256(Buffer.from(this.password, "utf8"));
    if (challenge.protocol === "s2k_fo") {
      passHash = Buffer.from(passHash.toString("hex"), "utf8");
    }
    const p = pbkdf2Sync(passHash, salt, challenge.iteration, 32, "sha256");

    const k = hashInt(Buffer.concat([bytesFromBigint(N), pad(g, GROUP_BYTES)]));
    const u = hashInt(Buffer.concat([pad(this.A, GROUP_BYTES), pad(Bn, GROUP_BYTES)]));
    if (u === 0n) throw new Error("Invalid server public key");

    // GSA mode: x = H(salt || H(":" || p)), identity omitted before the colon.
    const x = hashInt(Buffer.concat([salt, sha256(Buffer.concat([Buffer.from([0x3a]), p]))]));

    const S = modPow(Bn - modPow(g, x, N) * k, this.a + u * x, N);
    const K = sha256(bytesFromBigint(S));

    const Abytes = bytesFromBigint(this.A);
    const M1 = sha256(
      Buffer.concat([
        xor(sha256(bytesFromBigint(N)), sha256(pad(g, GROUP_BYTES))),
        sha256(Buffer.from(this.username, "utf8")), // H(identity)
        salt,
        Abytes,
        bytesFromBigint(Bn),
        K,
      ]),
    );
    const M2 = sha256(Buffer.concat([Abytes, M1, K]));

    return { m1: M1.toString("base64"), m2: M2.toString("base64") };
  }
}

function xor(a: Buffer, b: Buffer): Buffer {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}
