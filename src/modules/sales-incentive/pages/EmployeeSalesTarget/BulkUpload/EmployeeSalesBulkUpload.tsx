import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Config from "../../../../../assets/json/Config.json";
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
import { handleImportSalesIncentiveTarget } from "../../../../../query/api";
import encrypt from "../../../../../utils/security/encrypt";
import decrypt from "../../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../../utils/security/ParseData";

/* ---- Column config from Config.json ---- */

const employeeTargetColumns: BulkUploadColumnConfig<Record<string, any>>[] = (
  (Config as any).EmployeeSalesTargetUploadColumns ?? []
).map((col: any) => ({
  key: col.apiField,
  header: col.header,
  required: col.required ?? false,
  type: (col.type as "string" | "number" | "date") ?? "string",
  groupLevel: col.groupLevel as number | undefined,
  headerIcon: col.headerIcon as string | undefined,
}));

const level1Cols = employeeTargetColumns.filter((c) => c.groupLevel === 1);
const level2Cols = employeeTargetColumns.filter((c) => c.groupLevel === 2);
const detailCols = employeeTargetColumns.filter((c) => !c.groupLevel);
const visibleDetailCols = detailCols.filter(
  (c) => c.key !== "SalesIncentiveConfigurationCode",
);
const orderedHeaderCols = [...level1Cols, ...level2Cols, ...visibleDetailCols];

/* ---- Grouping helpers ---- */

interface Level2Group {
  values: Record<string, any>;
  rows: { data: Record<string, any>; __id: string }[];
}

interface Level1Group {
  values: Record<string, any>;
  level2Groups: Level2Group[];
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
      l1Map.set(l1Key, { values, level2Groups: [], totalRows: 0 });
    }
    const l1Group = l1Map.get(l1Key)!;

    let l2Group = l1Group.level2Groups.find((g) =>
      level2Cols.every(
        (c) =>
          String(g.values[c.key as string] ?? "") ===
          String(row.data[c.key as string] ?? ""),
      ),
    );
    if (!l2Group) {
      const values: Record<string, any> = {};
      level2Cols.forEach((c) => {
        values[c.key as string] = row.data[c.key as string];
      });
      l2Group = { values, rows: [] };
      l1Group.level2Groups.push(l2Group);
    }

    l2Group.rows.push(row);
    l1Group.totalRows++;
  });

  return Array.from(l1Map.values());
}

/* ---- Month name → number ---- */

const MONTH_MAP: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function monthToNumber(val: any): number {
  if (typeof val === "number") return val;
  const num = Number(val);
  if (!Number.isNaN(num) && num >= 1 && num <= 12) return num;
  return MONTH_MAP[String(val).trim().toLowerCase()] ?? 0;
}

/* ---- Types ---- */

interface BulkUploadLocationState {
  validRows: RowValidationResult<Record<string, any>>[];
  invalidRows: RowValidationResult<Record<string, any>>[];
}

type TabKey = "valid" | "invalid";

/* ---- Main component ---- */

export default function EmployeeSalesTargetBulkUpload() {
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

  const { mutate: importTargets } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleImportSalesIncentiveTarget(variables.payload, variables.token),
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
                  `${validRows.length} employee sales target records added`,
                duration: 3000,
              });
              navigate("/employeeSales", {
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
            "Failed to add employee sales targets. Please try again.",
          duration: 3000,
        });
      }
    },
    onError: () => {
      setIsSubmitting(false);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to add employee sales targets. Please try again.",
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

  const handleCancel = () => navigate("/employeeSales");

  const handleAddEmployeeSalesTarget = () => {
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
      ...r?.data,
      EmployeeCode: r.data.EmployeeCode ?? "",
      EmployeeName: r.data.EmployeeName ?? "",
      SalesIncentiveConfigurationCode:
        r.data.SalesIncentiveConfigurationCode ?? "",
      IncentiveSubCategory: r.data.IncentiveSubCategory ?? "",
      IncentiveProduct: r.data.IncentiveProduct ?? "",
      Month: monthToNumber(r.data.Month),
      Year: Number(r.data.Year) || 0,
      IncentiveAgainstBaseTargetQuantity:
        Number(r.data.BaseTargetQuantity) || 0,
      Incentive: Number(r.data.Incentive) || 0,
      IncentiveApplicableEligibilityPercentage:
        r.data.IncentiveEligibility ?? "",
    }));

    const encPayload = encrypt(
      JSON.stringify(payload),
      sessionData.Key,
      sessionData.Vector,
    );
    importTargets({ payload: encPayload, token: sessionData.Token });
  };

  if (!state) {
    return (
      <div className="px-h pt-v flex flex-col items-start gap-12">
        <p className="p-small text-gray">No file has been uploaded yet.</p>
        <CustomButton
          title="Back to Employee Sales Target"
          onClick={() => navigate("/employeeSales")}
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
          Employee Sales Target /{" "}
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
                    {orderedHeaderCols.map((col) => (
                      <th
                        key={col.key as string}
                        className="h-[40px] px-16 py-2 sticky top-0 z-10 bg-white whitespace-nowrap text-left"
                      >
                        <div className="flex items-center gap-8">
                          <span className="text-12 font-semibold text-darkgray">
                            {col.header}
                          </span>
                          {col.headerIcon && (
                            <IconRenderer
                              icon={col.headerIcon}
                              size={14}
                              className="text-gray"
                            />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={orderedHeaderCols.length}
                        className="text-center py-20 text-gray text-13"
                      >
                        No valid records.
                      </td>
                    </tr>
                  ) : (
                    groups.map((l1Group) => {
                      let isFirstL1 = true;
                      return l1Group.level2Groups.map((l2Group) => {
                        let isFirstL2 = true;
                        return l2Group.rows.map((row) => {
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
                              {isFirstL2 &&
                                level2Cols.map((col) => (
                                  <td
                                    key={col.key as string}
                                    rowSpan={l2Group.rows.length}
                                    className="px-16 py-[11px] text-13 text-[#59596C] align-middle text-center border-r border-[#eee]"
                                  >
                                    {String(
                                      l2Group.values[col.key as string] ?? "",
                                    )}
                                  </td>
                                ))}
                              {visibleDetailCols.map((col) => (
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
                          if (isFirstL2) isFirstL2 = false;
                          return el;
                        });
                      });
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "invalid" && (
            <InvalidRecordsTable
              columns={employeeTargetColumns}
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
        {/* Invalid tab — selection controls */}
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
        {/* Valid tab — Cancel + Add */}
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
              title="Add Employee Sales"
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
              onClick={handleAddEmployeeSalesTarget}
              disabled={validRows.length === 0 || isSubmitting}
            />
          </div>
        )}
      </div>

      <LoaderModal
        isOpen={isSubmitting}
        message="Adding employee sales targets..."
      />
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
