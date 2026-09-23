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
    { key: "SalesEntryId", header: "SalesEntryId", type: "string" },
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
    {
      key: "Dealer Name",
      header: "Dealer Name",
      required: true,
      type: "string",
    },
    {
      key: "Manager Name",
      header: "Manager Name",
      required: true,
      type: "string",
    },
    {
      key: "IncentiveSubCategory",
      header: "IncentiveSubCategory",
      required: true,
      type: "string",
    },
    {
      key: "IncentiveProduct",
      header: "IncentiveProduct",
      required: true,
      type: "string",
    },
    {
      key: "SubmittedOn",
      header: "SubmittedOn",
      required: false,
      type: "string",
    },
    {
      key: "Original Quantity",
      header: "Original Quantity",
      required: true,
      type: "number",
    },
    {
      key: "Actual Quantity",
      header: "Actual Quantity",
      required: true,
      type: "number",
    },
  ];

export const ACTUAL_SALES_SAMPLE_ROWS: ActualSalesUploadRow[] = [
  {
    SalesEntryId: 1,
    "Employee Code": "76077",
    "Employee Name": "Test update Shalini",
    "Dealer Name": "Bangalore",
    "Manager Name": "rajesh magaji",
    IncentiveSubCategory: "Standard Mixer Grinder",
    IncentiveProduct: "Panasonic MX-AC300-H 550W Mixer Grinder",
    SubmittedOn: "2026-09-15",
    "Original Quantity": 10,
    "Actual Quantity": 2,
  },
  {
    SalesEntryId: 2,
    "Employee Code": "76077",
    "Employee Name": "Test update Shalini",
    "Dealer Name": "Bangalore",
    "Manager Name": "rajesh magaji",
    IncentiveSubCategory: "Standard Mixer Grinder",
    IncentiveProduct: "Panasonic Monster Mixer Grinder 750 Watts",
    SubmittedOn: "2026-09-15",
    "Original Quantity": 15,
    "Actual Quantity": 5,
  },
  {
    SalesEntryId: 3,
    "Employee Code": "76078",
    "Employee Name": "Ravi Kumar",
    "Dealer Name": "Chennai",
    "Manager Name": "rajesh magaji",
    IncentiveSubCategory: "Premium Mixer Grinder",
    IncentiveProduct: "Panasonic Warmer Series 1.8 Litre Rice Cooker",
    SubmittedOn: "2026-09-15",
    "Original Quantity": 20,
    "Actual Quantity": 8,
  },
];

export function groupActualSalesRows(
  rows: ActualSalesUploadRow[],
): (CategoryGroup & { employeeCode: string })[] {
  const employees = new Map<
    string,
    CategoryGroup & { employeeCode: string }
  >();

  rows.forEach((row) => {
    const key = String(row["Employee Code"]);

    if (!employees.has(key)) {
      employees.set(key, {
        category: String(row["Employee Name"]),
        employeeName: String(row["Employee Name"]),
        employeeCode: key,
        managerName: String(row["Manager Name"] ?? ""),
        storeName: String(row["Dealer Name"] ?? ""),
        targetQuantity: 0,
        eligibleIncentive: 0,
        subCategories: [],
      });
    }

    const group = employees.get(key)!;
    const subCatName = String(row.IncentiveSubCategory ?? "");

    let subCat = group.subCategories.find(
      (sc) => sc.subCategory === subCatName,
    );
    if (!subCat) {
      subCat = { subCategory: subCatName, products: [] };
      group.subCategories.push(subCat);
    }

    subCat.products.push({
      product: String(row.IncentiveProduct ?? ""),
      effectiveDate: String(row["Actual Quantity"] ?? 0),
    });
  });

  return Array.from(employees.values());
}

export function buildActualSalesEmployeeDetail(
  rows: ActualSalesUploadRow[],
  employeeCode: string,
): ActualSalesEmployeeDetail | null {
  const employeeRows = rows.filter(
    (r) => String(r["Employee Code"]) === employeeCode,
  );
  if (employeeRows.length === 0) return null;

  const first = employeeRows[0];

  const subCatMap = new Map<
    string,
    { products: { product: string; effectiveDate: string }[]; total: number }
  >();

  employeeRows.forEach((row) => {
    const subCat = String(row.IncentiveSubCategory ?? "");
    if (!subCatMap.has(subCat)) {
      subCatMap.set(subCat, { products: [], total: 0 });
    }
    const entry = subCatMap.get(subCat)!;
    const qty = Number(row["Actual Quantity"]) || 0;
    entry.products.push({
      product: String(row.IncentiveProduct ?? ""),
      effectiveDate: String(qty),
    });
    entry.total += qty;
  });

  const groups: CategoryGroup[] = Array.from(subCatMap.entries()).map(
    ([subCat, { products, total }]) => ({
      category: subCat,
      employeeCode: String(first["Employee Code"]),
      employeeName: String(first["Employee Name"]),
      targetQuantity: total,
      eligibleIncentive: 0,
      subCategories: [{ subCategory: "", products }],
    }),
  );

  const categories: ActualSalesDetailCategory[] = Array.from(
    subCatMap.entries(),
  ).map(([subCat, { products, total }]) => ({
    category: subCat,
    totalSales: total,
    products: products.map((p) => ({
      product: p.product,
      actualSales: Number(p.effectiveDate) || 0,
    })),
  }));

  return {
    employeeCode: String(first["Employee Code"]),
    employeeName: String(first["Employee Name"]),
    company: String(first["Dealer Name"] ?? ""),
    location: "",
    managerName: String(first["Manager Name"] ?? ""),
    month: "",
    categories,
    groups,
  };
}

export const ACTUAL_SALES_TABLE_COLUMNS: GroupedTableColumn[] = [
  { key: "category", label: "Employee", fontWeight: 500, color: "#31314D" },
  {
    key: "subCategory",
    label: "Sub Category",
    filterable: "text",
    icon: "FiSearch",
  },
  { key: "product", label: "Product", filterable: "text", icon: "FiSearch" },
  { key: "effectiveDate", label: "Actual Quantity", sortable: true },
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
  const seen = new Set<string>();
  rows.forEach((row) => {
    const name = String(row["Manager Name"] ?? "");
    if (name) seen.add(name);
  });
  return [
    { label: "All", value: "" },
    ...Array.from(seen).map((name) => ({ label: name, value: name })),
  ];
}
