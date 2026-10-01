import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import PageLayOut from "../../../../assets/json/pageLayout/pageLayout.json";
import Config from "../../../../assets/json/Config.json";
import CustomButton from "../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDatePicker from "../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import CustomDropdown from "../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomInput from "../../../../shared/components/forms/FormInput/CustomTextInput";
import NoDataFound from "../../../../shared/components/ui/NoDataFound/NoDataFound";
import BulkUploadCard from "../../../../shared/components/ui/BulkUpload/BulkUploadCard";
import GroupedIncentiveTable from "../../../../shared/components/ui/DataTable/CustomTable";
import { showToast } from "../../../../shared/components/ui/CustomToast/UseToast";
import { generateSampleFile } from "../../../../shared/utils/BulkuploadUtils";
import { useBulkUpload } from "../../hooks/Usebulkupload";
import { useImportSalesIncentiveTarget } from "../../hooks/UseImportSalesIncentiveTarget";
import {
  EMPLOYEE_TARGET_UPLOAD_COLUMNS,
  EMPLOYEE_TARGET_TABLE_COLUMNS,
  groupEmployeeTargetRows,
} from "../../config/EmployeeSalesTargetBulkUpload";
import { useAuthStore } from "../../../../app/store/useAuthStore";
import { useClientSessionStore } from "../../../../app/store/useClientSessionStore";
import {
  handleGetProductBulkTemplate,
  handleGetExcelTemplate,
  handleGetSalesIncentiveTargetConfigurationDetails,
} from "../../../../query/api";
import encrypt from "../../../../utils/security/encrypt";
import decrypt from "../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../utils/security/ParseData";
import { downloadExcelFromBase64 } from "../../../../shared/utils/downloadExcel";
import SampleDownloadModal from "./SampleDownloadModal";
import type { SearchField } from "./SampleDownloadModal";
import EmployeeSalesTargetUpdateModal from "./EmployeeSalesTargetUpdateModal";
import LoaderModal from "../../../../shared/components/ui/LoaderModal/LoaderModal";
import type {
  CategoryGroup,
  GroupedTableColumn,
  SubCategoryGroup,
} from "../../types/salesIncentive.types";

interface EmployeeTargetListLocationState {
  bulkUploadSuccessCount?: number;
}

const EMPLOYEE_TARGET_BULK_UPLOAD_ROUTE = "/employeeSalesTarget/bulkUpload";
const EMPLOYEE_TARGET_PAGE_SIZE = 10;

