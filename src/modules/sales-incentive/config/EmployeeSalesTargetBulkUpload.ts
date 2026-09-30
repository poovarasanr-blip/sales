import Config from "../../../assets/json/Config.json";
import type {
  BulkUploadColumnConfig,
  CategoryGroup,
  GroupedTableColumn,
} from "../types/salesIncentive.types";

/* ---- Config.json-driven column config ---- */

export const EMPLOYEE_TARGET_UPLOAD_COLUMNS: BulkUploadColumnConfig<
  Record<string, any>
>[] = ((Config as any).EmployeeSalesTargetUploadColumns ?? []).map(
  (col: any) => ({
    key: col.apiField,
    header: col.header,
    required: col.required ?? false,
    type: (col.type as "string" | "number" | "date") ?? "string",
    groupLevel: col.groupLevel as number | undefined,
    headerIcon: col.headerIcon as string | undefined,
  }),
);

/* ---- Table columns for the parent list page ---- */

export const EMPLOYEE_TARGET_TABLE_COLUMNS: GroupedTableColumn[] = [
  {
    key: "category",
    label: "Employee",
    filterable: "text",
    icon: "FiSearch",
    fontWeight: 500,
    color: "#31314D",
    width: "22%",
  },
  {
    key: "manager",
    label: "Manager",
    icon: "FiSearch",
    mergeRowSpan: true,
    width: "15%",
  },
  {
    key: "product",
    label: "Sub Category",
    filterable: "text",
    icon: "FiSearch",
    width: "18%",
  },
  { key: "locations", label: "Sales Target (nos)", width: "12%" },
  { key: "incentive", label: "Incentive (₹)", width: "11%" },
  { key: "eligibility", label: "Incentive Eligibility", width: "14%" },
  {
    key: "action",
    label: "Action",
    align: "center",
    mergeRowSpan: true,
    width: "8%",
    alineItem: "center",
  },
];

/* ---- Grouping helper for the parent list page ---- */

export function groupEmployeeTargetRows(
  rows: Record<string, any>[],
): CategoryGroup[] {
  const employees = new Map<string, CategoryGroup>();

  rows.forEach((row) => {
    const key = String(row.EmployeeCode ?? "");

    if (!employees.has(key)) {
      employees.set(key, {
        category: String(row.EmployeeName ?? ""),
        employeeCode: key,
        managerName: String(row.ManagerName ?? ""),
        managerCode: String(row.ManagerCode ?? ""),
        storeName: String(row.StoreName ?? ""),
        targetQuantity: 0,
        eligibleIncentive: 0,
        subCategories: [{ subCategory: "", products: [] }],
      } as CategoryGroup);
    }

    const group = employees.get(key)!;
    group.subCategories[0].products.push({
      product: String(
        row.IncentiveProductSubCategory ??
          row.IncentiveSubCategory ??
          row.IncentiveProduct ??
          "",
      ),
      effectiveDate: `${row.Month ?? ""} ${row.Year ?? ""}`,
      location: String(row.BaseTargetQuantity ?? ""),
      configCode: String(row.SalesIncentiveConfigurationCode ?? ""),
      incentive: Number(row.Incentive) || 0,
      eligibility: String(row.IncentiveEligibility ?? ""),
    });
  });

  return Array.from(employees.values());
}
