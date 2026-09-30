import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { RowValidationResult } from "../../../types/salesIncentive.types";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import {
  ACTUAL_SALES_BULK_UPLOAD_PREVIEW_COLUMNS,
  ACTUAL_SALES_UPLOAD_COLUMNS,
  groupActualSalesRows,
} from "../../../config/ActualSalesBulkUpload";
import type { ActualSalesUploadRow } from "../../../types/salesIncentive.types";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import InvalidRecordsTable, {
  type InvalidRow,
} from "../../../../../shared/components/ui/DataTable/InvalidRecordsTable";
import LoaderModal from "../../../../../shared/components/ui/LoaderModal/LoaderModal";
import { useAuthStore } from "../../../../../app/store/useAuthStore";
import { handleBulkUpdateActualSales } from "../../../../../query/api";
import encrypt from "../../../../../utils/security/encrypt";
import decrypt from "../../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../../utils/security/ParseData";

interface BulkUploadLocationState {
  validRows: RowValidationResult<ActualSalesUploadRow>[];
  invalidRows: RowValidationResult<ActualSalesUploadRow>[];
}

type TabKey = "valid" | "invalid";

const ACTUAL_SALES_LIST_ROUTE = "/actualSales";

export default function ActualSalesBulkUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = useAuthStore((s) => s.sessionData);
  const state = location.state as BulkUploadLocationState | undefined;

  const [validRows, setValidRows] = useState(() =>
    (state?.validRows ?? []).map((r, i) => ({ ...r, __id: `val-${i}` })),
  );
  const [invalidRows, setInvalidRows] = useState<
    InvalidRow<ActualSalesUploadRow>[]
  >(() =>
    (state?.invalidRows ?? []).map((r, i) => ({
      __id: `inv-${i}`,
      data: r.data,
    })),
  );

  const [activeTab, setActiveTab] = useState<TabKey>(
    validRows.length > 0 || invalidRows.length === 0 ? "valid" : "invalid",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: submitActualSales } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleBulkUpdateActualSales(variables.payload, variables.token),
    onSuccess: (response: any) => {
      setIsSubmitting(false);
      if (response?.status >= 200 && response?.status < 300) {
        try {
          const decryptedData = decrypt(
            response?.data,
            sessionData?.Key ?? "",
            sessionData?.Vector ?? "",
          );
          const parsedData = parseNestedJson(JSON.parse(decryptedData));
          if (parsedData?.Status) {
            const results: any[] = parsedData?.Result ?? [];
            const failed = results.filter(
              (r: any) => r.Status === "Failed" && r.ErrorMessage,
            );
            if (failed.length > 0) {
              const successCount = results.length - failed.length;
              showToast({
                type: "error",
                title: "Partial Import",
                message: `${successCount} record(s) imported. ${failed.length} record(s) failed: ${failed.map((f: any) => f.ErrorMessage).join("; ")}`,
                duration: 5000,
              });
            } else {
              showToast({
                type: "success",
                title: "Success!",
                message:
                  parsedData?.Message ??
                  `${validRows.length} actual sales records added`,
                duration: 3000,
              });
              navigate(ACTUAL_SALES_LIST_ROUTE, {
                state: {
                  bulkUploadSuccessCount: validRows.length,
                  addedRows: validRows.map((r) => r.data),
                },
              });
            }
          } else {
            showToast({
              type: "error",
              title: "Error!",
              message: parsedData?.Message,
              duration: 3000,
            });
          }
        } catch {
          showToast({
            type: "error",
            title: "Error",
            message: "Failed to process server response. Please try again.",
            duration: 3000,
          });
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          message:
            response?.data?.message ??
            "Failed to add actual sales records. Please try again.",
          duration: 3000,
        });
      }
    },
    onError: () => {
      setIsSubmitting(false);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to add actual sales records. Please try again.",
        duration: 3000,
      });
    },
  });

  const validGroups = useMemo(
    () => groupActualSalesRows(validRows.map((r) => r.data)),
    [validRows],
  );

  const handleRemoveInvalid = (ids: string[]) =>
    setInvalidRows((prev) => prev.filter((r) => !ids.includes(r.__id)));

  const handleRowValidated = (row: ActualSalesUploadRow, id: string) => {
    setInvalidRows((prev) => prev.filter((r) => r.__id !== id));
    setValidRows((prev) => [
      ...prev,
      {
        data: row,
        __id: `val-${Date.now()}`,
        rowNumber: prev.length + 1,
        errors: [],
      },
    ]);
  };

  const handleCancel = () => navigate(ACTUAL_SALES_LIST_ROUTE);

  const handleAddRecords = () => {
    if (!sessionData?.Key || !sessionData?.Vector || !sessionData?.Token) {
      showToast({
        type: "error",
        title: "Session Error",
        message: "Session data not available. Please log in again.",
        duration: 3000,
      });
      return;
    }

    if (validRows.length === 0) return;

    setIsSubmitting(true);

    const payload = validRows.map((r) => ({
      SalesEntryId: Number(r.data.SalesEntryId) || 0,
      EmployeeCode: String(r.data["Employee Code"] ?? ""),
      EmployeeName: String(r.data["Employee Name"] ?? ""),
      DealerName: String(r.data["Dealer Name"] ?? ""),
      ManagerName: String(r.data["Manager Name"] ?? ""),
      IncentiveProduct: String(r.data.IncentiveProduct ?? ""),
      OriginalQuantity: Number(r.data["Original Quantity"]) || 0,
      ActualQuantity: Number(r.data["Actual Quantity"]) || 0,
    }));

    const encPayload = encrypt(
      JSON.stringify(payload),
      sessionData.Key,
      sessionData.Vector,
    );
    submitActualSales({ payload: encPayload, token: sessionData.Token });
  };

  if (!state) {
    return (
      <div className="px-h pt-v flex flex-col items-start gap-12">
        <p className="p-small text-gray">No file has been uploaded yet.</p>
        <CustomButton
          title="Back to Actual Sales"
          onClick={() => navigate(ACTUAL_SALES_LIST_ROUTE)}
        />
      </div>
    );
  }

  return (
    <div className="pt-12 flex flex-col h-full overflow-hidden bg-bgcolor">
      <div className="flex items-center gap-8 shrink-0 mx-24">
        <button
          onClick={handleCancel}
          className="flex items-center justify-center"
          aria-label="Back"
        >
          <IconRenderer icon="LuArrowLeft" size={18} />
        </button>
        <p className="p-small text-gray">
          Actual Sales /{" "}
          <span className="text-darkgray font-semibold">Bulk Upload</span>
        </p>
      </div>

      <div className="flex-1 min-h-0 mt-16 border-1 border-strokegray rounded-6 bg-white flex flex-col mx-24 mb-20">
        <div className="flex items-center gap-24 mt-16 border-b-1 border-strokegray px-[20px] shrink-0">
          <TabButton
            label={`Valid Records(${validRows.length})`}
            icon="FiCheckCircle"
            activeColor="text-primary"
            isActive={activeTab === "valid"}
            onClick={() => setActiveTab("valid")}
          />
          <TabButton
            label={`Invalid Records(${invalidRows.length})`}
            icon="FaRegTimesCircle"
            textColor="text-danger"
            inActiveColor="text-danger"
            activeColor="text-danger"
            isActive={activeTab === "invalid"}
            onClick={() => setActiveTab("invalid")}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[25px] pb-[25px] pt-[15px]">
          {activeTab === "valid" && (
            <GroupedIncentiveTable
              columns={ACTUAL_SALES_BULK_UPLOAD_PREVIEW_COLUMNS.filter(
                (c) => c.key !== "action",
              )}
              data={validGroups}
              emptyMessage="No valid records."
            />
          )}
          {activeTab === "invalid" && (
            <InvalidRecordsTable
              columns={ACTUAL_SALES_UPLOAD_COLUMNS}
              rows={invalidRows}
              onRemove={handleRemoveInvalid}
              onValidated={handleRowValidated}
              emptyMessage="No invalid records."
            />
          )}
        </div>
      </div>

      {activeTab === "valid" && (
        <div className="flex items-center justify-end gap-12 h-[54px] shrink-0 border-t-1 border-strokegray bg-white px-h">
          <CustomButton
            title="Cancel"
            backgroundColor="bg-white"
            textColor="text-darkgray"
            borderColor="border-strokegray"
            borderWidth="border-1"
            gap="gap-[5px]"
            height="h-[34px]"
            onClick={handleCancel}
            icon={
              <IconRenderer
                icon="FaRegTimesCircle"
                size={16}
                className="text-litegray"
              />
            }
            iconPosition="left"
            disabled={isSubmitting}
          />
          <CustomButton
            title="Add Records"
            backgroundColor="bg-primary"
            textColor="text-white"
            gap="gap-[5px]"
            height="h-[34px]"
            borderRadius="rounded-6"
            icon={
              <IconRenderer
                icon="FiCheckCircle"
                size={16}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={handleAddRecords}
            disabled={validRows.length === 0 || isSubmitting}
          />
        </div>
      )}
      {activeTab === "invalid" && (
        <div className="flex items-center justify-end gap-12 h-[54px] shrink-0 border-t-1 border-strokegray bg-white px-h">
          <CustomButton
            title="Remove"
            backgroundColor="bg-white"
            textColor="text-danger"
            borderColor="border-danger"
            borderWidth="border-1"
            gap="gap-[5px]"
            width="w-[95px]"
            height="h-[34px]"
            onClick={handleCancel}
            icon={
              <IconRenderer
                icon="FaRegTimesCircle"
                size={16}
                className="text-danger"
              />
            }
            iconPosition="left"
            disabled={isSubmitting}
          />
          <CustomButton
            title="Update"
            backgroundColor="bg-primary"
            textColor="text-white"
            gap="gap-[5px]"
            height="h-[34px]"
            borderRadius="rounded-6"
            width="w-[125px]"
            icon={
              <IconRenderer
                icon="FiCheckCircle"
                size={16}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={handleAddRecords}
            disabled={validRows.length === 0 || isSubmitting}
          />
        </div>
      )}

      <LoaderModal
        isOpen={isSubmitting}
        message="Adding actual sales records..."
      />
    </div>
  );
}

interface TabButtonProps {
  label: string;
  icon: string;
  activeColor: string;
  isActive: boolean;
  onClick: () => void;
  textColor?: string;
  inActiveColor?: string;
}

function TabButton({
  label,
  icon,
  activeColor,
  isActive,
  onClick,
  textColor = "text-primary",
  inActiveColor = "text-gray",
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-6 pb-10 text-13 font-normal ${
        isActive ? `${textColor} border-b-2` : `${inActiveColor}`
      }`}
      style={isActive ? { borderColor: activeColor } : undefined}
    >
      <IconRenderer
        icon={icon}
        size={17}
        className={`${isActive ? activeColor : inActiveColor}`}
      />
      {label}
    </button>
  );
}
