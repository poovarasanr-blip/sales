import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import PageLayOut from "../../../../assets/json/pageLayout/pageLayout.json";
import Config from "../../../../assets/json/Config.json";
import CustomButton from "../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDatePicker from "../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import CustomInput from "../../../../shared/components/forms/FormInput/CustomTextInput";
import NoDataFound from "../../../../shared/components/ui/NoDataFound/NoDataFound";
import BulkUploadCard from "../../../../shared/components/ui/BulkUpload/BulkUploadCard";
import GroupedIncentiveTable from "../../../../shared/components/ui/DataTable/CustomTable";
import { showToast } from "../../../../shared/components/ui/CustomToast/UseToast";
import { generateSampleFile } from "../../../../shared/utils/BulkuploadUtils";
import { useBulkUpload } from "../../hooks/Usebulkupload";
import {
  EMPLOYEE_TARGET_UPLOAD_COLUMNS,
  EMPLOYEE_TARGET_TABLE_COLUMNS,
  groupEmployeeTargetRows,
} from "../../config/EmployeeSalesTargetBulkUpload";
import { useAuthStore } from "../../../../app/store/useAuthStore";
import {
  handleGetProductBulkTemplate,
  handleGetExcelTemplate,
} from "../../../../query/api";
import encrypt from "../../../../utils/security/encrypt";
import decrypt from "../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../utils/security/ParseData";
import { downloadExcelFromBase64 } from "../../../../shared/utils/downloadExcel";
import SampleDownloadModal from "./SampleDownloadModal";
import type { SearchField } from "./SampleDownloadModal";
import EmployeeSalesTargetUpdateModal from "./EmployeeSalesTargetUpdateModal";
import type {
  CategoryGroup,
  GroupedTableColumn,
  SubCategoryGroup,
} from "../../types/salesIncentive.types";
import dummey from "../../../../../mock-api/employeeSalesTargets.mock.json";

interface EmployeeTargetListLocationState {
  bulkUploadSuccessCount?: number;
  addedRows?: Record<string, any>[];
}

const EMPLOYEE_TARGET_BULK_UPLOAD_ROUTE = "/employeeSalesTarget/bulkUpload";
const EMPLOYEE_TARGET_PAGE_SIZE = 10;

export default function EmployeeSalesTarget() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = useAuthStore((s) => s.sessionData);
  const [employeeTemplate, setEmployeeTemplate] = useState<any>([]);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, any>[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);

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

  const [rows, setRows] = useState<Record<string, any>[]>(
    dummey?.list?.response?.data,
  );
  const [showFilter, setShowFilter] = useState<boolean>(true);
  const processedNavKeyRef = useRef<string | null>(null);
  const [appliedMonth, setAppliedMonth] = useState<string>("");
  const [monthDraft, setMonthDraft] = useState<Date | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [managerFilter, setManagerFilter] = useState<string>("All");

  useEffect(() => {
    const incoming = location.state as
      | EmployeeTargetListLocationState
      | undefined;
    if (!incoming?.addedRows?.length) return;
    if (processedNavKeyRef.current === location.key) return;
    processedNavKeyRef.current = location.key;

    setRows((prev) => [...prev, ...incoming.addedRows!]);
    showToast({
      type: "success",
      title: "Success!",
      message: `${incoming.bulkUploadSuccessCount ?? incoming.addedRows.length} records has been added`,
      duration: 3000,
    });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.key, navigate]);

  const monthLabel = useCallback((d: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const uniqueManagers = useMemo(() => {
    const managers = new Set<string>();
    rows.forEach((row) => {
      const name = String(row.ManagerName ?? "").trim();
      if (name) managers.add(name);
    });
    return Array.from(managers).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedMonth) {
        const parts = appliedMonth.split(" ");
        const monthName = parts[0];
        const yearStr = parts[1];
        if (String(row.Month) !== monthName) return false;
        if (yearStr && String(row.Year) !== yearStr) return false;
      }
      if (managerFilter !== "All") {
        if (String(row.ManagerName ?? "").trim() !== managerFilter)
          return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const haystack =
          `${row.EmployeeName} ${row.EmployeeCode} ${row.ManagerName ?? ""} ${row.IncentiveSubCategory} ${row.IncentiveProduct} ${row.IncentiveEligibility}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, appliedMonth, searchTerm, managerFilter]);

  const employeeGroups = useMemo(
    () => groupEmployeeTargetRows(filteredRows),
    [filteredRows],
  );

  const handleGetResults = useCallback(() => {
    setAppliedMonth(monthLabel(monthDraft));
  }, [monthDraft, monthLabel]);

  const handleClearFilters = useCallback(() => {
    setMonthDraft(null);
    setAppliedMonth("");
    setManagerFilter("All");
  }, []);

  const renderCustomCell = useCallback(
    (
      column: GroupedTableColumn,
      category: CategoryGroup,
      _subCategory: SubCategoryGroup,
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
            >
              <IconRenderer icon="FiTrash2" size={15} />
            </button>
            <button
              className="text-[#8E8EA9] hover:text-primary transition-colors"
              aria-label="Edit"
              onClick={() => setEditModalOpen(true)}
            >
              <IconRenderer icon="FiEdit2" size={15} />
            </button>
          </div>
        );
      }
      return undefined;
    },
    [],
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
                />
                <div className="flex flex-col">
                  <label className="text-12 font-medium text-darkgray mb-4">
                    Managers
                  </label>
                  <select
                    value={managerFilter}
                    onChange={(e) => setManagerFilter(e.target.value)}
                    className="h-[37px] w-[288px] rounded-4 border border-strokegray text-13 text-darkgray px-12 bg-white outline-none cursor-pointer appearance-none"
                  >
                    <option value="All">All</option>
                    {uniqueManagers.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
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
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
}
