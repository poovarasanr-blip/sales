import { ENCRYPT_KEY, SESSION_KEYS } from "../../config/constants";
import CryptoJS from "crypto-js";

const KEY = CryptoJS.enc.Utf8.parse(ENCRYPT_KEY);
const IV = CryptoJS.enc.Utf8.parse(ENCRYPT_KEY);

export function encryptSession(value: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(value, KEY, {
      iv: IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (error) {
    console.error("Session encryption failed:", error);
    return "";
  }
}

export function decryptSession(value: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(value, KEY, {
      iv: IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Session decryption failed:", error);
    return "";
  }
}
export function setSession(value: string): void {
  const encrypted = encryptSession(value);
  sessionStorage.setItem(SESSION_KEYS.LOGIN_RESPONSE, encrypted);
}

export function setClientSession(value: string): void {
  const encrypted = encryptSession(value);
  sessionStorage.setItem(SESSION_KEYS.CLIENT_DETAILS, encrypted);
}

export function getSession<T = unknown>(): T | null {
  const raw = sessionStorage.getItem(SESSION_KEYS.LOGIN_RESPONSE);
  if (!raw) return null;
  try {
    const decrypted = decryptSession(raw);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.log(error, "session");
    return null;
  }
}

export function getClientSession<T = unknown>(): T | null {
  const raw = sessionStorage.getItem(SESSION_KEYS.CLIENT_DETAILS);
  if (!raw) return null;
  try {
    const decrypted = decryptSession(raw);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.log(error, "session");
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEYS.LOGIN_RESPONSE);
}
