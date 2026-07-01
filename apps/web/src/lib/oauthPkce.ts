import { Buffer } from "node:buffer";

export async function createOauthPkceChallenge() {
  const codeVerifier = base64UrlEncode(
    crypto.getRandomValues(new Uint8Array(32)),
  );
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );

  return {
    codeVerifier,
    codeChallenge: base64UrlEncode(new Uint8Array(digest)),
  };
}

function base64UrlEncode(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}
