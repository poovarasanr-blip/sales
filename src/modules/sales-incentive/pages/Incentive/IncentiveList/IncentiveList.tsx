import { useCallback, useEffect, useMemo, useState } from "react";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import incentiveMockData from "../../../../../assets/json/incentiveConfig.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDropdown from "../../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomDatePicker from "../../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import CustomInput from "../../../../../shared/components/forms/FormInput/CustomTextInput";
import NoDataFound from "../../../../../shared/components/ui/NoDataFound/NoDataFound";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import { generateSampleFile } from "../../../../../shared/utils/BulkuploadUtils";
import {
  INCENTIVE_TABLE_COLUMNS,
  INCENTIVE_EXPORT_COLUMNS,
  groupIncentiveRows,
  getManagerOptions,
  toIncentiveExportRows,
  CATEGORY_BADGE_COLOR,
} from "../../../config/Incentiveconfig";
import ActivityLog from "../ActivityLog/ActivityLog";
import type {
  IncentiveRow,
  CategoryGroup,
  SubCategoryGroup,
  ActivityLogEntry,
} from "../../../types/salesIncentive.types";

const INCENTIVE_PAGE_SIZE = 10;

// TODO: replace with a real activity-log API call keyed by employeeCode
// (e.g. fetchIncentiveActivityLog(employeeCode)). The component itself
// already renders however many entries are passed in.
const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
  {
    date: "22 May 2025",
    time: "1:15pm",
    subject: "Sales",
    verb: "approved",
    verbColor: "success",
    suffix: "and incentive adjusted by HR Manager",
    existingIncentive: 3100,
    adjustment: 300,
    finalIncentive: 3400,
    remarks: "Incentive amount revised based on attachments",
  },
  {
    date: "21 May 2026",
    time: "12:40pm",
    subject: "Sales",
    verb: "approved",
    verbColor: "success",
    suffix: "and incentive adjusted by HR Manager",
    existingIncentive: 3400,
    adjustment: -300,
    finalIncentive: 3100,
    remarks: "",
  },
  {
    date: "21 May 2026",
    time: "12:40pm",
    subject: "Sales",
    verb: "approved",
    verbColor: "success",
    suffix: "and incentive adjusted by HR Manager",
    existingIncentive: 3400,
    adjustment: -300,
    finalIncentive: 3100,
    remarks: "",
  },
  {
    date: "21 May 2026",
    time: "12:40pm",
    subject: "Sales",
    verb: "approved",
    verbColor: "success",
    suffix: "and incentive adjusted by HR Manager",
    existingIncentive: 3400,
    adjustment: -300,
    finalIncentive: 3100,
    remarks: "",
  },
  {
    date: "21 May 2026",
    time: "12:40pm",
    subject: "Sales",
    verb: "approved",
    verbColor: "success",
    suffix: "and incentive adjusted by HR Manager",
    existingIncentive: 3400,
    adjustment: -300,
    finalIncentive: 3100,
    remarks: "",
  },
];

