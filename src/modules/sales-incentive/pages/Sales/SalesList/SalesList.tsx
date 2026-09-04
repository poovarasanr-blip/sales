import { useCallback, useMemo, useState } from "react";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDropdown from "../../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomDatePicker from "../../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import CustomInput from "../../../../../shared/components/forms/FormInput/CustomTextInput";
import NoDataFound from "../../../../../shared/components/ui/NoDataFound/NoDataFound";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import {
  SALES_TABS,
  SALES_COLUMNS_BY_TAB,
  achievementBadgeClass,
  getSalesManagerOptions,
  groupSalesRecords,
  recordsForTab,
  statusForTab,
  type SalesTabIdLocal,
} from "../../../config/Salesconfig";
import SalesTabs from "./SalesTabs";
import SalesCheckbox from "./SalesCheckbox";
import SalesDetail from "../SalesDetail/SalesDetail";
import type {
  SalesCategoryGroupRow,
  SalesRecord,
  SalesSubCategoryGroup,
} from "../../../types/salesIncentive.types";
import { ACHIEVED_LABELS } from "../SalesUtils";
import SalesConfirmModal from "../Modals/ApproveModal";

const SALES_PAGE_SIZE = 10;

type RecordsByTab = Record<SalesTabIdLocal, SalesRecord[]>;

