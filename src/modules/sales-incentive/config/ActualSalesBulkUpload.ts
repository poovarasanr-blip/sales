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

export function groupActualSalesRows(
  rows: ActualSalesUploadRow[],
): (CategoryGroup & { employeeCode: string; employeeId?: string })[] {
  const employees = new Map<
    string,
    CategoryGroup & { employeeCode: string; employeeId?: string }
  >();

  rows.forEach((row) => {
    const employeeId = row.EmployeeId == null ? "" : String(row.EmployeeId);
    const employeeCode = String(row["Employee Code"]);
    const key = employeeId || employeeCode;

    if (!employees.has(key)) {
      employees.set(key, {
        category: String(row["Employee Name"]),
        employeeName: String(row["Employee Name"]),
        employeeCode,
        employeeId,
        managerName: String(row["Manager Name"] ?? ""),
        managerCode: String(row.ManagerCode ?? ""),
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
    subCat.actual =
      (Number(subCat.actual) || 0) + (Number(row["Actual Quantity"]) || 0);
  });

  return Array.from(employees.values());
}

export function buildActualSalesEmployeeDetail(
  rows: ActualSalesUploadRow[],
  employeeIdentifier: string,
): ActualSalesEmployeeDetail | null {
  const rowsForEmployeeId = rows.filter(
    (r) => String(r.EmployeeId ?? "") === employeeIdentifier,
  );
  const employeeRows = rowsForEmployeeId.length
    ? rowsForEmployeeId
    : rows.filter((r) => String(r["Employee Code"]) === employeeIdentifier);
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
      employeeId:
        first.EmployeeId == null ? undefined : String(first.EmployeeId),
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
    employeeId: first.EmployeeId == null ? undefined : String(first.EmployeeId),
    employeeCode: String(first["Employee Code"]),
    employeeName: String(first["Employee Name"]),
    company: String(first["Dealer Name"] ?? ""),
    location: "",
    managerName: String(first["Manager Name"] ?? ""),
    managerCode: String(first.ManagerCode ?? ""),
    month: "",
    categories,
    groups,
  };
}

export const ACTUAL_SALES_TABLE_COLUMNS: GroupedTableColumn[] = [
  {
    key: "category",
    label: "Employee",
    fontWeight: 500,
    color: "#31314D",
    mergeRowSpan: true,
  },
  {
    key: "manager",
    label: "Manager",
    mergeRowSpan: true,
  },
  {
    key: "subCategory",
    label: "Sub Category",
    filterable: "text",
    icon: "FiSearch",
  },
  { key: "effectiveDate", label: "Actual Sales", sortable: true },
  {
    key: "action",
    label: "Action",
    width: "137px",
    mergeRowSpan: true,
  },
];

export const ACTUAL_SALES_BULK_UPLOAD_PREVIEW_COLUMNS: GroupedTableColumn[] = [
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
