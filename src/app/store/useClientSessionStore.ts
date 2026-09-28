import { create } from "zustand";
import { SESSION_KEYS } from "../../config/constants";
import { setClientContext } from "../../config/env";
import {
  getClientSessionString,
  getClientSessionValue,
  setClientSessionString,
  setClientSessionValue,
} from "../../shared/utils/clientSessionStorage";

interface ClientSessionState {
  clientId: number | null;
  clientContractId: number | null;
  clientName: string | null;
  clientContractName: string | null;
  hydrate: () => void;
  saveClientSelection: (
    clientId: number,
    clientContractId: number,
    clientName: string,
    clientContractName: string,
  ) => void;
}

function readClientSelection() {
  return {
    clientId: getClientSessionValue(SESSION_KEYS.CLIENT_ID),
    clientContractId: getClientSessionValue(SESSION_KEYS.CLIENT_CONTRACT_ID),
    clientName: getClientSessionString(SESSION_KEYS.CLIENT_NAME),
    clientContractName: getClientSessionString(SESSION_KEYS.CLIENT_CONTRACT_NAME),
  };
}

function applyClientSelection(
  selection: Pick<ClientSessionState, "clientId" | "clientContractId">,
): void {
  if (selection.clientId !== null && selection.clientContractId !== null) {
    setClientContext(selection.clientId, selection.clientContractId);
  }
}

const initialSelection = readClientSelection();
applyClientSelection(initialSelection);

export const useClientSessionStore = create<ClientSessionState>((set) => ({
  ...initialSelection,

  hydrate: () => {
    const selection = readClientSelection();
    applyClientSelection(selection);
    set(selection);
  },

  saveClientSelection: (clientId, clientContractId, clientName, clientContractName) => {
    setClientSessionValue(SESSION_KEYS.CLIENT_ID, clientId);
    setClientSessionValue(SESSION_KEYS.CLIENT_CONTRACT_ID, clientContractId);
    setClientSessionString(SESSION_KEYS.CLIENT_NAME, clientName);
    setClientSessionString(SESSION_KEYS.CLIENT_CONTRACT_NAME, clientContractName);

    const selection = readClientSelection();
    applyClientSelection(selection);
    set(selection);
  },
}));
