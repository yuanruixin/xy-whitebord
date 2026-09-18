/**
 * 本地敏感信息加密存储。
 *
 * 使用 Web Crypto 的 AES-GCM 加密，密钥为「不可导出」的 CryptoKey，
 * 保存在 IndexedDB 中，localStorage 里只落盘密文。
 * 说明：纯前端无法做到绝对安全（页面内代码仍可调用解密），
 * 但可避免明文 Key 被直接读取，显著提高获取成本。
 */

const DB_NAME = "xy-whiteboard";
const DB_VERSION = 1;
const STORE_NAME = "crypto";
const KEY_NAME = "ai-config-key";

const ENCRYPTED_PREFIX = "v1:";
const OBFUSCATED_PREFIX = "v0:";

let dbPromise: Promise<IDBDatabase> | null = null;
// 单例 Promise，避免并发初始化时生成多个密钥导致历史密文无法解密
let keyPromise: Promise<CryptoKey | null> | null = null;

function hasWebCrypto(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.encrypt === "function"
  );
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function readKey(): Promise<CryptoKey | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(KEY_NAME);
    request.onsuccess = () => resolve((request.result as CryptoKey) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writeKey(key: CryptoKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(key, KEY_NAME);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 获取（或首次生成）不可导出的 AES 密钥
function getKey(): Promise<CryptoKey | null> {
  if (!keyPromise) keyPromise = loadOrCreateKey();
  return keyPromise;
}

async function loadOrCreateKey(): Promise<CryptoKey | null> {
  if (!hasWebCrypto() || typeof indexedDB === "undefined") return null;

  try {
    let key = await readKey();
    if (!key) {
      key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      await writeKey(key);
    }
    return key;
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// crypto.subtle 不可用时的降级方案（异或混淆，仅避免明文）
const FALLBACK_SECRET = "xy-whiteboard:fallback-secret";

function obfuscate(plain: string): string {
  const bytes = new TextEncoder().encode(plain);
  const secret = new TextEncoder().encode(FALLBACK_SECRET);
  const output = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    output[i] = bytes[i] ^ secret[i % secret.length];
  }
  return toBase64(output);
}

function deobfuscate(payload: string): string {
  const bytes = fromBase64(payload);
  const secret = new TextEncoder().encode(FALLBACK_SECRET);
  const output = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    output[i] = bytes[i] ^ secret[i % secret.length];
  }
  return new TextDecoder().decode(output);
}

export async function encryptString(plain: string): Promise<string> {
  if (!plain) return "";

  const key = await getKey();
  if (key) {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(plain);
      const cipher = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );
      return `${ENCRYPTED_PREFIX}${toBase64(iv)}:${toBase64(
        new Uint8Array(cipher)
      )}`;
    } catch {
      // 加密失败则降级
    }
  }

  return `${OBFUSCATED_PREFIX}${obfuscate(plain)}`;
}

export async function decryptString(payload: string): Promise<string> {
  if (!payload) return "";

  if (payload.startsWith(ENCRYPTED_PREFIX)) {
    const [ivB64, dataB64] = payload.slice(ENCRYPTED_PREFIX.length).split(":");
    const key = await getKey();
    if (!key) throw new Error("解密密钥不可用");
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivB64) },
      key,
      fromBase64(dataB64)
    );
    return new TextDecoder().decode(plain);
  }

  if (payload.startsWith(OBFUSCATED_PREFIX)) {
    return deobfuscate(payload.slice(OBFUSCATED_PREFIX.length));
  }

  // 兼容历史明文
  return payload;
}
