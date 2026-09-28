import { SESSION_KEYS } from "../../config/constants";
import { decryptSession, encryptSession } from "./sessionStorage";

export type ClientSessionKey =
  | typeof SESSION_KEYS.CLIENT_ID
  | typeof SESSION_KEYS.CLIENT_CONTRACT_ID
  | typeof SESSION_KEYS.CLIENT_NAME
  | typeof SESSION_KEYS.CLIENT_CONTRACT_NAME;

export function setClientSessionValue(
  key: ClientSessionKey,
  value: number,
): void {
  sessionStorage.setItem(key, encryptSession(String(value)));
}

export function getClientSessionValue(key: ClientSessionKey): number | null {
  const encrypted = sessionStorage.getItem(key);
  if (!encrypted) return null;

  const decrypted = decryptSession(encrypted);
  if (!decrypted.trim()) return null;

  const value = Number(decrypted);
  return Number.isFinite(value) ? value : null;
}

export function setClientSessionString(
  key: ClientSessionKey,
  value: string,
): void {
  sessionStorage.setItem(key, encryptSession(value));
}

export function getClientSessionString(key: ClientSessionKey): string | null {
  const encrypted = sessionStorage.getItem(key);
  if (!encrypted) return null;

  const decrypted = decryptSession(encrypted);
  return decrypted.trim() || null;
}