export default function EmployeeSalesTarget() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = useAuthStore((s) => s.sessionData);
  const managers = useAuthStore((s) => s.Managers);
  const clientId = useClientSessionStore((s) => s.clientId);
  const clientContractId = useClientSessionStore((s) => s.clientContractId);
  const [employeeTemplate, setEmployeeTemplate] = useState<any>([]);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, any>[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<Record<string, any>[]>([]);
  const currentDate = new Date();
  const [apiMonth, setApiMonth] = useState(currentDate.getMonth() + 1);
  const [apiYear, setApiYear] = useState(currentDate.getFullYear());
  const [appliedMonth, setAppliedMonth] = useState(() =>
    currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  );
  const [monthDraft, setMonthDraft] = useState<Date | null>(currentDate);
  const [managerDraft, setManagerDraft] = useState<string | number>(0);
  const [appliedManager, setAppliedManager] = useState<string>("");
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState<boolean>(true);
  const processedNavKeyRef = useRef<string | null>(null);
  const initialLoadHandledRef = useRef(false);

  const { uploadingFile, fileError, startUpload } = useBulkUpload<
    Record<string, any>
  >(EMPLOYEE_TARGET_UPLOAD_COLUMNS);

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
        setEmployeeTemplate(parsedData?.dynamicObject[0]);
      }
    },
  });

  const downloadExcelTemplate = (response: any) => {
    const base64 = response?.dynamicObject;
    if (!base64) return;
    downloadExcelFromBase64(base64, "EmployeeSalesTargetTemplate.xlsx");
  };

  const { mutate: fetchExcelTemplate } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleGetExcelTemplate(variables.payload, variables.token),
    onSuccess: (response: any) => {
      if (response?.status === 200) {
        const decryptedData = decrypt(
          response?.data,
          sessionData?.Key,
          sessionData?.Vector,
        );
        const parsedData = parseNestedJson(JSON.parse(decryptedData));
        console.log(parsedData, "parsedData");
        downloadExcelTemplate(parsedData);
      }
    },
  });

  useEffect(() => {
    if (sessionData?.Key && sessionData?.Vector && sessionData?.Token) {
      const encPayload = encrypt(
        JSON.stringify(Config.EmployeeSalesTargetBulkConfig),
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

  const monthLabel = useCallback((d: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const managerOptions = useMemo(() => {
    return managers.flatMap((manager) => {
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
    });
  }, [managers]);

  const { mutate: fetchEmployeeTargets, isPending } = useMutation({
    mutationFn: (variables: {
      month: number;
      year: number;
      managerId: number;
      clientId: number;
      clientContractId: number;
      key: string;
      vector: string;
      token: string;
    }) =>
      handleGetSalesIncentiveTargetConfigurationDetails(
        variables.month,
        variables.year,
        variables.clientId,
        variables.clientContractId,
        variables.managerId,
        variables.key,
        variables.vector,
        variables.token,
      ),
    onSuccess: (data) => {
      setRows(data);
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to load employee sales targets",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        duration: 3000,
      });
    },
  });

  const fetchTargets = useCallback(
    (month: number, year: number, managerId: number) => {
      if (
        clientId === null ||
        clientContractId === null ||
        !sessionData?.Key ||
        !sessionData.Vector ||
        !sessionData.Token
      ) {
        return;
      }
      fetchEmployeeTargets({
        month,
        year,
        managerId,
        clientId,
        clientContractId,
        key: sessionData.Key,
        vector: sessionData.Vector,
        token: sessionData.Token,
      });
    },
    [clientId, clientContractId, fetchEmployeeTargets, sessionData],
  );

  useEffect(() => {
    if (location.state) {
      initialLoadHandledRef.current = true;
      return;
    }
    if (initialLoadHandledRef.current) return;
    if (clientId === null || clientContractId === null || !sessionData?.Token)
      return;
    initialLoadHandledRef.current = true;
    const now = new Date();
    fetchTargets(now.getMonth() + 1, now.getFullYear(), 0);
  }, [
    clientId,
    clientContractId,
    fetchTargets,
    location.state,
    sessionData?.Token,
  ]);

  useEffect(() => {
    const incoming = location.state as
      | EmployeeTargetListLocationState
      | undefined;
    if (incoming?.bulkUploadSuccessCount === undefined) return;
    if (processedNavKeyRef.current === location.key) return;
    processedNavKeyRef.current = location.key;

    showToast({
      type: "success",
      title: "Success!",
      message: `${incoming.bulkUploadSuccessCount} records has been added`,
      duration: 3000,
    });
    fetchTargets(apiMonth, apiYear, Number(appliedManager) || 0);
    navigate(location.pathname, { replace: true, state: null });
  }, [
    apiMonth,
    apiYear,
    appliedManager,
    fetchTargets,
    location.key,
    location.pathname,
    location.state,
    navigate,
  ]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (Number(row.Status) === 0) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const haystack =
          `${row.EmployeeName} ${row.EmployeeCode} ${row.ManagerName ?? ""} ${row.IncentiveProductSubCategory ?? row.IncentiveSubCategory ?? ""} ${row.IncentiveProduct ?? ""} ${row.IncentiveEligibility ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, searchTerm]);

  const employeeGroups = useMemo(
    () => groupEmployeeTargetRows(filteredRows),
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
    fetchTargets(month, year, Number(managerDraft) || 0);
  }, [
    fetchTargets,
    managerDraft,
    monthDraft,
    monthLabel,
    setApiMonth,
    setApiYear,
    setAppliedManager,
    setAppliedMonth,
  ]);

  const handleEmployeeTargetsImported = useCallback(() => {
    setEditModalOpen(false);
    fetchTargets(apiMonth, apiYear, Number(appliedManager) || 0);
  }, [apiMonth, apiYear, appliedManager, fetchTargets]);
  const { importTargets, isPending: isSaving } = useImportSalesIncentiveTarget({
    onImported: handleEmployeeTargetsImported,
  });

  const handleSaveEmployeeTargets = useCallback(
    (updatedRecords: Record<string, any>[]) => {
      if (!sessionData?.Key || !sessionData.Vector || !sessionData.Token) {
        showToast({
          type: "error",
          title: "Session Error",
          message: "Session data not available. Please log in again.",
          duration: 3000,
        });
        return;
      }

      const payload = encrypt(
        JSON.stringify(updatedRecords),
        sessionData.Key,
        sessionData.Vector,
      );
      importTargets({
        payload,
        token: sessionData.Token,
        recordCount: updatedRecords.length,
      });
    },
    [importTargets, sessionData],
  );

  const handleClearFilters = useCallback(() => {
    const current = new Date();
    const month = current.getMonth() + 1;
    const year = current.getFullYear();
    setMonthDraft(current);
    setAppliedMonth(monthLabel(current));
    setManagerDraft("0");
    setAppliedManager("");
    setApiMonth(month);
    setApiYear(year);
    fetchTargets(month, year, 0);
  }, [
    fetchTargets,
    monthLabel,
    setApiMonth,
    setApiYear,
    setAppliedManager,
    setAppliedMonth,
    setManagerDraft,
    setMonthDraft,
  ]);

  const renderCustomCell = useCallback(
    (
      column: GroupedTableColumn,
      category: CategoryGroup,
      subCategory: SubCategoryGroup,
    ): React.ReactNode => {
      if (column.key === "category") {
        return (
          <div>
            <p className="text-13 font-semibold text-[#31314D]">
              {category.category}
            </p>
            {category.employeeCode && (
              <p className="text-11 text-[#8E8EA9] mt-1">
                {category.employeeCode}
                {category.storeName ? ` • ${category.storeName}` : ""}
              </p>
            )}
          </div>
        );
      }
      if (column.key === "manager") {
        return (
          <div>
            <p className="text-13 font-medium text-[#31314D]">
              {category.managerName || "—"}
            </p>
            {category.managerCode && (
              <p className="text-11 text-[#8E8EA9] mt-1">
                {category.managerCode}
              </p>
            )}
          </div>
        );
      }
      if (column.key === "action") {
        return (
          <div className="flex items-center gap-10 justify-center">
            <button
              className="text-[#8E8EA9] hover:text-[#EF4444] transition-colors"
              aria-label="Delete"
              onClick={() => {
                console.log(category, subCategory, "category");
              }}
            >
              <IconRenderer icon="FiTrash2" size={15} />
            </button>
            <button
              className="text-[#8E8EA9] hover:text-primary transition-colors"
              aria-label="Edit"
              onClick={() => {
                setDetailsData(
                  rows.filter(
                    (row) =>
                      String(row.EmployeeId ?? "") ===
                        String(category.employeeId ?? "") ||
                      String(row.EmployeeCode ?? "") ===
                        String(category.employeeCode ?? ""),
                  ),
                );
                setEditModalOpen(true);
              }}
            >
              <IconRenderer icon="FiEdit2" size={15} />
            </button>
          </div>
        );
      }
      return undefined;
    },
    [rows],
  );

  const searchFields: SearchField[] = useMemo(
    () =>
      employeeTemplate?.CreateExcelConfiguration?.SearchConfiguration
        ?.SearchElementList ?? [],
    [employeeTemplate],
  );

  const handleSampleDownload = useCallback(() => {
    setShowSampleModal(true);
  }, []);

  const handleUserSelect = useCallback((users: Record<string, any>[]) => {
    setSelectedUsers(users);
  }, []);

  const handleDownloadExcel = useCallback(() => {
    generateSampleFile(
      EMPLOYEE_TARGET_UPLOAD_COLUMNS,
      filteredRows,
      "Employee_Sales_Target.xlsx",
      "EmployeeSalesTarget",
    );
  }, [filteredRows]);

  const handleFilesReceived = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;

      const result = await startUpload(file);
      if (!result) return;

      const validAfter: typeof result.validRows = [];
      const invalidAfter = [...result.invalidRows];

      result.validRows.forEach((row) => {
        const errors: string[] = [];
        EMPLOYEE_TARGET_UPLOAD_COLUMNS.forEach((col) => {
          const val = row.data[col.key as string];
          if (val === undefined || val === null || String(val).trim() === "") {
            errors.push(`${col.header} is required`);
          }
        });
        if (errors.length > 0) {
          invalidAfter.push({ ...row, errors });
        } else {
          validAfter.push(row);
        }
      });

      navigate(EMPLOYEE_TARGET_BULK_UPLOAD_ROUTE, {
        state: { validRows: validAfter, invalidRows: invalidAfter },
      });
    },
    [startUpload, navigate],
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

  const hasData = rows.length > 0;

  return (
    <div className="px-h pt-12 overflow-scroll scrollbar-hide bg-bgcolor flex flex-col h-[100%] relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-heading-6 text-darkgray">
          {PageLayOut?.EmployeeSalesTarget?.PageTitle}
        </p>
        {PageLayOut?.EmployeeSalesTarget?.IsBulkUploadRequired && (
          <CustomButton
            backgroundColor="bg-primary"
            height="h-37"
            width="w-[119px]"
            gap="gap-[5px]"
            title={
              PageLayOut?.EmployeeSalesTarget?.CustomButtons?.UploadButton?.Name
            }
            borderRadius="rounded-6"
            borderColor={"border-primary"}
            textColor={"text-white"}
            borderWidth="border-1"
            icon={
              <IconRenderer
                icon={
                  PageLayOut?.EmployeeSalesTarget?.CustomButtons?.UploadButton
                    ?.Icon
                }
                size={16}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={handleBrowseClick}
          />
        )}
      </div>

      {/* Filter card */}
      {PageLayOut?.EmployeeSalesTarget?.Filters && (
        <div className="py-16 px-16 bg-white shadow-card-xl rounded-6 mt-10">
          <div className="flex justify-between items-center">
            <p className="text-heading-6 text-black">
              {PageLayOut?.EmployeeSalesTarget?.Filters?.Title}
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
              <div className="flex gap-16 items-end">
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
                    options={[{ label: "All", value: "0" }, ...managerOptions]}
                    value={String(managerDraft)}
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
        <div className="flex-1  border-1 border-strokegray rounded-6 bg-white mt-10 mb-14 px-16 flex flex-col">
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
                  onChange={(e) => setSearchTerm(e)}
                />
              </div>
              <CustomButton
                title="Download Excel"
                backgroundColor="bg-white"
                textColor="text-primary"
                height="h-37"
                borderColor="#130F40"
                borderWidth="border-1"
                gap="gap-[10px]"
                icon={
                  <IconRenderer
                    icon="LuDownload"
                    size={15}
                    className="text-primary"
                  />
                }
                iconPosition="left"
                onClick={handleDownloadExcel}
              />
            </div>
          </div>

          <style>{`
            .employee-target-listing .grouped-table tbody tr {
              border-left: none !important;
              border-right: none !important;
              border-top: none !important;
            }
            .employee-target-listing .grouped-table thead tr {
              border-bottom: 1.5px solid #eee !important;
            }
            .employee-target-listing .grouped-table__stack-row {
              padding: 2px 0;
            }
          `}</style>
          <div className="employee-target-listing flex-1 mt-14">
            <GroupedIncentiveTable
              columns={EMPLOYEE_TARGET_TABLE_COLUMNS}
              data={employeeGroups}
              emptyMessage="No records found."
              pagination
              showVerticalLines={true}
              pageSize={EMPLOYEE_TARGET_PAGE_SIZE}
              renderCustomCell={renderCustomCell}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-6 items-center justify-center flex flex-1 flex-col border border-strokegray mt-10 mb-14">
          <NoDataFound
            description={PageLayOut?.EmployeeSalesTarget?.NoDataFound?.SubTitle}
            title={PageLayOut?.EmployeeSalesTarget?.NoDataFound?.Title}
          />
          <BulkUploadCard
            title={PageLayOut?.EmployeeSalesTarget?.BuldUploadcard?.CardTitle}
            description={
              PageLayOut?.EmployeeSalesTarget?.BuldUploadcard?.CardSubTitle
            }
            browseText={
              PageLayOut?.EmployeeSalesTarget?.BuldUploadcard?.UploadLabel2
            }
            dragDropText={
              PageLayOut?.EmployeeSalesTarget?.BuldUploadcard?.UploadLabel1
            }
            sampleButtonTitle={
              PageLayOut?.EmployeeSalesTarget?.BuldUploadcard
                ?.DownloadButtonText
            }
            sampleButtonIcon={
              PageLayOut?.EmployeeSalesTarget?.BuldUploadcard?.DownloadIcon
            }
            uploadIcon={
              PageLayOut?.EmployeeSalesTarget?.BuldUploadcard?.UploadIcon
            }
            filesHereText={
              PageLayOut?.EmployeeSalesTarget?.BuldUploadcard?.UploadLabel3
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

      <SampleDownloadModal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        searchFields={searchFields}
        sessionData={sessionData}
        employeeTemplate={employeeTemplate}
        onUserSelect={handleUserSelect}
      />

      <EmployeeSalesTargetUpdateModal
        key={
          editModalOpen
            ? String(
                detailsData[0]?.EmployeeId ??
                  detailsData[0]?.EmployeeCode ??
                  "employee",
              )
            : "closed"
        }
        detailsData={detailsData}
        isOpen={editModalOpen}
        isSubmitting={isSaving}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEmployeeTargets}
      />
      <LoaderModal
        isOpen={isPending}
        message="Loading employee sales targets..."
      />
    </div>
  );
}
