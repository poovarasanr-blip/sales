import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type {
  RowValidationResult,
  BulkUploadColumnConfig,
} from "../../../types/salesIncentive.types";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import InvalidRecordsTable, {
  type InvalidRow,
} from "../../../../../shared/components/ui/DataTable/InvalidRecordsTable";
import LoaderModal from "../../../../../shared/components/ui/LoaderModal/LoaderModal";
import { useAuthStore } from "../../../../../app/store/useAuthStore";
import { handleImportIncentiveProduct } from "../../../../../query/api";
import encrypt from "../../../../../utils/security/encrypt";
import decrypt from "../../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../../utils/security/ParseData";
import { INCENTIVE_RATES_UPLOAD_COLUMNS } from "../../../config/IncentiveRatesConfig";

/* ---- Grouping helpers ---- */

const level1Cols = INCENTIVE_RATES_UPLOAD_COLUMNS.filter(
  (c) => c.groupLevel === 1,
);
const detailCols = INCENTIVE_RATES_UPLOAD_COLUMNS.filter(
  (c) => !c.groupLevel,
);

interface Level1Group {
  values: Record<string, any>;
  rows: { data: Record<string, any>; __id: string }[];
  totalRows: number;
}

function buildGroups(
  rows: { data: Record<string, any>; __id: string }[],
): Level1Group[] {
  const l1Map = new Map<string, Level1Group>();

  rows.forEach((row) => {
    const l1Key = level1Cols
      .map((c) => String(row.data[c.key as string] ?? ""))
      .join("||");

    if (!l1Map.has(l1Key)) {
      const values: Record<string, any> = {};
      level1Cols.forEach((c) => {
        values[c.key as string] = row.data[c.key as string];
      });
      l1Map.set(l1Key, { values, rows: [], totalRows: 0 });
    }
    const l1Group = l1Map.get(l1Key)!;
    l1Group.rows.push(row);
    l1Group.totalRows++;
  });

  return Array.from(l1Map.values());
}

/* ---- Types ---- */

interface BulkUploadLocationState {
  validRows: RowValidationResult<Record<string, any>>[];
  invalidRows: RowValidationResult<Record<string, any>>[];
}

type TabKey = "valid" | "invalid";

/* ---- Main component ---- */

