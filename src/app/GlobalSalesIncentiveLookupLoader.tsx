import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "./store/useAuthStore";
import { useClientSessionStore } from "./store/useClientSessionStore";
import { handleGetSalesIncentiveLookupDetails } from "../query/api";

export default function GlobalSalesIncentiveLookupLoader() {
  const sessionData = useAuthStore((state) => state.sessionData);
  const setSalesIncentiveLookups = useAuthStore(
    (state) => state.setSalesIncentiveLookups,
  );
  const setLookupLoading = useAuthStore((state) => state.setLookupLoading);
  const setLookupError = useAuthStore((state) => state.setLookupError);
  const clientId = useClientSessionStore((state) => state.clientId);
  const clientContractId = useClientSessionStore(
    (state) => state.clientContractId,
  );
  const lastRequestKey = useRef<string | null>(null);
  const latestRequestId = useRef(0);

  const { mutate } = useMutation({
    mutationFn: (variables: {
      clientId: number;
      clientContractId: number;
      key: string;
      vector: string;
      token: string;
      requestId: number;
    }) =>
      handleGetSalesIncentiveLookupDetails(
        variables.clientId,
        variables.clientContractId,
        variables.key,
        variables.vector,
        variables.token,
      ),
    onMutate: (variables) => {
      if (variables.requestId === latestRequestId.current) {
        setLookupLoading(true);
        setLookupError(null);
      }
    },
    onSuccess: (lookups, variables) => {
      const current = useClientSessionStore.getState();
      if (
        variables.requestId === latestRequestId.current &&
        current.clientId === variables.clientId &&
        current.clientContractId === variables.clientContractId
      ) {
        setSalesIncentiveLookups(lookups);
      }
    },
    onError: (error, variables) => {
      const current = useClientSessionStore.getState();
      if (
        variables.requestId === latestRequestId.current &&
        current.clientId === variables.clientId &&
        current.clientContractId === variables.clientContractId
      ) {
        setLookupError(
          error instanceof Error
            ? error.message
            : "Unable to load sales incentive lookups.",
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      const current = useClientSessionStore.getState();
      if (
        variables.requestId === latestRequestId.current &&
        current.clientId === variables.clientId &&
        current.clientContractId === variables.clientContractId
      ) {
        setLookupLoading(false);
      }
    },
  });

  useEffect(() => {
    if (clientId === null || clientContractId === null) {
      lastRequestKey.current = null;
      latestRequestId.current += 1;
      setLookupLoading(false);
      return;
    }
    if (!sessionData?.Key || !sessionData.Vector || !sessionData.Token) return;

    const requestKey = `${clientId}:${clientContractId}:${sessionData.Token}`;
    if (lastRequestKey.current === requestKey) return;
    lastRequestKey.current = requestKey;
    const requestId = ++latestRequestId.current;
    mutate({
      clientId,
      clientContractId,
      key: sessionData.Key,
      vector: sessionData.Vector,
      token: sessionData.Token,
      requestId,
    });
  }, [
    clientId,
    clientContractId,
    mutate,
    sessionData?.Key,
    sessionData?.Token,
    sessionData?.Vector,
    setLookupLoading,
  ]);

  return null;
}
