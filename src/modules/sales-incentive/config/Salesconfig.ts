import salesMockData from "../../../assets/json/salesConfig.json";
import { INCENTIVE_CATEGORY_ORDER } from "./Incentiveconfig";
import type {
  GroupedTableColumn,
  ManagerOption,
  SalesCategoryGroupRow,
  SalesConfigData,
  SalesRecord,
  SalesStatus,
  SalesSubCategoryGroup,
} from "../types/salesIncentive.types";

// The raw mock JSON, typed. Same file the rest of the app already reads —
// nothing new is invented here, only extended (see Details on each record).
export const SALES_MOCK_DATA = salesMockData as unknown as SalesConfigData;

export const SALES_TABS: {
  id: SalesTabIdLocal;
  label: string;
  icon: string;
}[] = [
  { id: "PENDING", label: "Pending", icon: "TbClockHour3" },
  { id: "APPROVED", label: "Approved", icon: "LuCircleCheckBig" },
  { id: "REJECTED", label: "Rejected", icon: "FaRegTimesCircle" },
];
type SalesTabIdLocal = "PENDING" | "APPROVED" | "REJECTED";

const TAB_TO_STATUS: Record<SalesTabIdLocal, SalesStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const TAB_TO_DATA_KEY: Record<
  SalesTabIdLocal,
  keyof Pick<SalesConfigData, "PendingData" | "ApprovedData" | "RejectedData">
> = {
  PENDING: "PendingData",
  APPROVED: "ApprovedData",
  REJECTED: "RejectedData",
};

export function statusForTab(tab: SalesTabIdLocal): SalesStatus {
  return TAB_TO_STATUS[tab];
}

/** Raw records for a tab, straight from the mock JSON — one array per status. */
export function recordsForTab(tab: SalesTabIdLocal): SalesRecord[] {
  return SALES_MOCK_DATA[TAB_TO_DATA_KEY[tab]] ?? [];
}

/**
 * The fix for "clicking a Sales record must show THAT record's own
 * details/files": records are looked up by (status, Id) — Id restarts at 1
 * within each status array in the existing mock JSON, so status disambiguates
 * it exactly the way the three separate Pending/Approved/Rejected arrays
 * already do everywhere else in this file. Nothing is ever returned from a
 * fixed/hardcoded index — every call re-searches the source arrays by Id.
 */
export function findSalesRecordById(
  status: SalesStatus,
  id: number,
): SalesRecord | null {
  const tab = (Object.keys(TAB_TO_STATUS) as SalesTabIdLocal[]).find(
    (t) => TAB_TO_STATUS[t] === status,
  );
  if (!tab) return null;
  const records = recordsForTab(tab);
  return records.find((r) => r.Id === id) ?? null;
}

function parsePercentage(value: string): number {
  const n = Number(String(value).replace("%", ""));
  return Number.isFinite(n) ? n : 0;
}

/** Same 3-bucket legend the reference screenshot's "Regularized" column
 * shows: 80-85% / 86-90% / 100%+. Anything below 80% gets no badge, matching
 * how the mock data already leaves PerformanceRange "<80%" uncolored. Reuses
 * the app's existing pastel tokens (bg-candy/bg-peach/bg-seafoam) rather than
 * introducing new colors, since they already match this legend's hex values. */
export function achievementBadgeClass(pct: number): string {
  if (pct >= 100) return "bg-seafoam text-darkgray";
  if (pct >= 86) return "bg-peach text-darkgray";
  if (pct >= 80) return "bg-candy text-darkgray";
  return "";
}

export function getSalesManagerOptions(): ManagerOption[] {
  const seen = new Map<string, string>();
  (["PENDING", "APPROVED", "REJECTED"] as SalesTabIdLocal[]).forEach((tab) => {
    recordsForTab(tab).forEach((r) => {
      if (!seen.has(r.Manager.ManagerId)) {
        seen.set(r.Manager.ManagerId, r.Manager.ManagerName);
      }
    });
  });
  return [
    { label: "All", value: "" },
    ...Array.from(seen.entries()).map(([value, label]) => ({ label, value })),
  ];
}

/** One CategoryGroup per Sales record; the 5 fixed categories live in
 * `subCategories`, mirroring groupIncentiveRows in Incentiveconfig.ts. */
