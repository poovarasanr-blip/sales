import type {
  BulkUploadColumnConfig,
  CategoryGroup,
  EmployeeSalesTargetUploadRow,
  GroupedTableColumn,
  ManagerOption,
} from "../types/salesIncentive.types";

export const EMPLOYEE_TARGET_UPLOAD_COLUMNS: BulkUploadColumnConfig<EmployeeSalesTargetUploadRow>[] =
  [
    {
      key: "Employee Code",
      header: "Employee Code",
      required: true,
      type: "string",
    },
    {
      key: "Employee Name",
      header: "Employee Name",
      required: true,
      type: "string",
    },
    { key: "Company", header: "Company", required: true, type: "string" },
    { key: "Location", header: "Location", required: true, type: "string" },
    {
      key: "Manager Code",
      header: "Manager Code",
      required: true,
      type: "string",
    },
    {
      key: "Manager Name",
      header: "Manager Name",
      required: true,
      type: "string",
    },
    { key: "Month", header: "Month", required: true, type: "string" },
    { key: "Category", header: "Category", required: true, type: "string" },
    {
      key: "Sales Target (nos)",
      header: "Sales Target (nos)",
      required: true,
      type: "number",
    },
  ];

export const EMPLOYEE_TARGET_SAMPLE_ROWS: EmployeeSalesTargetUploadRow[] = [
  {
    "Employee Code": "PSO019",
    "Employee Name": "Aarav Sharma",
    Company: "Vasanth & Co",
    Location: "Chennai",
    "Manager Code": "PSO987",
    "Manager Name": "Pawan Kumar",
    Month: "May 2026",
    Category: "Mixer Grinders",
    "Sales Target (nos)": 45,
  },
  {
    "Employee Code": "PSO019",
    "Employee Name": "Aarav Sharma",
    Company: "Vasanth & Co",
    Location: "Chennai",
    "Manager Code": "PSO987",
    "Manager Name": "Pawan Kumar",
    Month: "May 2026",
    Category: "Microwave Ovens",
    "Sales Target (nos)": 25,
  },
  {
    "Employee Code": "PSO019",
    "Employee Name": "Aarav Sharma",
    Company: "Vasanth & Co",
    Location: "Chennai",
    "Manager Code": "PSO987",
    "Manager Name": "Pawan Kumar",
    Month: "May 2026",
    Category: "Rice Cookers",
    "Sales Target (nos)": 60,
  },
];

export function groupEmployeeTargetRows(
  rows: EmployeeSalesTargetUploadRow[],
): CategoryGroup[] {
  const employees = new Map<string, CategoryGroup>();

  rows.forEach((row) => {
    const key = row["Employee Code"];

    if (!employees.has(key)) {
      employees.set(key, {
        category: `${row["Employee Name"]}`, //(${row["Employee Code"]})
        targetQuantity: 0,
        eligibleIncentive: 0,
        subCategories: [
          {
            subCategory: `${row["Manager Name"]} (${row["Manager Code"]})`,
            products: [],
          },
        ],
      } as CategoryGroup);
    }

    const group = employees.get(key) as CategoryGroup & {
      subCategories: {
        subCategory: string;
        products: { product: string; effectiveDate: string }[];
      }[];
    };
    group.subCategories[0].products.push({
      product: row.Category,
      effectiveDate: String(row["Sales Target (nos)"]),
    });
  });

  return Array.from(employees.values());
}

export const EMPLOYEE_TARGET_TABLE_COLUMNS: GroupedTableColumn[] = [
  {
    key: "category",
    label: "Employee",
    fontWeight: 500,
    color: "#31314D",
  },
  {
    key: "subCategory",
    label: "Manager",
    filterable: "text",
    icon: "FiSearch",
  },
  { key: "product", label: "Category", filterable: "text", icon: "FiSearch" },
  { key: "effectiveDate", label: "Sales Target (nos)", sortable: true },
];

/** Unique "Managers" dropdown options derived from the loaded dataset. */
export function getManagerOptions(
  rows: EmployeeSalesTargetUploadRow[],
): ManagerOption[] {
  const seen = new Map<string, string>();
  rows.forEach((row) => {
    if (!seen.has(row["Manager Code"])) {
      seen.set(row["Manager Code"], row["Manager Name"]);
    }
  });
  return [
    { label: "All", value: "" },
    ...Array.from(seen.entries()).map(([value, label]) => ({ label, value })),
  ];
}
