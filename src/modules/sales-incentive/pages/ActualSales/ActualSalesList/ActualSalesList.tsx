import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDatePicker from "../../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import CustomDropdown from "../../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomInput from "../../../../../shared/components/forms/FormInput/CustomTextInput";
import NoDataFound from "../../../../../shared/components/ui/NoDataFound/NoDataFound";
import BulkUploadCard from "../../../../../shared/components/ui/BulkUpload/BulkUploadCard";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import { generateSampleFile } from "../../../../../shared/utils/BulkuploadUtils";
import { useBulkUpload } from "../../../hooks/Usebulkupload";
import {
  ACTUAL_SALES_SAMPLE_ROWS,
  ACTUAL_SALES_UPLOAD_COLUMNS,
  ACTUAL_SALES_TABLE_COLUMNS,
  groupActualSalesRows,
  buildActualSalesEmployeeDetail,
  getManagerOptions,
} from "../../../config/ActualSalesBulkUpload";
import type {
  ActualSalesUploadRow,
  ActualSalesEmployeeDetail,
} from "../../../types/salesIncentive.types";
import ActualSalesDetailModal from "../ActualSalesDetail/ActualSalesDetail";

interface ActualSalesListLocationState {
  bulkUploadSuccessCount?: number;
  addedRows?: ActualSalesUploadRow[];
}

const ACTUAL_SALES_BULK_UPLOAD_ROUTE = "/actualSales/bulkUpload";
const ACTUAL_SALES_PAGE_SIZE = 10;

export default function ActualSalesList() {
  const navigate = useNavigate();
  const location = useLocation();

  const { uploadingFile, fileError, startUpload } =
    useBulkUpload<ActualSalesUploadRow>(ACTUAL_SALES_UPLOAD_COLUMNS);

  const [rows, setRows] = useState<ActualSalesUploadRow[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(true);
  const processedNavKeyRef = useRef<string | null>(null);
  const [appliedMonth, setAppliedMonth] = useState<string>("");
  const [appliedManager, setAppliedManager] = useState<string>("");
  const [monthDraft, setMonthDraft] = useState<Date | null>(null);
  const [managerDraft, setManagerDraft] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail drawer state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] =
    useState<ActualSalesEmployeeDetail | null>(null);

  useEffect(() => {
    const incoming = location.state as ActualSalesListLocationState | undefined;
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

  const managerOptions = useMemo(() => getManagerOptions(rows), [rows]);

  const monthLabel = useCallback((d: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedMonth && row.Month !== appliedMonth) return false;
      if (appliedManager && row["Manager Code"] !== appliedManager)
        return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const haystack =
          `${row["Employee Name"]} ${row["Employee Code"]} ${row["Manager Name"]} ${row.Category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, appliedMonth, appliedManager, searchTerm]);

  const employeeGroups = useMemo(
    () => groupActualSalesRows(filteredRows),
    [filteredRows],
  );

  const handleGetResults = useCallback(() => {
    setAppliedMonth(monthLabel(monthDraft));
    setAppliedManager(managerDraft);
  }, [monthDraft, managerDraft, monthLabel]);

  const handleClearFilters = useCallback(() => {
    setMonthDraft(null);
    setManagerDraft("");
    setAppliedMonth("");
    setAppliedManager("");
  }, []);

  const handleSampleDownload = useCallback(() => {
    generateSampleFile(
      ACTUAL_SALES_UPLOAD_COLUMNS,
      ACTUAL_SALES_SAMPLE_ROWS,
      "Actual_Sales_Sample.xlsx",
      "ActualSales",
    );
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

      const result = await startUpload(file);
      if (!result) return;

      navigate(ACTUAL_SALES_BULK_UPLOAD_ROUTE, {
        state: { validRows: result.validRows, invalidRows: result.invalidRows },
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

  // Builds the per-product breakdown for one employee straight from the
  // already-loaded `rows`, filtered to the currently applied month (if any).
  const handleDetailedSales = useCallback(
    (employeeCode: string) => {
      const detail = buildActualSalesEmployeeDetail(
        rows,
        employeeCode,
        appliedMonth || undefined,
      );
      setSelectedDetail(detail);
      setDetailModalOpen(true);
    },
    [rows, appliedMonth],
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
                />
                <div className="w-[288px]">
                  <CustomDropdown
                    borderColor="text-strokegray"
                    options={managerOptions}
                    value={managerDraft}
                    onChange={(value: string) => setManagerDraft(value)}
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
              pageSize={ACTUAL_SALES_PAGE_SIZE}
              renderCustomCell={(column, row) => {
                if (column.key !== "action") return undefined;
                return (
                  <button
                    type="button"
                    className="text-secondary text-13 font-normal flex items-center gap-4"
                    onClick={() => handleDetailedSales(row?.employeeCode ?? "")}
                  >
                    Detailed Sales
                    <IconRenderer icon="MdKeyboardDoubleArrowRight" size={16} />
                  </button>
                );
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
    </div>
  );
}