export function groupSalesRecords(
  records: SalesRecord[],
  status: SalesStatus,
): SalesCategoryGroupRow[] {
  return records.map((record) => {
    const subCategories: SalesSubCategoryGroup[] = INCENTIVE_CATEGORY_ORDER.map(
      (categoryName) => {
        const line = record.SalesProducts.find(
          (p) => p.SalesProductName === categoryName,
        );
        const pct = line ? parsePercentage(line.AchievementPercentage) : 0;
        return {
          subCategory: categoryName,
          products: [
            {
              product: categoryName,
              effectiveDate: record.Manager.SubmittedDate,
            },
          ],
          actual: line?.ActualSales ?? 0,
          regularized: line?.RegularizedSales ?? null,
          target: line?.SalesTarget ?? 0,
          incentive: line?.IncentiveAmount ?? null,
          achievementPercentage: pct,
        };
      },
    );

    const approvedDate =
      status === "approved" && record.Manager.SubmittedDate
        ? new Date(record.Manager.SubmittedDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : undefined;

    const group: SalesCategoryGroupRow = {
      salesId: record.Id,
      status,
      rejectedDate: record.RejectedDate,
      approvedDate,
      employeeCode: record.Employee.EmployeeId,
      employeeName: record.Employee.EmployeeName,
      dealer: record.Employee.Dealer,
      category: "All Categories",
      targetQuantity: subCategories.reduce((s, c) => s + (c.target ?? 0), 0),
      eligibleIncentive: record.ActualIncentiveAmount,
      subCategories,
      managerName: record.Manager.ManagerName,
      managerCode: record.Manager.ManagerId,
      storeName: record.Employee.Dealer,
      submittedDate: record.Manager.SubmittedDate,
      actualAmount: record.ActualIncentiveAmount,
      adjustment: record.AdjustmentAmount,
      final: record.FinalIncentiveAmount,
    };
    return group;
  });
}

// ---- Table columns (GroupedIncentiveTable expects GroupedTableColumn[]) ----
// mergeRowSpan is set explicitly on every column (see Incentiveconfig.ts for
// why): true -> once per employee, false -> once per category sub-row.

const EMPLOYEE_MANAGER_CATEGORY_COLUMNS: GroupedTableColumn[] = [
  {
    key: "employeeName",
    label: "Employee Name",
    filterable: "text",
    icon: "FiSearch",
    width: "160px",
    mergeRowSpan: true,
  },
  {
    key: "manager",
    label: "Manager",
    filterable: "text",
    icon: "FaSlidersH",
    width: "105px",
    mergeRowSpan: true,
  },
  {
    key: "category",
    label: "Categories",
    width: "105px",
    mergeRowSpan: false,
  },
  {
    key: "actual",
    label: "Actual",
    align: "center",
    mergeRowSpan: false,
    alineItem: "center",
    width: "45px",
  },
  {
    key: "regularized",
    label: "Regularized",
    align: "center",
    mergeRowSpan: false,
    width: "80px",
  },
  {
    key: "target",
    label: "Target",
    align: "center",
    mergeRowSpan: false,
    width: "50px",
  },
  {
    key: "incentive",
    label: "Incentive",
    align: "right",
    mergeRowSpan: false,
    width: "70px",
    alineItem: "right",
  },
  {
    key: "actualAmount",
    label: "Actual(₹)",
    align: "right",
    mergeRowSpan: true,
    width: "75px",
    alineItem: "right",
  },
  {
    key: "adjustment",
    label: "Adjustment(₹)",
    align: "right",
    mergeRowSpan: true,
    width: "90px",
  },
  {
    key: "final",
    label: "Final(₹)",
    align: "center",
    mergeRowSpan: true,
    width: "70px",
    alineItem: "center",
  },
];

export const SALES_PENDING_COLUMNS: GroupedTableColumn[] = [
  {
    key: "selection",
    label: "",
    width: "36px",
    mergeRowSpan: true,
    align: "center",
    alineItem: "center",
  },
  ...EMPLOYEE_MANAGER_CATEGORY_COLUMNS,
  {
    key: "action",
    label: "Action",
    align: "center",
    mergeRowSpan: true,
    alineItem: "center",
    width: "90px",
  },
];

export const SALES_APPROVED_COLUMNS: GroupedTableColumn[] = [
  ...EMPLOYEE_MANAGER_CATEGORY_COLUMNS,
  {
    key: "status",
    label: "Status",
    align: "center",
    mergeRowSpan: true,
    alineItem: "center",
    width: "120px",
  },
];

export const SALES_REJECTED_COLUMNS: GroupedTableColumn[] = [
  ...EMPLOYEE_MANAGER_CATEGORY_COLUMNS,
  {
    key: "status",
    label: "Status",
    align: "center",
    mergeRowSpan: true,
    alineItem: "center",
    width: "120px",
  },
];

export const SALES_COLUMNS_BY_TAB: Record<
  SalesTabIdLocal,
  GroupedTableColumn[]
> = {
  PENDING: SALES_PENDING_COLUMNS,
  APPROVED: SALES_APPROVED_COLUMNS,
  REJECTED: SALES_REJECTED_COLUMNS,
};

// ---- Detail-drawer columns (SalesDetail.tsx) ----

export const SALES_REGULARIZED_DETAIL_COLUMNS: GroupedTableColumn[] = [
  {
    key: "salesCategory",
    label: "Category",
    fontWeight: 500,
    color: "#31314D",
    width: "150px",
  },
  { key: "salesProducts", label: "Products" },
  {
    key: "salesActual",
    label: "Actual",
    align: "center",
    width: "90px",
    alineItem: "center",
  },
  {
    key: "salesRegularized",
    label: "Regularized",
    align: "center",
    width: "100px",
    alineItem: "center",
  },
  {
    key: "salesRemarks",
    label: "Remarks",
    align: "center",
    width: "90px",
    alineItem: "center",
  },
  {
    key: "salesOverall",
    label: "Overall Regularized",
    align: "center",
    width: "154px",
  },
  {
    key: "salesTarget",
    label: "Target",
    align: "center",
    width: "80px",
    alineItem: "center",
  },
  {
    key: "salesIncentive",
    label: "Incentive",
    align: "right",
    width: "90px",
    alineItem: "right",
  },
];

export const SALES_MONTHLY_DETAIL_COLUMNS: GroupedTableColumn[] = [
  { key: "monthlyDate", label: "Date", width: "110px", filterable: "date" },
  { key: "monthlyCategory", label: "Category", width: "150px" },
  { key: "monthlyProduct", label: "Product" },
  {
    key: "monthlyQuantity",
    label: "Quantity",
    align: "center",
    width: "90px",
  },
  {
    key: "monthlyAttachment",
    label: "Attachment",
    align: "center",
    width: "100px",
  },
  { key: "monthlySubmitted", label: "Submitted On", width: "120px" },
];

export type { SalesTabIdLocal };