function monthLabelOf(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function SalesList() {
  const [activeTab, setActiveTab] = useState<SalesTabIdLocal>("PENDING");

  // Seeded once from the mock JSON, then mutated locally so Approve/Reject
  // can actually move a record between tabs (there's no backend yet).
  const [recordsByTab, setRecordsByTab] = useState<RecordsByTab>(() => ({
    PENDING: recordsForTab("PENDING"),
    APPROVED: recordsForTab("APPROVED"),
    REJECTED: recordsForTab("REJECTED"),
  }));

  const [showFilter, setShowFilter] = useState<boolean>(true);
  const [appliedMonth, setAppliedMonth] = useState<string>("");
  const [appliedManager, setAppliedManager] = useState<string>("");
  const [monthDraft, setMonthDraft] = useState<Date | null>(null);
  const [managerDraft, setManagerDraft] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  void setSearchTerm;

  const [selectedIds, setSelectedIds] = useState<
    Record<SalesTabIdLocal, Set<number>>
  >({ PENDING: new Set(), APPROVED: new Set(), REJECTED: new Set() });

  const [detail, setDetail] = useState<{
    open: boolean;
    record: SalesRecord | null;
  }>({ open: false, record: null });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "approve" | "reject";
    ids: number[];
  }>({ open: false, type: "approve", ids: [] });

  const managerOptions = useMemo(() => getSalesManagerOptions(), []);

  const activeRecords = recordsByTab[activeTab];

  const filteredRecords = useMemo(() => {
    return activeRecords.filter((r) => {
      if (
        appliedMonth &&
        monthLabelOf(r.Manager.SubmittedDate) !== appliedMonth
      )
        return false;
      if (appliedManager && r.Manager.ManagerId !== appliedManager)
        return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const haystack =
          `${r.Employee.EmployeeName} ${r.Employee.EmployeeId} ${r.Manager.ManagerName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeRecords, appliedMonth, appliedManager, searchTerm]);

  const employeeGroups: SalesCategoryGroupRow[] = useMemo(
    () => groupSalesRecords(filteredRecords, statusForTab(activeTab)),
    [filteredRecords, activeTab],
  );

  const handleGetResults = useCallback(() => {
    setAppliedMonth(monthLabelOf(monthDraft ? monthDraft.toISOString() : ""));
    setAppliedManager(managerDraft);
  }, [monthDraft, managerDraft]);

  const handleClearFilters = useCallback(() => {
    setMonthDraft(null);
    setManagerDraft("");
    setAppliedMonth("");
    setAppliedManager("");
  }, []);

  const activeSelection = selectedIds[activeTab];

  const toggleRowSelected = useCallback(
    (id: number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev[activeTab]);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { ...prev, [activeTab]: next };
      });
    },
    [activeTab],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const all = filteredRecords.map((r) => r.Id);
      const allSelected =
        all.length > 0 && all.every((id) => prev[activeTab].has(id));
      return {
        ...prev,
        [activeTab]: allSelected ? new Set() : new Set(all),
      };
    });
  }, [filteredRecords, activeTab]);

  const clearSelection = useCallback((tab: SalesTabIdLocal) => {
    setSelectedIds((prev) => ({ ...prev, [tab]: new Set() }));
  }, []);

  // Moves one record out of PENDING into APPROVED or REJECTED. This is the
  // only place record arrays are mutated, so every Approve/Reject path
  // (single row or bulk) goes through it — no duplicated, drifting logic.
  const moveRecord = useCallback(
    (id: number, toStatus: "approved" | "rejected") => {
      setRecordsByTab((prev) => {
        const record = prev.PENDING.find((r) => r.Id === id);
        if (!record) return prev;

        const destination = toStatus === "approved" ? "APPROVED" : "REJECTED";
        const destList = prev[destination];
        const nextId =
          destList.length > 0 ? Math.max(...destList.map((r) => r.Id)) + 1 : 1;

        const formattedDate = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const movedRecord: SalesRecord = {
          ...record,
          Id: nextId,
          Status: toStatus,
          ...(toStatus === "rejected" ? { RejectedDate: formattedDate } : {}),
        };

        return {
          ...prev,
          PENDING: prev.PENDING.filter((r) => r.Id !== id),
          [destination]: [...destList, movedRecord],
        };
      });
    },
    [],
  );

  const openConfirmModal = useCallback(
    (ids: number[], type: "approve" | "reject") => {
      setConfirmModal({ open: true, type, ids });
    },
    [],
  );

  const handleConfirmed = useCallback(
    (_remarks: string) => {
      const { type, ids } = confirmModal;
      const names = ids
        .map(
          (id) =>
            recordsByTab.PENDING.find((r) => r.Id === id)?.Employee
              .EmployeeName,
        )
        .filter(Boolean);

      if (type === "approve") {
        ids.forEach((id) => moveRecord(id, "approved"));
        clearSelection("PENDING");
        showToast({
          type: "success",
          title: "Approved!",
          message:
            names.length === 1
              ? `${names[0]}'s sales has been Approved`
              : `${names.length} sales records have been Approved`,
          duration: 3000,
        });
      } else {
        ids.forEach((id) => moveRecord(id, "rejected"));
        clearSelection("PENDING");
        showToast({
          type: "error",
          title: "Rejeceted!",
          message:
            names.length === 1
              ? `${names[0]}'s sales has been Rejected`
              : `${names.length} sales records have been Rejected`,
          duration: 3000,
        });
      }

      setConfirmModal({ open: false, type: "approve", ids: [] });
      setDetail({ open: false, record: null });
    },
    [confirmModal, recordsByTab, moveRecord, clearSelection],
  );

  const closeConfirmModal = useCallback(() => {
    setConfirmModal({ open: false, type: "approve", ids: [] });
  }, []);

  const handleRemoveRejected = useCallback(
    (ids: number[]) => {
      setRecordsByTab((prev) => ({
        ...prev,
        REJECTED: prev.REJECTED.filter((r) => !ids.includes(r.Id)),
      }));
      clearSelection("REJECTED");
      showToast({
        type: "success",
        title: "Removed!",
        message: `${ids.length} sales record${ids.length === 1 ? "" : "s"} removed`,
        duration: 3000,
      });
    },
    [clearSelection],
  );
  void handleRemoveRejected;

  const handleAdjustmentChange = useCallback((id: number, value: string) => {
    const parsed = Number(value);
    const nextAdjustment =
      value === "" ? 0 : Number.isFinite(parsed) ? parsed : 0;
    setRecordsByTab((prev) => ({
      ...prev,
      PENDING: prev.PENDING.map((r) =>
        r.Id === id
          ? {
              ...r,
              AdjustmentAmount: nextAdjustment,
              FinalIncentiveAmount: r.ActualIncentiveAmount + nextAdjustment,
            }
          : r,
      ),
    }));
  }, []);

  const openDetail = useCallback(
    (salesId: number) => {
      const record = recordsByTab[activeTab].find((r) => r.Id === salesId);
      if (record) {
        setDetail({ open: true, record });
      }
    },
    [activeTab, recordsByTab],
  );

  const closeDetail = useCallback(() => {
    setDetail({ open: false, record: null });
  }, []);

  const hasData = activeRecords.length > 0;
  const columns = SALES_COLUMNS_BY_TAB[activeTab];
  const selectionCount = activeSelection.size;

  const detailRecord =
    detail.open && detail.record
      ? (recordsByTab[activeTab].find((r) => r.Id === detail.record!.Id) ??
        detail.record)
      : null;

  if (detail.open && detailRecord) {
    return (
      <>
        <SalesDetail
          record={detailRecord}
          status={statusForTab(activeTab)}
          onBack={closeDetail}
          onApprove={() => openConfirmModal([detailRecord.Id], "approve")}
          onReject={() => openConfirmModal([detailRecord.Id], "reject")}
          onAdjustmentChange={(value) =>
            handleAdjustmentChange(detailRecord.Id, value)
          }
        />
        {confirmModal.open &&
          (() => {
            const firstRecord = recordsByTab.PENDING.find(
              (r) => r.Id === confirmModal.ids[0],
            );
            const empName =
              confirmModal.ids.length === 1
                ? (firstRecord?.Employee.EmployeeName ?? "")
                : `${confirmModal.ids.length} employees`;
            const empMonth = firstRecord
              ? new Date(firstRecord.Manager.SubmittedDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    year: "numeric",
                  },
                )
              : "";
            return (
              <SalesConfirmModal
                isOpen
                type={confirmModal.type}
                employeeName={empName}
                month={empMonth}
                onConfirm={handleConfirmed}
                onCancel={closeConfirmModal}
              />
            );
          })()}
      </>
    );
  }

  return (
    <div className="h-[100%] flex flex-col relative">
      <div className="px-h pt-12 overflow-scroll scrollbar-hide bg-bgcolor flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-heading-6 text-darkgray">
            {PageLayOut?.Sales?.PageTitle}
          </p>
        </div>

        {/* Filter card */}
        {PageLayOut?.Sales?.Filters && (
          <div className="py-16 px-16 bg-white shadow-card-xl rounded-6 mt-10">
            <div className="flex justify-between items-center">
              <p className="text-heading-6 text-black">Filter</p>
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

        <div className="mt-10 bg-white flex justify-between items-center border border-strokegray rounded-tl-[6px] rounded-tr-[6px] pr-[16px]">
          <SalesTabs
            tabs={SALES_TABS}
            active={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            counts={{
              PENDING: recordsByTab.PENDING.length,
              APPROVED: recordsByTab.APPROVED.length,
              REJECTED: recordsByTab.REJECTED.length,
            }}
          />
          <div className="flex gap-2.5">
            <p className="text-12 font-normal text-gray">Achieved:</p>
            {ACHIEVED_LABELS.map((item, index) => (
              <div key={index} className="flex items-center gap-[3px]">
                <span
                  className="rounded-2 w-[10px] h-[10px]"
                  style={{ backgroundColor: item?.color }}
                />
                <div className="text-11 text-gray">{item?.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        {hasData ? (
          <div className="flex-1 border-1 border-t-0 border-strokegray rounded-b-6 bg-white mb-14 px-16 flex flex-col">
            <div className="mt-14 flex-1">
              <GroupedIncentiveTable
                evenDataBackgroundColor="#F8F9FB"
                columns={columns}
                data={employeeGroups}
                showVerticalLines={true}
                hideSubRowBorders={true}
                paddingVertical="py-0"
                emptyMessage="No records found."
                pagination={employeeGroups.length > SALES_PAGE_SIZE}
                pageSize={SALES_PAGE_SIZE}
                stripedGroups={false}
                renderCustomHeader={(column) => {
                  if (column.key !== "selection") return undefined;
                  const allSelected =
                    filteredRecords.length > 0 &&
                    filteredRecords.every((r) => activeSelection.has(r.Id));
                  return (
                    <div className="flex items-center justify-center w-full">
                      <SalesCheckbox
                        checked={allSelected}
                        indeterminate={selectionCount > 0 && !allSelected}
                        onChange={toggleSelectAll}
                        ariaLabel="Select all"
                      />
                    </div>
                  );
                }}
                renderCustomCell={(column, category, subCategory) => {
                  const cat = category as SalesCategoryGroupRow;
                  const sub = subCategory as SalesSubCategoryGroup;
                  switch (column.key) {
                    case "selection":
                      return (
                        <div className="flex items-center justify-center">
                          <SalesCheckbox
                            checked={activeSelection.has(cat.salesId)}
                            onChange={() => toggleRowSelected(cat.salesId)}
                            ariaLabel={`Select ${cat.employeeName}`}
                          />
                        </div>
                      );

                    case "employeeName":
                      return (
                        <div>
                          <p className="p-small-bold text-darkgray">
                            {cat.employeeName}
                          </p>
                          <p className="text-11 text-gray">
                            {cat.employeeCode}
                            {cat.dealer ? ` • ${cat.dealer}` : ""}
                          </p>
                          <button
                            type="button"
                            className="text-secondary text-11 flex items-center gap-2"
                            onClick={() => openDetail(cat.salesId)}
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
                            {cat.managerName}
                          </p>
                          {cat.submittedDate && (
                            <p className="text-11 text-gray flex items-center gap-4">
                              <IconRenderer icon="LuCalendar" size={12} />
                              {cat.submittedDate}
                            </p>
                          )}
                        </div>
                      );

                    case "category":
                      return sub.subCategory;

                    case "actual":
                      return sub.actual;

                    case "regularized": {
                      const color = achievementBadgeClass(
                        sub.achievementPercentage,
                      );
                      return sub.regularized != null ? (
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-[21px] h-[17px] rounded-2 text-12 font-normal ${color} flex items-center justify-center`}
                          >
                            {sub.regularized}
                          </div>
                        </div>
                      ) : (
                        "--"
                      );
                    }

                    case "target":
                      return sub.target;

                    case "incentive":
                      return sub.incentive != null
                        ? `₹ ${sub.incentive.toLocaleString("en-IN")}`
                        : "--";

                    case "actualAmount":
                      return cat.actualAmount != null
                        ? `₹${cat.actualAmount.toLocaleString("en-IN")}`
                        : "--";

                    case "adjustment":
                      return activeTab === "PENDING" ? (
                        <CustomInput
                          value={String(cat.adjustment ?? 0)}
                          onChange={(v: string) =>
                            handleAdjustmentChange(cat.salesId, v)
                          }
                          height="h-[32px]"
                          inputTextSize="text-13"
                          inputTextColor="text-black"
                          inputTextWeight="font-normal"
                        />
                      ) : cat.adjustment ? (
                        cat.adjustment
                      ) : (
                        "--"
                      );

                    case "final":
                      return cat.final != null
                        ? `₹${cat.final.toLocaleString("en-IN")}`
                        : "--";

                    case "status": {
                      const isApproved = cat.status === "approved";
                      const statusDate = isApproved
                        ? cat.approvedDate
                        : cat.rejectedDate;
                      return (
                        <div className="flex flex-col items-center gap-2">
                          <span
                            className={`text-11 font-medium px-8 py-2 rounded-full whitespace-nowrap ${
                              isApproved
                                ? "bg-mintgreen text-success"
                                : "bg-blushpink text-danger"
                            }`}
                          >
                            {isApproved ? "APPROVED" : "REJECTED"}
                          </span>
                          {statusDate && (
                            <span className="text-10 text-gray whitespace-nowrap">
                              {statusDate}
                            </span>
                          )}
                        </div>
                      );
                    }

                    case "action":
                      return (
                        <div className="flex items-center gap-16 justify-end pr-10">
                          <button
                            type="button"
                            title="Reject"
                            onClick={() =>
                              openConfirmModal([cat.salesId], "reject")
                            }
                          >
                            <IconRenderer
                              icon="MdOutlineCancel"
                              size={20}
                              className="text-red-500"
                            />
                          </button>
                          <button
                            type="button"
                            title="Approve"
                            onClick={() =>
                              openConfirmModal([cat.salesId], "approve")
                            }
                          >
                            <IconRenderer
                              icon="LuCircleCheckBig"
                              size={18}
                              className="text-green-500"
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
          <div className="bg-white rounded-6 items-center justify-center flex flex-1 flex-col border border-t-0 border-strokegray mb-14">
            <NoDataFound
              description={PageLayOut?.Sales?.NoDataFound?.SubTitle}
              title={PageLayOut?.Sales?.NoDataFound?.Title}
            />
          </div>
        )}
      </div>

      {selectionCount > 0 && activeTab === "PENDING" && (
        <div className="flex items-center justify-end gap-12 h-[54px] shrink-0 border-t-1 border-strokegray bg-white px-h">
          <CustomButton
            title="Reject"
            backgroundColor="bg-white"
            textColor="text-danger"
            borderColor="border-danger"
            borderWidth="border-1"
            gap="gap-[8px]"
            height="h-[34px]"
            width="w-[85px]"
            icon={
              <IconRenderer
                icon="FaRegTimesCircle"
                size={14}
                className="text-danger"
              />
            }
            iconPosition="left"
            onClick={() =>
              openConfirmModal(Array.from(activeSelection), "reject")
            }
          />
          <CustomButton
            title="Approve"
            backgroundColor="bg-success"
            textColor="text-white"
            gap="gap-[8px]"
            height="h-[34px]"
            width="w-[125px]"
            icon={
              <IconRenderer
                icon="LuCircleCheckBig"
                size={14}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={() =>
              openConfirmModal(Array.from(activeSelection), "approve")
            }
          />
        </div>
      )}

      {confirmModal.open &&
        (() => {
          const firstRecord = recordsByTab.PENDING.find(
            (r) => r.Id === confirmModal.ids[0],
          );
          const empName =
            confirmModal.ids.length === 1
              ? (firstRecord?.Employee.EmployeeName ?? "")
              : `${confirmModal.ids.length} employees`;
          const month = firstRecord
            ? new Date(firstRecord.Manager.SubmittedDate).toLocaleDateString(
                "en-US",
                { month: "long", year: "numeric" },
              )
            : "";
          return (
            <SalesConfirmModal
              isOpen
              type={confirmModal.type}
              employeeName={empName}
              month={month}
              onConfirm={handleConfirmed}
              onCancel={closeConfirmModal}
            />
          );
        })()}
    </div>
  );
}