export default function IncentiveList() {
  const [rows, setRows] = useState<IncentiveRow[]>(
    incentiveMockData as IncentiveRow[],
  );
  const [showFilter, setShowFilter] = useState<boolean>(true);
  const [appliedMonth, setAppliedMonth] = useState<string>("");
  const [appliedManager, setAppliedManager] = useState<string>("");
  const [monthDraft, setMonthDraft] = useState<Date | null>(null);
  const [managerDraft, setManagerDraft] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmployeeCode, setEditingEmployeeCode] = useState<string | null>(
    null,
  );
  const [adjustmentDraft, setAdjustmentDraft] = useState<string>("");
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [activityLogEmployee, setActivityLogEmployee] =
    useState<CategoryGroup | null>(null);

  useEffect(() => {
    // TODO: replace with real API call, e.g.
    // fetchIncentiveData(appliedMonth, appliedManager).then(setRows);
  }, [appliedMonth, appliedManager]);

  const managerOptions = useMemo(() => getManagerOptions(rows), [rows]);

  const monthLabel = useCallback((d: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedMonth && row.Month !== appliedMonth) return false;
      // appliedManager is "" for the "All" option (see Incentiveconfig.ts),
      // so this correctly no-ops instead of matching nothing.
      if (appliedManager && row["Manager Code"] !== appliedManager)
        return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const haystack =
          `${row["Employee Name"]} ${row["Employee Code"]} ${row["Manager Name"]}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, appliedMonth, appliedManager, searchTerm]);

  // One CategoryGroup per employee; the 5 fixed categories live in
  // `subCategories`, merged per-employee totals live on the group itself.
  const employeeGroups: CategoryGroup[] = useMemo(
    () => groupIncentiveRows(filteredRows),
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

  const handleDownloadExcel = useCallback(() => {
    generateSampleFile(
      INCENTIVE_EXPORT_COLUMNS,
      toIncentiveExportRows(filteredRows),
      "Incentive.xlsx",
      "Incentive",
    );
  }, [filteredRows]);

  const handleSubmitForPayment = useCallback(() => {
    // TODO: call submit-for-payment API with filteredRows / appliedMonth
    showToast({
      type: "success",
      title: "Submitted!",
      message: "Incentive submitted for payment successfully",
      duration: 3000,
    });
  }, [filteredRows]);

  const handleOpenActivityLog = useCallback((category: CategoryGroup) => {
    setActivityLogEmployee(category);
    setActivityLogOpen(true);
  }, []);

  const handleCloseActivityLog = useCallback(() => {
    setActivityLogOpen(false);
  }, []);

  const handleEditAdjustment = useCallback(
    (employeeCode: string) => {
      const current = employeeGroups.find(
        (g) => g.employeeCode === employeeCode,
      );
      setAdjustmentDraft(String(current?.adjustment ?? 0));
      setEditingEmployeeCode(employeeCode);
    },
    [employeeGroups],
  );

  const handleCancelEditAdjustment = useCallback(() => {
    setEditingEmployeeCode(null);
    setAdjustmentDraft("");
  }, []);

  const handleSaveAdjustment = useCallback(
    (employeeCode: string) => {
      const parsed = Number(adjustmentDraft);
      const nextAdjustment = Number.isFinite(parsed) ? parsed : 0;
      setRows((prev) =>
        prev.map((r) =>
          r["Employee Code"] === employeeCode
            ? { ...r, Adjustment: nextAdjustment }
            : r,
        ),
      );
      setEditingEmployeeCode(null);
      setAdjustmentDraft("");
    },
    [adjustmentDraft],
  );

  const handleDetailedSales = useCallback((_employeeCode: string) => {
    // TODO: open the incentive-detail drawer for this employee
  }, []);

  const hasData = rows.length > 0;

  return (
    <div className="px-h pt-12 overflow-scroll scrollbar-hide bg-bgcolor flex flex-col h-[100%] relative">
      {/* Header — no bulk upload on this screen */}
      <div className="flex items-center justify-between">
        <p className="text-heading-6 text-darkgray">
          {PageLayOut?.Incentive?.PageTitle}
        </p>
      </div>

      {/* Filter card */}
      {PageLayOut?.Incentive?.Filters && (
        <div className="py-16 px-16 bg-white shadow-card-xl rounded-6 mt-10">
          <div className="flex justify-between items-center">
            <p className="text-heading-6 text-black">
              {PageLayOut?.Incentive?.Filters?.Title}
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
                title={
                  PageLayOut?.Incentive?.CustomButtons?.DownloadButton?.Name
                }
                backgroundColor="bg-white"
                textColor="text-black"
                borderColor="border-strokegray"
                borderWidth="border-1"
                height="h-37"
                gap="gap-[10px]"
                icon={
                  <IconRenderer
                    icon={
                      PageLayOut?.Incentive?.CustomButtons?.DownloadButton?.Icon
                    }
                    size={15}
                    className="text-black"
                  />
                }
                iconPosition="left"
                onClick={handleDownloadExcel}
              />
              <CustomButton
                title={
                  PageLayOut?.Incentive?.CustomButtons?.SubmitForPaymentButton
                    ?.Name
                }
                backgroundColor="bg-primary"
                textColor="text-white"
                height="h-37"
                gap="gap-[10px]"
                icon={
                  <IconRenderer
                    icon={
                      PageLayOut?.Incentive?.CustomButtons
                        ?.SubmitForPaymentButton?.Icon
                    }
                    size={15}
                    className="text-white"
                  />
                }
                iconPosition="left"
                onClick={handleSubmitForPayment}
              />
            </div>
          </div>

          <div className="mt-14 flex-1">
            <GroupedIncentiveTable
              evenDataBackgroundColor="#F8F9FB"
              columns={INCENTIVE_TABLE_COLUMNS}
              data={employeeGroups}
              showVerticalLines={true}
              hideSubRowBorders={true}
              paddingVertical="py-0"
              emptyMessage="No records found."
              pagination={employeeGroups.length > INCENTIVE_PAGE_SIZE}
              pageSize={INCENTIVE_PAGE_SIZE}
              stripedGroups={false}
              renderCustomCell={(
                column,
                category: CategoryGroup,
                subCategory: SubCategoryGroup,
              ) => {
                const isEditingRow =
                  category.employeeCode === editingEmployeeCode;

                switch (column.key) {
                  case "employeeName":
                    return (
                      <div>
                        <p className="p-small-bold text-darkgray">
                          {category.employeeName}
                        </p>
                        <p className="text-11 text-gray">
                          {category.employeeCode}
                          {category.storeName ? ` • ${category.storeName}` : ""}
                        </p>
                        <button
                          type="button"
                          className="text-secondary text-11 flex items-center gap-2"
                          onClick={() =>
                            handleDetailedSales(category.employeeCode ?? "")
                          }
                        >
                          Detailed Sales
                          <IconRenderer
                            icon="MdKeyboardDoubleArrowRight"
                            size={12}
                          />
                        </button>
                      </div>
                    );

                  case "manager":
                    return (
                      <div>
                        <p className="text-13 text-darkgray">
                          {category.managerName}
                        </p>
                        {category.submittedDate && (
                          <p className="text-11 text-gray flex items-center gap-4">
                            <IconRenderer icon="LuCalendar" size={12} />
                            {category.submittedDate}
                          </p>
                        )}
                      </div>
                    );

                  case "category":
                    return subCategory.subCategory;

                  case "actual":
                    return subCategory.actual;

                  case "regularized": {
                    const color =
                      CATEGORY_BADGE_COLOR[subCategory.subCategory] ?? "";
                    return subCategory.regularized != null ? (
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-[21px] h-[17px] rounded-2 text-12 font-normal  ${color} items-center justify-center`}
                        >
                          {subCategory.regularized}
                        </div>
                      </div>
                    ) : (
                      "--"
                    );
                  }

                  case "target":
                    return subCategory.target;

                  case "incentive":
                    return subCategory.incentive != null
                      ? `₹ ${subCategory.incentive.toLocaleString("en-IN")}`
                      : "--";

                  case "actualAmount":
                    return category.actualAmount != null
                      ? `₹${category.actualAmount.toLocaleString("en-IN")}`
                      : "--";

                  case "adjustment":
                    return isEditingRow ? (
                      <CustomInput
                        value={adjustmentDraft}
                        onChange={(e: any) => setAdjustmentDraft(e)}
                        height="h-[32px]"
                        inputTextSize="text-13"
                        inputTextColor="text-black"
                        inputTextWeight="font-normal"
                      />
                    ) : (
                      (category.adjustment ?? 0)
                    );

                  case "final":
                    return category.final != null
                      ? `₹${category.final.toLocaleString("en-IN")}`
                      : "--";

                  case "action":
                    return isEditingRow ? (
                      <div className="flex items-center gap-10 items-center justify-center">
                        <button
                          type="button"
                          onClick={handleCancelEditAdjustment}
                        >
                          <IconRenderer
                            icon="MdOutlineClose"
                            size={20}
                            className="text-red-500"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveAdjustment(category.employeeCode ?? "")
                          }
                        >
                          <IconRenderer
                            icon="MdOutlineCheck"
                            size={20}
                            className="text-green-500"
                          />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-10 items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleOpenActivityLog(category)}
                        >
                          <IconRenderer
                            icon="MdOutlineHistory"
                            size={20}
                            className="text-gray"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleEditAdjustment(category.employeeCode ?? "")
                          }
                        >
                          <IconRenderer
                            icon="RxPencil1"
                            size={20}
                            className="text-gray"
                          />
                        </button>
                      </div>
                    );

                  default:
                    return undefined;
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-6 items-center justify-center flex flex-1 flex-col border border-strokegray mt-10 mb-14">
          <NoDataFound
            description={PageLayOut?.Incentive?.NoDataFound?.SubTitle}
            title={PageLayOut?.Incentive?.NoDataFound?.Title}
          />
        </div>
      )}

      <ActivityLog
        isOpen={activityLogOpen}
        onClose={handleCloseActivityLog}
        employeeName={activityLogEmployee?.employeeName}
        entries={MOCK_ACTIVITY_LOG}
      />
    </div>
  );
}
