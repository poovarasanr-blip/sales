import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import Config from "../../../../../assets/json/Config.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDatePicker from "../../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import CustomDropdown from "../../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomInput from "../../../../../shared/components/forms/FormInput/CustomTextInput";
import NoDataFound from "../../../../../shared/components/ui/NoDataFound/NoDataFound";
import BulkUploadCard from "../../../../../shared/components/ui/BulkUpload/BulkUploadCard";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import LoaderModal from "../../../../../shared/components/ui/LoaderModal/LoaderModal";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import { generateSampleFile } from "../../../../../shared/utils/BulkuploadUtils";
import { useBulkUpload } from "../../../hooks/Usebulkupload";
import {
  ACTUAL_SALES_UPLOAD_COLUMNS,
  ACTUAL_SALES_TABLE_COLUMNS,
  groupActualSalesRows,
  buildActualSalesEmployeeDetail,
} from "../../../config/ActualSalesBulkUpload";
import {
  parseWorkbook,
  readFileAsArrayBuffer,
} from "../../../../../shared/utils/BulkuploadUtils";
import { useAuthStore } from "../../../../../app/store/useAuthStore";
import { useClientSessionStore } from "../../../../../app/store/useClientSessionStore";
import {
  handleGetProductBulkTemplate,
  handleGetApprovedSalesDetails,
} from "../../../../../query/api";
import encrypt from "../../../../../utils/security/encrypt";
import decrypt from "../../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../../utils/security/ParseData";
import SampleDownloadModal from "../../EmployeeSalesTarget/SampleDownloadModal";
import type { SearchField } from "../../EmployeeSalesTarget/SampleDownloadModal";
import type {
  ActualSalesUploadRow,
  ActualSalesEmployeeDetail,
} from "../../../types/salesIncentive.types";
import ActualSalesDetailModal from "../ActualSalesDetail/ActualSalesDetail";

interface ActualSalesListLocationState {
  bulkUploadSuccessCount?: number;
}

const ACTUAL_SALES_BULK_UPLOAD_ROUTE = "/actualSales/bulkUpload";
const ACTUAL_SALES_PAGE_SIZE = 10;

function mapApprovedSalesRows(
  records: Record<string, unknown>[],
): ActualSalesUploadRow[] {
  return records.map((record) => ({
    SalesEntryId: (record.Id ?? record.SalesEntryDetailsId) as number | string,
    EmployeeId: record.EmployeeId as number | string,
    "Employee Code": (record.EmployeeCode ?? "") as number | string,
    "Employee Name": String(record.EmployeeName ?? ""),
    "Dealer Name": String(record.DealerName ?? ""),
    ManagerCode: String(record.ManagerCode ?? ""),
    "Manager Name": String(record.ManagerName ?? ""),
    IncentiveSubCategory: String(record.IncentiveProductSubCategory ?? ""),
    IncentiveProduct: String(record.IncentiveProduct ?? ""),
    "Actual Quantity": Number(record.ApprovedQuantity) || 0,
  }));
}

