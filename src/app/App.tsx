import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "../modules/sales-incentive/routes";
import Sidebar from "../shared/components/layout/Sidebar/Sidebar";
import Header from "../shared/components/layout/Header/Header";
import { ToastContainer } from "../shared/components/ui/CustomToast/CustomToastMessage";
import ClientSelectionModal from "../shared/components/ui/ClientSelectionModal/ClientSelectionModal";
import SessionDetails from "../assets/json/SessionResponce/SessionDetails.json";
import { setSession, getSession } from "../shared/utils/sessionStorage";
import { useAuthStore, type SessionData } from "./store/useAuthStore";
import { useClientSessionStore } from "./store/useClientSessionStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  handleGetUserMappedClientContractList,
  handleGetUserMappedClientList,
  type MappedClient,
  type MappedClientContract,
} from "../query/api";

function initSession() {
  setSession(JSON.stringify(SessionDetails));
  const existing = getSession<SessionData>();
  useAuthStore.setState({
    sessionData: existing as SessionData,
    isAuthenticated: true,
  });
}

initSession();

const queryClient = new QueryClient();

export default function App() {
  const sessionData = useAuthStore((s) => s.sessionData);
  const clientId = useClientSessionStore((s) => s.clientId);
  const clientContractId = useClientSessionStore((s) => s.clientContractId);
  const saveClientSelection = useClientSessionStore(
    (s) => s.saveClientSelection,
  );
  const [isClientSelectionOpen, setIsClientSelectionOpen] = useState(false);
  const [clients, setClients] = useState<MappedClient[]>([]);
  const [contracts, setContracts] = useState<MappedClientContract[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [isContractsLoading, setIsContractsLoading] = useState(false);
  const [clientLoadError, setClientLoadError] = useState("");
  const [contractLoadError, setContractLoadError] = useState("");
  const clientRequestStarted = useRef(false);
  const activeClientId = useRef(clientId);
  const contractCache = useRef(new Map<number, MappedClientContract[]>());
  const contractRequests = useRef(
    new Map<number, Promise<MappedClientContract[]>>(),
  );
  const hasSessionCredentials = Boolean(
    sessionData?.Key && sessionData?.Vector && sessionData?.Token,
  );

  const needsClientSelection = clientId === null || clientContractId === null;
  const showModal = needsClientSelection || isClientSelectionOpen;

  const loadContracts = useCallback(
    async (selectedClientId: number) => {
      if (contractCache.current.has(selectedClientId)) {
        const cachedContracts =
          contractCache.current.get(selectedClientId) ?? [];
        setContracts(cachedContracts);
        setContractLoadError(
          cachedContracts.length === 0
            ? "No contracts are available for this client."
            : "",
        );
        setIsContractsLoading(false);
        return;
      }

      setIsContractsLoading(true);
      setContractLoadError("");
      let request = contractRequests.current.get(selectedClientId);
      if (!request) {
        request = handleGetUserMappedClientContractList(
          selectedClientId,
          sessionData?.Key ?? "",
          sessionData?.Vector ?? "",
          sessionData?.Token ?? "",
        );
        contractRequests.current.set(selectedClientId, request);
      }

      try {
        const result = await request;
        const mappedContracts = result.flatMap((contract) => {
          const id = Number(contract.Id);
          const name = String(contract.Name ?? "").trim();
          const responseClientId = Number(contract.ClientId);
          if (
            !Number.isFinite(id) ||
            !name ||
            (Number.isFinite(responseClientId) &&
              responseClientId !== selectedClientId)
          ) {
            return [];
          }
          return [{ Id: id, Name: name, ClientId: selectedClientId }];
        });
        contractCache.current.set(selectedClientId, mappedContracts);
        if (activeClientId.current === selectedClientId) {
          setContracts(mappedContracts);
          setContractLoadError(
            mappedContracts.length === 0
              ? "No contracts are available for this client."
              : "",
          );
        }
      } catch {
        if (activeClientId.current === selectedClientId) {
          setContracts([]);
          setContractLoadError("Unable to load contracts. Please try again.");
        }
      } finally {
        contractRequests.current.delete(selectedClientId);
        if (activeClientId.current === selectedClientId) {
          setIsContractsLoading(false);
        }
      }
    },
    [sessionData?.Key, sessionData?.Token, sessionData?.Vector],
  );

  useEffect(() => {
    if (clientRequestStarted.current) return;
    if (!sessionData?.Key || !sessionData.Vector || !sessionData.Token) {
      return;
    }
    clientRequestStarted.current = true;
    void handleGetUserMappedClientList(
      sessionData.Key,
      sessionData.Vector,
      sessionData.Token,
    )
      .then((result) => {
        const mappedClients = result.flatMap((client) => {
          const id = Number(client.Id);
          const name = String(client.ClientName ?? "").trim();
          return Number.isFinite(id) && name
            ? [{ Id: id, ClientName: name }]
            : [];
        });
        setClients(mappedClients);
        if (mappedClients.length === 0) {
          setClientLoadError("No clients are available for this account.");
        }
      })
      .catch(() => {
        setClients([]);
        setClientLoadError("Unable to load clients. Please try again.");
      })
      .finally(() => setIsClientsLoading(false));

    if (clientId !== null) {
      activeClientId.current = clientId;
      void loadContracts(clientId);
    }
  }, [clientId, hasSessionCredentials, loadContracts, sessionData]);

  const handleClientChange = (selectedClientId: number) => {
    activeClientId.current = selectedClientId;
    setContracts(contractCache.current.get(selectedClientId) ?? []);
    setContractLoadError("");
    void loadContracts(selectedClientId);
  };

  const handleClientSave = (selectedClientId: number, selectedContractId: number) => {
    const clientName =
      clients.find((c) => c.Id === selectedClientId)?.ClientName ?? "";
    const contractName =
      contracts.find((c) => c.Id === selectedContractId)?.Name ?? "";
    saveClientSelection(selectedClientId, selectedContractId, clientName, contractName);
    setIsClientSelectionOpen(false);
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen overflow-scroll scrollbar-hide">
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-hidden bg-bgcolor">
            <Header
              onClientContractClick={() => setIsClientSelectionOpen(true)}
            />
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {needsClientSelection ? null : <AppRoutes />}
              <ToastContainer />
            </div>
          </main>
        </div>
        {showModal && (
          <ClientSelectionModal
            isOpen={showModal}
            clients={clients}
            contracts={contracts}
            initialClientId={clientId}
            initialContractId={clientContractId}
            isClientsLoading={hasSessionCredentials && isClientsLoading}
            isContractsLoading={isContractsLoading}
            clientLoadError={
              clientLoadError ||
              (!hasSessionCredentials
                ? "Session data is unavailable. Please log in again."
                : "")
            }
            contractLoadError={contractLoadError}
            onClientChange={handleClientChange}
            onSave={handleClientSave}
          />
        )}
      </QueryClientProvider>
    </BrowserRouter>
  );
}
