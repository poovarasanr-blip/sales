import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CustomDropdown from "../../forms/FormSelect/CustomDropdown";
import CustomButton from "../Button/CustomButton";
import { showToast } from "../CustomToast/UseToast";

interface ClientItem {
  Id: number;
  ClientName: string;
}

interface ContractItem {
  Id: number;
  Name: string;
  ClientId: number;
}

interface ClientSelectionModalProps {
  isOpen: boolean;
  clients: ClientItem[];
  contracts: ContractItem[];
  initialClientId: number | null;
  initialContractId: number | null;
  isClientsLoading: boolean;
  isContractsLoading: boolean;
  clientLoadError: string;
  contractLoadError: string;
  onClientChange: (clientId: number) => void;
  onSave: (clientId: number, clientContractId: number) => void;
}

export default function ClientSelectionModal({
  isOpen,
  clients,
  contracts,
  initialClientId,
  initialContractId,
  isClientsLoading,
  isContractsLoading,
  clientLoadError,
  contractLoadError,
  onClientChange,
  onSave,
}: ClientSelectionModalProps) {
  const [selectedClientId, setSelectedClientId] = useState(
    initialClientId === null ? "" : String(initialClientId),
  );
  const [selectedContractId, setSelectedContractId] = useState(
    initialContractId === null ? "" : String(initialContractId),
  );

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const clientOptions = clients.map((c) => ({
    label: c.ClientName,
    value: String(c.Id),
  }));

  const filteredContracts = selectedClientId
    ? contracts.filter((c) => c.ClientId === Number(selectedClientId))
    : [];

  const handleClientChange = (value: string) => {
    setSelectedClientId(value);
    setSelectedContractId("");
    if (value) onClientChange(Number(value));
  };

  const handleSave = () => {
    if (!selectedClientId) {
      showToast({
        type: "error",
        title: "Validation",
        message: "Please select a Client.",
        duration: 3000,
      });
      return;
    }
    if (!selectedContractId) {
      showToast({
        type: "error",
        title: "Validation",
        message: "Please select a Client Contract.",
        duration: 3000,
      });
      return;
    }
    onSave(Number(selectedClientId), Number(selectedContractId));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(16, 24, 40, 0.55)" }}
    >
      <div className="bg-white rounded-12 w-[480px] shadow-xl">
        <div className="px-24 pt-24 pb-16 border-b border-strokegray">
          <p className="text-16 font-semibold text-darkgray">
            Select Client & Contract
          </p>
          <p className="text-13 text-gray mt-4">
            Please select a client and contract to continue.
          </p>
        </div>

        <div className="px-24 py-20 flex flex-col gap-16">
          <CustomDropdown
            label="Client Name"
            placeholder={
              isClientsLoading ? "Loading clients..." : "Select a client"
            }
            options={clientOptions}
            value={selectedClientId}
            onChange={handleClientChange}
            disabled={isClientsLoading}
            borderColor="border-strokegray"
            borderRadius="rounded-4"
            borderWidth="border-1"
            titleTextColor="text-darkgray"
          />
          {clientLoadError && (
            <p className="text-12 text-danger" role="alert">
              {clientLoadError}
            </p>
          )}

          <CustomDropdown
            label="Client Contract Name"
            placeholder={
              isContractsLoading
                ? "Loading contracts..."
                : selectedClientId
                  ? "Select a contract"
                  : "Select a client first"
            }
            options={filteredContracts.map((contract) => ({
              label: contract.Name,
              value: String(contract.Id),
            }))}
            value={selectedContractId}
            onChange={setSelectedContractId}
            disabled={!selectedClientId || isContractsLoading}
            borderColor="border-strokegray"
            borderRadius="rounded-4"
            borderWidth="border-1"
            titleTextColor="text-darkgray"
          />
          {contractLoadError && (
            <p className="text-12 text-danger" role="alert">
              {contractLoadError}
            </p>
          )}
        </div>

        <div className="px-24 pb-24 flex justify-end">
          <CustomButton
            title="Save"
            backgroundColor="bg-primary"
            textColor="text-white"
            height="h-[37px]"
            width="w-[100px]"
            onClick={handleSave}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