export default function ActualSalesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = useAuthStore((s) => s.sessionData);
  const managers = useAuthStore((s) => s.Managers);
  const clientId = useClientSessionStore((s) => s.clientId);
  const clientContractId = useClientSessionStore((s) => s.clientContractId);
  const [actualSalesTemplate, setActualSalesTemplate] = useState<any>(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, any>[]>([]);
  const now = new Date();
  const [apiMonth, setApiMonth] = useState(now.getMonth() + 1);
  const [apiYear, setApiYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<ActualSalesUploadRow[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(true);
  const processedNavKeyRef = useRef<string | null>(null);
  const initialRequestKeyRef = useRef<string | null>(null);
  const [appliedMonth, setAppliedMonth] = useState(() =>
    now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  );
  const [appliedManager, setAppliedManager] = useState<string>("0");
  const [monthDraft, setMonthDraft] = useState<Date | null>(now);
  const [managerDraft, setManagerDraft] = useState<string>("0");
  const [searchTerm, setSearchTerm] = useState("");

  const { mutate: fetchApprovedSales, isPending: isLoadingApprovedSales } =
    useMutation({
      mutationFn: (variables: {
        month: number;
        year: number;
        managerId: number;
      }) => {
        if (
          clientId === null ||
          clientContractId === null ||
          !sessionData?.Key ||
          !sessionData.Vector ||
          !sessionData.Token
        ) {
          throw new Error("Sales session is not ready.");
        }
        return handleGetApprovedSalesDetails(
          variables.month,
          variables.year,
          clientId,
          clientContractId,
          variables.managerId,
          sessionData.Key,
          sessionData.Vector,
          sessionData.Token,
        );
      },
      onSuccess: (records) => setRows(mapApprovedSalesRows(records)),
      onError: () => {
        setRows([]);
        showToast({
          type: "error",
          title: "Unable to load actual sales",
          message: "Something went wrong. Please try again.",
          duration: 3000,
        });
      },
    });

  const fetchSales = useCallback(
    (month: number, year: number, managerId: number) => {
      if (clientId === null || clientContractId === null) return;
      fetchApprovedSales({ month, year, managerId });
    },
    [clientId, clientContractId, fetchApprovedSales],
  );

  const monthLabel = useCallback((date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const { uploadingFile, fileError, startUpload } =
    useBulkUpload<ActualSalesUploadRow>(ACTUAL_SALES_UPLOAD_COLUMNS);

  const { mutate: fetchBulkTemplate } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleGetProductBulkTemplate(variables.payload, variables.token),
    onSuccess: (response: any) => {
      if (response?.status === 200) {
        const decryptedData = decrypt(
          response?.data,
          sessionData?.Key,
          sessionData?.Vector,
        );
        const parsedData = parseNestedJson(JSON.parse(decryptedData));
        const templateData = parsedData?.dynamicObject[0];
        setActualSalesTemplate(templateData);
      }
    },
  });

  useEffect(() => {
    if (sessionData?.Key && sessionData?.Vector && sessionData?.Token) {
      const encPayload = encrypt(
        JSON.stringify((Config as any).ActualSalesBulkConfig),
        sessionData.Key,
        sessionData.Vector,
      );
      const stdBase64 = encPayload.replace(/\*/g, "+").replace(/-/g, "/");
      fetchBulkTemplate({
        payload: stdBase64,
        token: sessionData.Token,
      });
    }
  }, []);

  // Detail drawer state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] =
    useState<ActualSalesEmployeeDetail | null>(null);

  const managerOptions = useMemo(
    () => [
      { label: "All", value: "0" },
      ...managers.flatMap((manager) => {
        if (!manager || typeof manager !== "object") return [];
        const record = manager as Record<string, unknown>;
        if (record.ManagerId === null || record.ManagerId === undefined)
          return [];
        return [
          {
            value: String(record.ManagerId),
            label: String(record.ManagerName ?? ""),
          },
        ];
      }),
    ],
    [managers],
  );

  useEffect(() => {
    if (
      clientId === null ||
      clientContractId === null ||
      !sessionData?.Key ||
      !sessionData.Vector ||
      !sessionData.Token
    )
      return;
    const requestKey = `${clientId}:${clientContractId}:${sessionData.Token}`;
    if (initialRequestKeyRef.current === requestKey) return;
    initialRequestKeyRef.current = requestKey;
    fetchSales(apiMonth, apiYear, 0);
  }, [
    apiMonth,
    apiYear,
    clientId,
    clientContractId,
    fetchSales,
    sessionData?.Key,
    sessionData?.Token,
    sessionData?.Vector,
  ]);

  useEffect(() => {
    const incoming = location.state as ActualSalesListLocationState | undefined;
    if (incoming?.bulkUploadSuccessCount === undefined) return;
    if (processedNavKeyRef.current === location.key) return;
    processedNavKeyRef.current = location.key;
    showToast({
      type: "success",
      title: "Success!",
      message: `${incoming.bulkUploadSuccessCount} actual sales records added`,
      duration: 3000,
    });
    fetchSales(apiMonth, apiYear, Number(appliedManager) || 0);
    navigate(location.pathname, { replace: true, state: null });
  }, [
    apiMonth,
    apiYear,
    appliedManager,
    fetchSales,
    location.key,
    location.pathname,
    location.state,
    navigate,
  ]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const haystack =
          `${row["Employee Name"]} ${row["Employee Code"]} ${row["Manager Name"]} ${row.IncentiveSubCategory} ${row.IncentiveProduct}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, searchTerm]);

  const employeeGroups = useMemo(
    () => groupActualSalesRows(filteredRows),
    [filteredRows],
  );

  const handleGetResults = useCallback(() => {
    const selectedDate = monthDraft ?? new Date();
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();
    setApiMonth(month);
    setApiYear(year);
    setAppliedMonth(monthLabel(selectedDate));
    setAppliedManager(managerDraft);
    fetchSales(month, year, Number(managerDraft) || 0);
  }, [
    fetchSales,
    managerDraft,
    monthDraft,
    monthLabel,
    setApiMonth,
    setApiYear,
    setAppliedManager,
    setAppliedMonth,
  ]);

  const handleClearFilters = useCallback(() => {
    const current = new Date();
    setMonthDraft(current);
    setManagerDraft("0");
  }, [setManagerDraft, setMonthDraft]);

  const searchFields: SearchField[] = useMemo(
    () =>
      actualSalesTemplate?.CreateExcelConfiguration?.SearchConfiguration
        ?.SearchElementList ?? [],
    [actualSalesTemplate],
  );

  const handleSampleDownload = useCallback(() => {
    setShowSampleModal(true);
  }, []);

  const handleUserSelect = useCallback((users: Record<string, any>[]) => {
    setSelectedUsers(users);
  }, []);

  const handleDownloadExcel = useCallback(() => {
    generateSampleFile(
      ACTUAL_SALES_UPLOAD_COLUMNS,
      filteredRows,
      "Actual_Sales.xlsx",
      "ActualSales",
    );
  }, [filteredRows]);

  const handleFilesReceived = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;

      try {
        const buffer = await readFileAsArrayBuffer(file);
        const result = parseWorkbook<ActualSalesUploadRow>(
          buffer,
          ACTUAL_SALES_UPLOAD_COLUMNS,
        );

        if (result.headerErrors.length > 0) {
          console.log(
            "[ActualSales] Header validation errors:",
            result.headerErrors,
          );
          showToast({
            type: "error",
            title: "Invalid Template",
            message: result.headerErrors.join(" "),
            duration: 5000,
          });
          return;
        }

        console.log("[ActualSales] Extracted valid rows:", result.validRows);
        console.log(
          "[ActualSales] Extracted invalid rows:",
          result.invalidRows,
        );
        console.log(
          "[ActualSales] Summary — valid:",
          result.validRows.length,
          "| invalid:",
          result.invalidRows.length,
        );

        navigate(ACTUAL_SALES_BULK_UPLOAD_ROUTE, {
          state: {
            validRows: result.validRows,
            invalidRows: result.invalidRows,
          },
        });
      } catch {
        showToast({
          type: "error",
          title: "Upload Failed",
          message:
            "Could not read the file. It may be corrupted or in an unsupported format.",
          duration: 5000,
        });
      }
    },
    [navigate],
  );

  const handleBrowseClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) handleFilesReceived(target.files);
    };
    input.click();
  }, [handleFilesReceived]);

  // Builds the per-product breakdown for one employee straight from the
  // already-loaded `rows`, filtered to the currently applied month (if any).
  const handleDetailedSales = useCallback(
    (employeeCode: string) => {
      const detail = buildActualSalesEmployeeDetail(rows, employeeCode);
      setSelectedDetail(detail);
      setDetailModalOpen(true);
    },
    [rows],
  );

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedDetail(null);
  }, []);

  const hasData = rows.length > 0;

  return (
    <div className="px-h pt-12 overflow-scroll scrollbar-hide bg-bgcolor flex flex-col h-[100%] relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-heading-6 text-darkgray">
          {PageLayOut?.ActualSales?.PageTitle}
        </p>
        {PageLayOut?.ActualSales?.IsBulkUploadRequired && (
          <CustomButton
            backgroundColor="bg-white"
            height="h-37"
            width="w-[119px]"
            gap="gap-[7px]"
            title={PageLayOut?.ActualSales?.CustomButtons?.UploadButton?.Name}
            borderRadius="rounded-6"
            borderColor={"border-primary"}
            textColor={"text-primary"}
            borderWidth="border-1"
            icon={
              <IconRenderer
                icon={
                  PageLayOut?.ActualSales?.CustomButtons?.UploadButton?.Icon
                }
                size={16}
                className="text-primary"
              />
            }
            iconPosition="left"
            onClick={handleBrowseClick}
          />
        )}
      </div>

      {/* Filter card */}
      {PageLayOut?.ActualSales?.Filters && (
        <div className="py-16 px-16 bg-white shadow-card-xl rounded-6 mt-10">
          <div className="flex justify-between items-center">
            <p className="text-heading-6 text-black">
              {PageLayOut?.ActualSales?.Filters?.Title}
            </p>
            <div
              className={`w-[24px] h-[24px] rounded-full bg-strokegray items-center justify-center flex cursor-pointer transition-transform duration-300 ease-in-out ${!showFilter ? "rotate-180" : "rotate-0"}`}
            >
              <IconRenderer
                icon="MdKeyboardArrowUp"
                size={16}
                className="text-gray"
                onClick={() => setShowFilter((pre) => !pre)}
              />
            </div>
          </div>
          {showFilter && (
            <div className="border-t border-strokegray pt-12 mt-12 flex justify-between items-end">
              <div className="flex gap-5 items-center">
                <CustomDatePicker
                  backgroundColor="bg-white"
                  borderRadious="rounded-4"
                  borderWidth="border-1"
                  height="h-[37px]"
                  borderColor="text-strokegray"
                  width="w-[288px]"
                  icon="LuCalendar"
                  iconSize={20}
                  placeholder="Please select the date"
                  textColor="text-darkgray"
                  textSize="text-13"
                  textWeight="font-normal"
                  title="Month"
                  value={monthDraft}
                  onChange={(date: Date | null) => setMonthDraft(date)}
                  monthYearOnly
                />
                <div className="w-[288px]">
                  <CustomDropdown
                    borderColor="text-strokegray"
                    options={managerOptions}
                    value={managerDraft}
                    onChange={setManagerDraft}
                    borderRadius="rounded-4"
                    borderWidth="border-1"
                    label="Managers"
                    titleTextColor="text-darkgray"
                  />
                </div>
              </div>
              <div className="flex gap-10">
                <CustomButton
                  icon={
                    <IconRenderer
                      icon="MdOutlineClose"
                      size={14}
                      className="text-gray"
                    />
                  }
                  title="Clear"
                  height="h-[37px]"
                  backgroundColor="bg-strokegray"
                  textColor="text-gray"
                  width="w-[79px]"
                  gap="gap-[6px]"
                  onClick={handleClearFilters}
                />
                <CustomButton
                  icon={
                    <IconRenderer
                      icon="FiSearch"
                      size={14}
                      className="text-white"
                    />
                  }
                  title="Get Results"
                  height="h-[37px]"
                  backgroundColor="bg-primary"
                  textColor="text-white"
                  width="w-[117px]"
                  gap="gap-[6px]"
                  onClick={handleGetResults}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {hasData ? (
        <div className="flex-1 border-1 border-strokegray rounded-6 bg-white mt-10 mb-14 px-16 flex flex-col">
          <div className="flex items-center justify-between mt-14">
            <p className="p-small-bold text-darkgray">
              {appliedMonth || "All months"}
            </p>
            <div className="flex items-center gap-10">
              <div className="w-[280px]">
                <CustomInput
                  rightIcon="FiSearch"
                  placeholder="Search..."
                  height={"h-[37px]"}
                  rightIconStyle="text-gray"
                  inputTextSize="text-13"
                  inputTextColor="text-black"
                  inputTextWeight="font-normal"
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e)}
                />
              </div>
              <CustomButton
                title="Download Excel"
                backgroundColor="bg-primary"
                textColor="text-white"
                height="h-37"
                gap="gap-[10px]"
                icon={
                  <IconRenderer
                    icon="LuDownload"
                    size={15}
                    className="text-white"
                  />
                }
                iconPosition="left"
                onClick={handleDownloadExcel}
              />
            </div>
          </div>

          <div className="flex-1 mt-14">
            <GroupedIncentiveTable
              columns={ACTUAL_SALES_TABLE_COLUMNS}
              data={employeeGroups}
              emptyMessage="No records found."
              pagination
              showVerticalLines={true}
              hideSubRowBorders={true}
              pageSize={ACTUAL_SALES_PAGE_SIZE}
              renderCustomCell={(column, employee, subCategory) => {
                if (column.key === "manager") {
                  return (
                    <div>
                      <p className="text-13 text-darkgray">
                        {employee.managerName || "—"}
                      </p>
                      {employee.managerCode && (
                        <p className="text-11 text-gray">
                          {employee.managerCode}
                        </p>
                      )}
                    </div>
                  );
                }
                if (column.key === "effectiveDate") {
                  return subCategory.actual ?? 0;
                }
                if (column.key === "action") {
                  return (
                    <button
                      type="button"
                      className="text-secondary text-13 font-normal flex items-center gap-4"
                      onClick={() =>
                        handleDetailedSales(
                          employee.employeeId || employee.employeeCode || "",
                        )
                      }
                    >
                      Detailed Sales
                      <IconRenderer
                        icon="MdKeyboardDoubleArrowRight"
                        size={16}
                      />
                    </button>
                  );
                }
                return undefined;
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-6 items-center justify-center flex flex-1 flex-col border border-strokegray mt-10 mb-14">
          <NoDataFound
            description={PageLayOut?.ActualSales?.NoDataFound?.SubTitle}
            title={PageLayOut?.ActualSales?.NoDataFound?.Title}
          />
          <BulkUploadCard
            title={PageLayOut?.ActualSales?.BuldUploadcard?.CardTitle}
            description={PageLayOut?.ActualSales?.BuldUploadcard?.CardSubTitle}
            browseText={PageLayOut?.ActualSales?.BuldUploadcard?.UploadLabel2}
            dragDropText={PageLayOut?.ActualSales?.BuldUploadcard?.UploadLabel1}
            sampleButtonTitle={
              PageLayOut?.ActualSales?.BuldUploadcard?.DownloadButtonText
            }
            sampleButtonIcon={
              PageLayOut?.ActualSales?.BuldUploadcard?.DownloadIcon
            }
            uploadIcon={PageLayOut?.ActualSales?.BuldUploadcard?.UploadIcon}
            filesHereText={
              PageLayOut?.ActualSales?.BuldUploadcard?.UploadLabel3
            }
            onSampleDownload={handleSampleDownload}
            onBrowseClick={handleBrowseClick}
            onDrop={handleFilesReceived}
            uploadingFile={uploadingFile}
          />
          {fileError && (
            <p className="p-tiny text-red-600 mt-8 max-w-[632px] text-center">
              {fileError}
            </p>
          )}
        </div>
      )}

      <ActualSalesDetailModal
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        detail={selectedDetail}
      />

      <SampleDownloadModal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        searchFields={searchFields}
        sessionData={sessionData}
        employeeTemplate={actualSalesTemplate}
        onUserSelect={handleUserSelect}
        searchDataSourceName="GetEmployeeDetailsForSalesEntryDetails"
        downloadFileName="ApprovedSalesTemplate.xlsx"
      />
      <LoaderModal
        isOpen={isLoadingApprovedSales}
        message="Loading actual sales..."
      />
    </div>
  );
}
