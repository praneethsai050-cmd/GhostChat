/**
 * Web Crypto API utilities for End-to-End Encryption (E2EE)
 * Uses ECDH (P-256) for Key Agreement + AES-GCM (256-bit) for Authenticated Encryption
 */

// Generate an ephemeral ECDH key pair
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// Export public key to raw ArrayBuffer, encoded as Base64 string for transmission
export async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

// Import stranger's public key from Base64 string
export async function importPublicKey(base64Str) {
  const buffer = base64ToArrayBuffer(base64Str);
  return await window.crypto.subtle.importKey(
    "raw",
    buffer,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    []
  );
}

// Derive a shared AES-GCM (256-bit) encryption key from local private key and remote public key
export async function deriveSharedKey(privateKey, remotePublicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: remotePublicKey
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Generate a visual safety fingerprint / verification code from the derived AES key
export async function generateSafetyFingerprint(sharedKey) {
  const rawKey = await window.crypto.subtle.exportKey("raw", sharedKey);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", rawKey);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Format as a 6-digit number + 4 emoji verification combo
  const code = ((hashArray[0] << 24 | hashArray[1] << 16 | hashArray[2] << 8 | hashArray[3]) >>> 0) % 1000000;
  const formattedCode = code.toString().padStart(6, '0');
  
  const emojis = ["🛡️", "⚡", "🔑", "🪐", "💎", "🌟", "🔥", "🚀", "🍀", "🌊", "🦊", "🔮", "🌈", "🧩"];
  const emojiStr = [
    emojis[hashArray[4] % emojis.length],
    emojis[hashArray[5] % emojis.length],
    emojis[hashArray[6] % emojis.length],
    emojis[hashArray[7] % emojis.length]
  ].join(' ');

  return { code: formattedCode, emojis: emojiStr };
}

// Encrypt plaintext or JSON payload using AES-GCM
export async function encryptData(sharedKey, data) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const enc = new TextEncoder();
  const encodedData = enc.encode(typeof data === 'string' ? data : JSON.stringify(data));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    sharedKey,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

// Decrypt AES-GCM ciphertext
export async function decryptData(sharedKey, ciphertextBase64, ivBase64) {
  const cipherBuffer = base64ToArrayBuffer(ciphertextBase64);
  const ivBuffer = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer)
    },
    sharedKey,
    cipherBuffer
  );

  const dec = new TextDecoder();
  const text = dec.decode(decryptedBuffer);
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

// Helpers for Base64 <-> ArrayBuffer
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
