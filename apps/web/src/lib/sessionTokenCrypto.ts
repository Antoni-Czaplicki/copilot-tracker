import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const encryptedTokenPrefix = "v1:";
const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

export function encryptSessionTokenValue(
  value: string | null,
  encryptionMaterial: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const key = sessionTokenEncryptionKey(encryptionMaterial);
  if (!key) {
    return null;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    encryptedTokenPrefix,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSessionTokenValue(
  value: string | null,
  encryptionMaterial: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const key = sessionTokenEncryptionKey(encryptionMaterial);
  if (!value.startsWith(encryptedTokenPrefix)) {
    return key ? value : null;
  }

  if (!key) {
    return null;
  }

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== encryptedTokenPrefix) {
    return null;
  }

  const [, ivValue, tagValue, encryptedValue] = parts;
  const iv = decodeBase64UrlSegment(ivValue);
  const tag = decodeBase64UrlSegment(tagValue);
  const encrypted = decodeBase64UrlSegment(encryptedValue);
  if (iv?.length !== 12 || tag?.length !== 16 || !encrypted?.length) {
    return null;
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

function decodeBase64UrlSegment(value: string | undefined) {
  if (!value || !base64UrlPattern.test(value)) {
    return null;
  }

  try {
    return Buffer.from(value, "base64url");
  } catch {
    return null;
  }
}

function sessionTokenEncryptionKey(material: string | null | undefined) {
  if (!material) {
    return null;
  }

  return createHash("sha256").update(material).digest();
}
