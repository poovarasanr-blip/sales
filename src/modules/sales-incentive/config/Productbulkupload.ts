// NOTE: adjust these two imports to your actual CategoryGroup / GroupedTableColumn
// locations (shown alongside GroupedIncentiveTable's own type imports).
import type {
  BulkUploadColumnConfig,
  CategoryGroup,
  GroupedTableColumn,
} from "../../../modules/sales-incentive/types/salesIncentive.types";

/** Flat row shape as it appears in the uploaded/sample Excel file. */
export interface ProductUploadRow {
  Category: string;
  "Sub Category": string;
  Product: string;
  "Effective Date": string;
  "Target Quantity": number;
  "Eligible Incentive (₹)": number;
  [key: string]: string | number;
}

export const PRODUCT_UPLOAD_COLUMNS: BulkUploadColumnConfig<ProductUploadRow>[] =
  [
    { key: "Category", header: "Category", required: true, type: "string" },
    {
      key: "Sub Category",
      header: "Sub Category",
      required: true,
      type: "string",
    },
    { key: "Product", header: "Product", required: true, type: "string" },
    {
      key: "Effective Date",
      header: "Effective Date",
      required: true,
      type: "date",
    },
    {
      key: "Target Quantity",
      header: "Target Quantity",
      required: true,
      type: "number",
    },
    {
      key: "Eligible Incentive (₹)",
      header: "Eligible Incentive (₹)",
      required: true,
      type: "number",
    },
  ];

export const PRODUCT_SAMPLE_ROWS: ProductUploadRow[] = [
  {
    Category: "Mixer Grinder",
    "Sub Category": "Standard Mixer Grinder",
    Product: "Panasonic MX-AC300-H",
    "Effective Date": "01 Jan 2026",
    "Target Quantity": 200,
    "Eligible Incentive (₹)": 600,
  },
  {
    Category: "Microwave Oven",
    "Sub Category": "Solo Microwave Oven",
    Product: "Panasonic NN-ST26JMFDG",
    "Effective Date": "01 Jan 2026",
    "Target Quantity": 250,
    "Eligible Incentive (₹)": 800,
  },
];
export const PRODUCT_TABLE_COLUMNS: GroupedTableColumn[] = [
  { key: "category", label: "Category", icon: "FaSlidersH" },
  {
    key: "subCategory",
    label: "Sub Category",
    filterable: "text",
    icon: "FiSearch",
  },
  { key: "product", label: "Product", filterable: "text", icon: "FiSearch" },
  {
    key: "effectiveDate",
    label: "Effective Date",
    filterable: "date",
    icon: "MdOutlineCalendarToday",
  },
  { key: "targetQuantity", label: "Target Quantity", sortable: true },
  { key: "eligibleIncentive", label: "Eligible Incentive (₹)", sortable: true },
];
export function groupProductRows(rows: ProductUploadRow[]): CategoryGroup[] {
  const categories = new Map<string, CategoryGroup>();
  rows.forEach((row) => {
    const categoryKey = row.Category || "Uncategorized";

    if (!categories.has(categoryKey)) {
      categories.set(categoryKey, {
        category: categoryKey,
        targetQuantity: row["Target Quantity"],
        eligibleIncentive: row["Eligible Incentive (₹)"],
        subCategories: [],
      } as CategoryGroup);
    }

    const category = categories.get(categoryKey) as CategoryGroup & {
      subCategories: {
        subCategory: string;
        products: { product: string; effectiveDate: string }[];
      }[];
    };

    const subCategoryKey = row["Sub Category"] || "Uncategorized";
    let subCategory = category.subCategories.find(
      (s) => s.subCategory === subCategoryKey,
    );
    if (!subCategory) {
      subCategory = { subCategory: subCategoryKey, products: [] };
      category.subCategories.push(subCategory);
    }

    subCategory.products.push({
      product: row.Product,
      effectiveDate: row["Effective Date"],
    });
  });

  return Array.from(categories.values());
}
