import type {
  IncentiveRow,
  IncentiveExportRow,
  CategoryGroup,
  SubCategoryGroup,
  GroupedTableColumn,
  BulkUploadColumnConfig,
  ManagerOption,
} from "../types/salesIncentive.types";

// Fixed category order shown as sub-rows for every employee (per screenshot)
export const INCENTIVE_CATEGORY_ORDER = [
  "Mixer Grinders",
  "Microwave Ovens",
  "Rice Cookers",
  "Induction Cooktops",
  "Refrigerators",
] as const;

// Pastel badge color per category for the "Regularized" column
export const CATEGORY_BADGE_COLOR: Record<string, string> = {
  "Mixer Grinders": "bg-peach text-darkgray",
  "Microwave Ovens": "bg-peach text-darkgray",
  "Rice Cookers": "bg-candy text-darkgray",
  "Induction Cooktops": "bg-seafoam text-darkgray",
  Refrigerators: "",
};

// ---- Table columns (GroupedIncentiveTable expects GroupedTableColumn[]) ----
//
// mergeRowSpan is set EXPLICITLY (true/false) on every column here, rather
// than left undefined, so none of them can accidentally fall back to the
// legacy CATEGORY_LEVEL_KEYS lookup inside CustomTable.tsx (that lookup
// treats any column keyed "category" as merge-across-group, which is wrong
// for this screen — here "category" must repeat per sub-row).
//
//   mergeRowSpan: true  -> employee-level field, renders once per employee
//                          (Employee Name, Manager, Actual(₹), Adjustment(₹),
//                          Final(₹), Action)
//   mergeRowSpan: false -> sub-category-level field, repeats once per row
//                          (Categories, Actual, Regularized, Target, Incentive)
export const INCENTIVE_TABLE_COLUMNS: GroupedTableColumn[] = [
  {
    key: "employeeName",
    label: "Employee Name",
    filterable: "text",
    width: "215px",
    mergeRowSpan: true,
  },
  {
    key: "manager",
    label: "Manager",
    filterable: "text",
    width: "141px",
    mergeRowSpan: true,
  },
  {
    key: "category",
    label: "Categories",
    sortable: true,
    width: "140px",
    mergeRowSpan: false,
  },
  {
    key: "actual",
    label: "Actual",
    align: "center",
    mergeRowSpan: false,
    alineItem: "center",
  },
  {
    key: "regularized",
    label: "Regularized",
    align: "center",
    mergeRowSpan: false,
    width: "91px",
  },
  {
    key: "target",
    label: "Target",
    align: "center",
    mergeRowSpan: false,
    width: "60px",
  },
  {
    key: "incentive",
    label: "Incentive",
    align: "right",
    mergeRowSpan: false,
    width: "77px",
  },
  {
    key: "actualAmount",
    label: "Actual(₹)",
    align: "right",
    mergeRowSpan: true,
    width: "90px",
    alineItem: "right",
  },
  {
    key: "adjustment",
    label: "Adjustment(₹)",
    align: "right",
    mergeRowSpan: true,
    width: "110px",
  },
  {
    key: "final",
    label: "Final(₹)",
    align: "center",
    mergeRowSpan: true,
    width: "85px",
    alineItem: "center",
  },
  {
    key: "action",
    label: "Action",
    align: "center",
    mergeRowSpan: true,
    alineItem: "center",
  },
];

// ---- Export columns (generateSampleFile expects BulkUploadColumnConfig<T>[]) ----
export const INCENTIVE_EXPORT_COLUMNS: BulkUploadColumnConfig<IncentiveExportRow>[] =
  [
    { key: "Employee Code", header: "Employee Code" },
    { key: "Employee Name", header: "Employee Name" },
    { key: "Manager", header: "Manager" },
    { key: "Category", header: "Category" },
    { key: "Actual", header: "Actual", type: "number" },
    { key: "Regularized", header: "Regularized" },
    { key: "Target", header: "Target", type: "number" },
    { key: "Incentive", header: "Incentive" },
    { key: "Actual(₹)", header: "Actual(₹)", type: "number" },
    { key: "Adjustment(₹)", header: "Adjustment(₹)", type: "number" },
    { key: "Final(₹)", header: "Final(₹)", type: "number" },
  ];

export function getManagerOptions(rows: IncentiveRow[]): ManagerOption[] {
  const seen = new Map<string, string>();
  rows.forEach((r) => {
    if (r["Manager Code"] && !seen.has(r["Manager Code"])) {
      seen.set(r["Manager Code"], r["Manager Name"]);
    }
  });
  return [
    { label: "All", value: "" },
    ...Array.from(seen.entries()).map(([value, label]) => ({ label, value })),
  ];
}

export function groupIncentiveRows(rows: IncentiveRow[]): CategoryGroup[] {
  const byEmployee = new Map<string, IncentiveRow[]>();

  rows.forEach((row) => {
    const key = row["Employee Code"];
    if (!byEmployee.has(key)) byEmployee.set(key, []);
    byEmployee.get(key)!.push(row);
  });

  return Array.from(byEmployee.entries()).map(([employeeCode, empRows]) => {
    const first = empRows[0];

    const subCategories: SubCategoryGroup[] = INCENTIVE_CATEGORY_ORDER.map(
      (categoryName) => {
        const catRow = empRows.find((r) => r.Category === categoryName);
        const actual = catRow?.Actual ?? 0;
        const regularized = catRow?.Regularized ?? catRow?.Actual ?? null;
        const target = catRow?.Target ?? 0;
        const incentive = catRow?.Incentive ?? null;

        return {
          subCategory: categoryName,
          products: [
            {
              product: categoryName,
              effectiveDate: catRow?.SubmittedDate ?? first.SubmittedDate ?? "",
            },
          ],
          actual,
          regularized,
          target,
          incentive,
        };
      },
    );

    const actualAmount = empRows.reduce(
      (sum, r) => sum + (r.IncentiveAmount ?? 0),
      0,
    );
    const adjustment = first.Adjustment ?? 0;
    const final = actualAmount + adjustment;

    const group: CategoryGroup = {
      employeeCode,
      employeeName: first["Employee Name"],
      category: "All Categories",
      targetQuantity: subCategories.reduce((s, c) => s + (c.target ?? 0), 0),
      eligibleIncentive: actualAmount,
      subCategories,
      managerName: first["Manager Name"],
      managerCode: first["Manager Code"],
      storeName: first.StoreName ?? "",
      submittedDate: first.SubmittedDate ?? "",
      actualAmount,
      adjustment,
      final,
    };

    return group;
  });
}

/** Flattens filtered IncentiveRow[] into export rows for Download Excel. */
export function toIncentiveExportRows(
  rows: IncentiveRow[],
): IncentiveExportRow[] {
  return rows.map((r) => ({
    "Employee Code": r["Employee Code"],
    "Employee Name": r["Employee Name"],
    Manager: r["Manager Name"],
    Category: r.Category,
    Actual: r.Actual,
    Regularized: r.Regularized ?? "--",
    Target: r.Target,
    Incentive: r.Incentive ?? "--",
    "Actual(₹)": r.IncentiveAmount,
    "Adjustment(₹)": r.Adjustment,
    "Final(₹)": r.IncentiveAmount + r.Adjustment,
  }));
}
