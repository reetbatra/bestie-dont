import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Field-level encryption for anything that could name or describe a third
 * party (him): receipts, vault entries, journal responses, slip notes.
 *
 * This runs server-side only (Server Actions / Route Handlers), keyed by
 * ENCRYPTION_MASTER_KEY. It protects the data at rest — a raw Postgres dump,
 * a leaked Supabase service-role key, or a support engineer with table
 * access all see ciphertext, never plaintext. It is not zero-knowledge: the
 * onboarding flow starts with an anonymous session and no password, so
 * there's no per-user secret to derive a client-only key from without
 * breaking the "under 3 minutes, no login friction" onboarding requirement.
 * A compromised server + master key can still decrypt. That tradeoff is the
 * honest one for this product; a true E2E design would need a passphrase
 * collected at onboarding, which the strategy doc explicitly avoids.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key) throw new Error("ENCRYPTION_MASTER_KEY is not set");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_MASTER_KEY must be a base64-encoded 32-byte key");
  }
  return buf;
}

export interface EncryptedField {
  ciphertext: string;
  iv: string;
}

export function encryptField(plaintext: string): EncryptedField {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptField(ciphertext: string, iv: string): string {
  const combined = Buffer.from(ciphertext, "base64");
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Convenience for optional fields — returns nulls through untouched. */
export function encryptOptionalField(plaintext: string | null | undefined): {
  ciphertext: string | null;
  iv: string | null;
} {
  if (!plaintext) return { ciphertext: null, iv: null };
  const { ciphertext, iv } = encryptField(plaintext);
  return { ciphertext, iv };
}

export function decryptOptionalField(
  ciphertext: string | null,
  iv: string | null,
): string | null {
  if (!ciphertext || !iv) return null;
  return decryptField(ciphertext, iv);
}