export default function IncentiveRatesBulkUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BulkUploadLocationState | undefined;
  const sessionData = useAuthStore((s) => s.sessionData);

  const [validRows, setValidRows] = useState(() =>
    (state?.validRows ?? []).map((r, i) => ({ ...r, __id: `val-${i}` })),
  );
  const [invalidRows, setInvalidRows] = useState<
    InvalidRow<Record<string, any>>[]
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

  const { mutate: importProducts } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleImportIncentiveProduct(variables.payload, variables.token),
    onSuccess: (response: any) => {
      setIsSubmitting(false);
      if (response?.status >= 200 && response?.status < 300) {
        const decryptedData = decrypt(
          response?.data,
          sessionData?.Key ?? "",
          sessionData?.Vector ?? "",
        );
        const parsedData = parseNestedJson(JSON.parse(decryptedData));
        if (parsedData?.Status) {
          showToast({
            type: "success",
            title: "Success!",
            message: `${validRows.length} records have been added`,
            duration: 3000,
          });
          navigate("/incentiveRates", {
            state: {
              bulkUploadSuccessCount: validRows.length,
              addedProducts: validRows.map((r) => r.data),
            },
          });
        } else {
          showToast({
            type: "error",
            title: "Error!",
            message: parsedData?.Message,
            duration: 3000,
          });
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          message:
            response?.data?.message ??
            "Failed to add records. Please try again.",
          duration: 3000,
        });
      }
    },
    onError: () => {
      setIsSubmitting(false);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to add records. Please try again.",
        duration: 3000,
      });
    },
  });

  const [invalidSelectedCount, setInvalidSelectedCount] = useState(0);
  const invalidActionsRef = useRef<{
    removeSelected: () => void;
    updateSelected: () => void;
  } | null>(null);

  const handleInvalidSelectionChange = useCallback(
    (info: {
      count: number;
      removeSelected: () => void;
      updateSelected: () => void;
    }) => {
      setInvalidSelectedCount(info.count);
      invalidActionsRef.current = {
        removeSelected: info.removeSelected,
        updateSelected: info.updateSelected,
      };
    },
    [],
  );

  const groups = useMemo(() => buildGroups(validRows), [validRows]);

  const handleRemoveInvalid = (ids: string[]) =>
    setInvalidRows((prev) => prev.filter((r) => !ids.includes(r.__id)));

  const handleRowValidated = (row: Record<string, any>, id: string) => {
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

  const handleCancel = () => navigate("/incentiveRates");

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

    setIsSubmitting(true);

    const payload = validRows.map((r) => ({
      Category: r.data.Category ?? r.data["Category"] ?? "",
      SubCategory: r.data["Sub Category"] ?? "",
      EligibleIncentive:
        Number(r.data["Eligible Incentive"]) ||
        Number(r.data["Eligible Incentive (₹)"]) ||
        0,
      EffectiveDate: r.data["Effective Date"] ?? "",
    }));
    const encPayload = encrypt(
      JSON.stringify(payload),
      sessionData.Key,
      sessionData.Vector,
    );
    const stdBase64 = encPayload.replace(/\*/g, "+").replace(/-/g, "/");

    importProducts({ payload: stdBase64, token: sessionData.Token });
  };

  if (!state) {
    return (
      <div className="px-h pt-v flex flex-col items-start gap-12">
        <p className="p-small text-gray">No file has been uploaded yet.</p>
        <CustomButton
          title="Back to Incentive Rates"
          onClick={() => navigate("/incentiveRates")}
        />
      </div>
    );
  }

  return (
    <div className="pt-12 flex flex-col h-full overflow-hidden bg-bgcolor">
      {/* Breadcrumb */}
      <div className="flex items-center gap-8 shrink-0 mx-24">
        <button
          onClick={handleCancel}
          className="flex items-center justify-center"
          aria-label="Back"
        >
          <IconRenderer icon="LuArrowLeft" size={18} />
        </button>
        <p className="p-small text-gray">
          Incentive Rates /{" "}
          <span className="text-darkgray font-semibold">Bulk Upload</span>
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 min-h-0 mt-16 border-1 border-strokegray rounded-6 bg-white flex flex-col mx-24 mb-20">
        {/* Tabs */}
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

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-[25px] pb-[25px] pt-[15px]">
          {activeTab === "valid" && (
            <div className="rounded-4 overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#eee]">
                    {INCENTIVE_RATES_UPLOAD_COLUMNS.map((col) => (
                      <th
                        key={col.key as string}
                        className="h-[40px] px-16 py-2 sticky top-0 z-10 bg-white whitespace-nowrap text-left"
                      >
                        <span className="text-12 font-semibold text-darkgray">
                          {col.header}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={INCENTIVE_RATES_UPLOAD_COLUMNS.length}
                        className="text-center py-20 text-gray text-13"
                      >
                        No valid records.
                      </td>
                    </tr>
                  ) : (
                    groups.map((l1Group) => {
                      let isFirstL1 = true;
                      return l1Group.rows.map((row) => {
                        const el = (
                          <tr key={row.__id} className="border border-[#eee]">
                            {isFirstL1 &&
                              level1Cols.map((col) => (
                                <td
                                  key={col.key as string}
                                  rowSpan={l1Group.totalRows}
                                  className="px-16 py-[11px] text-13 text-[#59596C] align-top border-r border-[#eee]"
                                >
                                  {String(
                                    l1Group.values[col.key as string] ?? "",
                                  )}
                                </td>
                              ))}
                            {detailCols.map((col) => (
                              <td
                                key={col.key as string}
                                className="px-16 py-[11px] text-13 text-[#59596C]"
                              >
                                {String(row.data[col.key as string] ?? "")}
                              </td>
                            ))}
                          </tr>
                        );
                        if (isFirstL1) isFirstL1 = false;
                        return el;
                      });
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "invalid" && (
            <InvalidRecordsTable
              columns={INCENTIVE_RATES_UPLOAD_COLUMNS}
              rows={invalidRows}
              onRemove={handleRemoveInvalid}
              onValidated={handleRowValidated}
              emptyMessage="No invalid records."
              hideSelectionBar
              onSelectionChange={handleInvalidSelectionChange}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between h-[54px] shrink-0 border-t-1 border-strokegray bg-white px-h">
        {activeTab === "invalid" && (
          <div className="flex items-center gap-12 justify-between w-full">
            <p className="text-14 text-secondary font-medium">
              {invalidSelectedCount} records selected
            </p>
            <div className="flex items-center gap-12">
              <button
                onClick={() => invalidActionsRef.current?.removeSelected()}
                className="h-[34px] px-16 rounded-6 border border-danger text-danger text-13 flex items-center gap-6"
              >
                <IconRenderer icon="FaRegTimesCircle" size={14} />
                Remove
              </button>
              <button
                disabled={invalidSelectedCount === 0}
                onClick={() => invalidActionsRef.current?.updateSelected()}
                className="h-[34px] px-16 rounded-6 bg-primary text-white text-13 flex items-center gap-6"
              >
                <IconRenderer icon="FiCheckCircle" size={14} />
                Update
              </button>
            </div>
          </div>
        )}
        {activeTab === "valid" && (
          <div className="flex items-center w-full justify-end gap-12">
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
      </div>

      <LoaderModal isOpen={isSubmitting} message="Adding records..." />
    </div>
  );
}

/* ---- Tab button ---- */

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
