import type {
  BulkUploadColumnConfig,
  CategoryGroup,
  ActualSalesUploadRow,
  ActualSalesDetailCategory,
  ActualSalesEmployeeDetail,
  GroupedTableColumn,
  ManagerOption,
} from "../types/salesIncentive.types";

export const ACTUAL_SALES_UPLOAD_COLUMNS: BulkUploadColumnConfig<ActualSalesUploadRow>[] =
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
      key: "Actual Sales",
      header: "Actual Sales",
      required: true,
      type: "number",
    },
    { key: "Products", header: "Products", type: "string" },
  ];

export const ACTUAL_SALES_SAMPLE_ROWS: ActualSalesUploadRow[] = [
  {
    "Employee Code": "PSO019",
    "Employee Name": "Aarav Sharma",
    Company: "Vasanth & Co",
    Location: "Chennai",
    "Manager Code": "PSO987",
    "Manager Name": "Pawan Kumar",
    Month: "May 2026",
    Category: "Mixer Grinders",
    "Actual Sales": 12,
    Products: "Panasonic Mixer Grinder 3 Stainless Steel Jars",
  },
  {
    "Employee Code": "PSO019",
    "Employee Name": "Aarav Sharma",
    Company: "Vasanth & Co",
    Location: "Chennai",
    "Manager Code": "PSO987",
    "Manager Name": "Pawan Kumar",
    Month: "May 2026",
    Category: "Mixer Grinders",
    "Actual Sales": 23,
    Products: "Panasonic Monster Mixer Grinder 750 Watts",
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
    "Actual Sales": 20,
    Products: "Panasonic Warmer Series 1.8 Litre Electric Rice Cooker",
  },
];

export function groupActualSalesRows(
  rows: ActualSalesUploadRow[],
): (CategoryGroup & { employeeCode: string })[] {
  const employees = new Map<string, CategoryGroup & { employeeCode: string }>();

  rows.forEach((row) => {
    const key = row["Employee Code"];

    if (!employees.has(key)) {
      employees.set(key, {
        category: row["Employee Name"],
        employeeName: row["Employee Name"], // required by CategoryGroup — restored
        employeeCode: key,
        targetQuantity: 0,
        eligibleIncentive: 0,
        subCategories: [
          {
            subCategory: `${row["Manager Name"]} (${row["Manager Code"]})`,
            products: [],
          },
        ],
      } as CategoryGroup & {
        employeeCode: string;
        subCategories: {
          subCategory: string;
          products: { product: string; effectiveDate: string }[];
        }[];
      });
    }

    const group = employees.get(key) as CategoryGroup & {
      employeeCode: string;
      subCategories: {
        subCategory: string;
        products: { product: string; effectiveDate: string }[];
      }[];
    };

    const products = group.subCategories[0].products;
    const existing = products.find((p) => p.product === row.Category);
    const actualSales = Number(row["Actual Sales"]) || 0;

    if (existing) {
      existing.effectiveDate = String(
        Number(existing.effectiveDate) + actualSales,
      );
    } else {
      products.push({
        product: row.Category,
        effectiveDate: String(actualSales),
      });
    }
  });

  return Array.from(employees.values());
}

export function buildActualSalesEmployeeDetail(
  rows: ActualSalesUploadRow[],
  employeeCode: string,
  month?: string,
): ActualSalesEmployeeDetail | null {
  const employeeRows = rows.filter(
    (r) => r["Employee Code"] === employeeCode && (!month || r.Month === month),
  );
  if (employeeRows.length === 0) return null;

  const first = employeeRows[0];

  const categoryMap = new Map<
    string,
    { products: { product: string; effectiveDate: string }[]; total: number }
  >();

  employeeRows.forEach((row) => {
    if (!categoryMap.has(row.Category)) {
      categoryMap.set(row.Category, { products: [], total: 0 });
    }
    const entry = categoryMap.get(row.Category)!;
    const actualSales = Number(row["Actual Sales"]) || 0;
    entry.products.push({
      product: row.Products || row.Category,
      effectiveDate: String(actualSales),
    });
    entry.total += actualSales;
  });

  const groups: CategoryGroup[] = Array.from(categoryMap.entries()).map(
    ([category, { products, total }]) => ({
      category,
      employeeCode: first["Employee Code"],
      employeeName: first["Employee Name"],
      targetQuantity: total,
      eligibleIncentive: 0,
      subCategories: [{ subCategory: "", products }],
    }),
  );

  const categories: ActualSalesDetailCategory[] = Array.from(
    categoryMap.entries(),
  ).map(([category, { products, total }]) => ({
    category,
    totalSales: total,
    products: products.map((p) => ({
      product: p.product,
      actualSales: Number(p.effectiveDate) || 0,
    })),
  }));

  return {
    employeeCode: first["Employee Code"],
    employeeName: first["Employee Name"],
    company: first.Company,
    location: first.Location,
    managerName: first["Manager Name"],
    month: first.Month,
    categories,
    groups,
  };
}

export const ACTUAL_SALES_TABLE_COLUMNS: GroupedTableColumn[] = [
  { key: "category", label: "Employee", fontWeight: 500, color: "#31314D" },
  {
    key: "subCategory",
    label: "Manager",
    filterable: "text",
    icon: "FiSearch",
  },
  { key: "product", label: "Category", filterable: "text", icon: "FiSearch" },
  { key: "effectiveDate", label: "Actual Sales", sortable: true },
  { key: "action", label: "Action", width: "137px" },
];

export const ACTUAL_SALES_DETAIL_COLUMNS: GroupedTableColumn[] = [
  {
    key: "category",
    label: "Category",
    filterable: "text",
    icon: "FiSearch",
    fontWeight: 500,
    color: "#31314D",
    width: "180px",
  },
  { key: "product", label: "Products" },
  {
    key: "effectiveDate",
    label: "Actual Sales",
    align: "center",
    width: "110px",
  },
  {
    key: "targetQuantity",
    label: "Total Sales",
    align: "center",
    width: "110px",
  },
];

export function getManagerOptions(
  rows: ActualSalesUploadRow[],
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
