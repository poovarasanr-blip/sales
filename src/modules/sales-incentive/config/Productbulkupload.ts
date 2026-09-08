import type {
  BulkUploadColumnConfig,
  CategoryGroup,
  GroupedTableColumn,
  ProductFlatRow,
  ProductDetailData,
  ProductDetailEntry,
  ProductActivityLogEntry,
} from "../../../modules/sales-incentive/types/salesIncentive.types";

export interface ProductUploadRow {
  Category: string;
  "Sub Category": string;
  Product: string;
  "Effective Date": string;
  "Target Quantity": number;
  "Eligible Incentive (₹)": number;
  Location: string;
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
    { key: "Location", header: "Locations", required: true, type: "string" },
  ];

export const PRODUCT_SAMPLE_ROWS: ProductUploadRow[] = [
  {
    Category: "Mixer Grinder",
    "Sub Category": "Standard Mixer Grinder",
    Product: "Panasonic MX-AC300-H",
    "Effective Date": "01 Jan 2026",
    "Target Quantity": 200,
    "Eligible Incentive (₹)": 600,
    Location: "T.Nagar, Anna nagar",
  },
  {
    Category: "Microwave Oven",
    "Sub Category": "Solo Microwave Oven",
    Product: "Panasonic NN-ST26JMFDG",
    "Effective Date": "01 Jan 2026",
    "Target Quantity": 250,
    "Eligible Incentive (₹)": 800,
    Location: "HSR Layout",
  },
];

export const PRODUCT_TABLE_COLUMNS: GroupedTableColumn[] = [
  {
    key: "category",
    label: "Category",
    icon: "FaSlidersH",
    mergeRowSpan: true,
  },
  {
    key: "effectiveDate",
    label: "Effective Date",
    filterable: "date",
    icon: "MdOutlineCalendarToday",
    mergeRowSpan: true,
  },
  {
    key: "targetQuantity",
    label: "Target Quantity",
    sortable: true,
    mergeRowSpan: true,
  },
  {
    key: "eligibleIncentive",
    label: "Eligible Incentive (₹)",
    sortable: true,
    mergeRowSpan: true,
  },
  {
    key: "subCategory",
    label: "Sub Category",
    filterable: "text",
    icon: "FiSearch",
  },
  { key: "product", label: "Product", filterable: "text", icon: "FiSearch" },
  {
    key: "locations",
    label: "Locations",
    filterable: "text",
    icon: "FiSearch",
  },
];

export function groupProductRows(rows: ProductUploadRow[]): CategoryGroup[] {
  const categories = new Map<string, CategoryGroup>();
  rows.forEach((row) => {
    const categoryKey = row.Category || "Uncategorized";

    if (!categories.has(categoryKey)) {
      categories.set(categoryKey, {
        category: categoryKey,
        effectiveDate: row["Effective Date"],
        targetQuantity: row["Target Quantity"],
        eligibleIncentive: row["Eligible Incentive (₹)"],
        subCategories: [],
      } as CategoryGroup);
    }

    const category = categories.get(categoryKey) as CategoryGroup & {
      subCategories: {
        subCategory: string;
        products: {
          product: string;
          effectiveDate: string;
          location?: string;
        }[];
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
      location: row.Location || "",
    });
  });

  return Array.from(categories.values());
}

export const PRODUCT_FLAT_COLUMNS: GroupedTableColumn[] = [
  {
    key: "category",
    label: "Category",
    icon: "FaSlidersH",
    filterable: "select",
    width: "16%",
  },
  { key: "subCategoryCount", label: "Sub Category", width: "12%" },
  {
    key: "effectiveDate",
    label: "Effective Date",
    icon: "MdOutlineCalendarToday",
    filterable: "date",
    width: "14%",
  },
  { key: "targetQuantity", label: "Target Qty", sortable: true, width: "10%" },
  {
    key: "eligibleIncentive",
    label: "Eligible Incentive (₹)",
    sortable: true,
    width: "16%",
  },
  { key: "productCount", label: "Products", width: "11%" },
  {
    key: "status",
    label: "Status",
    icon: "FaSlidersH",
    filterable: "select",
    width: "11%",
  },
  { key: "action", label: "Action", width: "10%" },
];

const CATEGORY_NAMES = [
  "Mixer Grinder",
  "Microwave Oven",
  "Rice Cooker",
  "Air Fryer",
  "Induction Cooktops",
  "Refrigerators",
  "Chimneys",
  "Built-in Hobs",
  "Water Purifiers",
  "Electric Kettles",
  "Washing Machines",
  "Air Conditioners",
  "Ceiling Fans",
  "Table Fans",
  "Room Heaters",
  "Iron Box",
  "Vacuum Cleaners",
  "Dishwashers",
  "Food Processors",
  "Hand Blenders",
  "Toasters",
  "Coffee Makers",
  "Sandwich Makers",
  "Electric Grills",
  "Juicers",
  "Egg Boilers",
  "Deep Fryers",
  "Steam Irons",
  "Hair Dryers",
  "Trimmers",
  "Shavers",
  "Water Heaters",
  "Geysers",
  "Immersion Rods",
  "Emergency Lights",
  "Inverters",
  "Stabilizers",
  "UPS Systems",
  "LED Bulbs",
  "LED Panels",
  "Tube Lights",
  "Smart Switches",
  "CCTV Cameras",
  "Video Doorbells",
  "Smart Speakers",
  "Air Coolers",
  "Dehumidifiers",
  "Humidifiers",
];

const PRODUCT_COUNTS = [12, 15, 24, 18, 18, 18, 18, 18, 18, 18];

export const PRODUCT_MOCK_FLAT_DATA: ProductFlatRow[] = CATEGORY_NAMES.map(
  (name, i) => ({
    category: name,
    subCategoryCount: 3,
    effectiveDate: "01 Jan 2026",
    targetQuantity: i % 10 === 0 ? 200 : 250,
    eligibleIncentive: i % 10 === 0 ? 600 : 800,
    productCount: PRODUCT_COUNTS[i % 10],
    status: (i % 10 === 4
      ? "Not Available"
      : i % 10 === 3 || i % 10 === 6
        ? "Inactive"
        : "Active") as ProductFlatRow["status"],
  }),
);

export function flattenProducts(rows: ProductUploadRow[]): ProductFlatRow[] {
  const categoryMap = new Map<
    string,
    {
      subCats: Set<string>;
      productCount: number;
      effectiveDate: string;
      targetQuantity: number;
      eligibleIncentive: number;
    }
  >();

  rows.forEach((row) => {
    const key = row.Category;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        subCats: new Set(),
        productCount: 0,
        effectiveDate: row["Effective Date"],
        targetQuantity: row["Target Quantity"],
        eligibleIncentive: row["Eligible Incentive (₹)"],
      });
    }
    const cat = categoryMap.get(key)!;
    cat.subCats.add(row["Sub Category"]);
    cat.productCount++;
  });

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    subCategoryCount: data.subCats.size,
    effectiveDate: data.effectiveDate,
    targetQuantity: data.targetQuantity,
    eligibleIncentive: data.eligibleIncentive,
    productCount: data.productCount,
    status: "Active" as const,
  }));
}

/* ---- Product Detail Modal ---- */

export const PRODUCT_DETAIL_COLUMNS: GroupedTableColumn[] = [
  {
    key: "subCategory",
    label: "Sub Category",
    icon: "FiSearch",
    filterable: "text",
    width: "207px",
  },
  {
    key: "product",
    label: "Products",
    icon: "FiSearch",
    filterable: "text",
    width: "300px",
  },
  {
    key: "effectiveDate",
    label: "Effective Date",
    icon: "MdOutlineCalendarToday",
    filterable: "date",
    width: "133px",
  },
  {
    key: "location",
    label: "Location",
    icon: "FiSearch",
    filterable: "text",
    width: "230px",
  },
  { key: "status", label: "Status", width: "95px" },
  { key: "action", label: "Action", width: "6%", align: "right" },
];

const DETAIL_PRODUCT_MODELS = [
  "MX-AC300-H",
  "MX-AC400",
  "MX-AV325",
  "MX-AV425",
];
const DETAIL_LOCATIONS = [
  "T.Nagar, Perambalur, Pondy Bazzar",
  "Anna Nagar",
  "HSR Layout",
  "Anna Nagar",
];
const DETAIL_DATES = [
  "01 Jan 2026",
  "01 Jan 2026",
  "01 Mar 2026",
  "01 Apr 2026",
];
const DETAIL_STATUSES: ProductDetailEntry["status"][][] = [
  ["Active", "Active", "Active", "Active"],
  ["Active", "Inactive", "Not Available", "Active"],
  ["Active", "Inactive", "Active", "Inactive"],
];

const SUB_CATEGORY_PREFIXES = ["Standard", "Juicer", "Heavy Duty"];

export function getProductDetailData(category: string): ProductDetailData {
  return {
    category,
    subCategories: SUB_CATEGORY_PREFIXES.map((prefix, si) => ({
      subCategory: `${prefix} ${category}`,
      products: DETAIL_PRODUCT_MODELS.map((model, pi) => ({
        product: `Panasonic ${model}`,
        effectiveDate: DETAIL_DATES[pi],
        location: DETAIL_LOCATIONS[pi],
        status: DETAIL_STATUSES[si % 3][pi],
      })),
    })),
  };
}

/* ---- Product Activity Log Mock Data ---- */

export function getSubCategoryActivityLog(
  subCategory: string,
): ProductActivityLogEntry[] {
  void subCategory;
  return [
    {
      date: "22 May 2025",
      time: "1:15pm",
      updatedBy: "Updated by Sales Manager",
      fields: [
        { label: "Effective Date", value: "10 Feb 2025" },
        { label: "Target Quantity", value: "300" },
        { label: "Eligible Incentive(₹)", value: "800" },
      ],
    },
    {
      date: "21 May 2026",
      time: "12:40pm",
      updatedBy: "Updated by Sales Manager",
      fields: [
        { label: "Effective Date", value: "12 Feb 2025" },
        { label: "Target Quantity", value: "300" },
        { label: "Eligible Incentive(₹)", value: "800" },
      ],
    },
  ];
}

export function getProductActivityLog(
  product: string,
  _subCategory: string,
): ProductActivityLogEntry[] {
  void product;
  return [
    {
      date: "22 May 2025",
      time: "1:15pm",
      updatedBy: "Updated by Sales Manager",
      fields: [
        { label: "Price (₹)", value: "3999" },
        { label: "Location", value: "Anna Nagar" },
        { label: "Effective Date", value: "10 Feb 2025" },
      ],
    },
    {
      date: "21 May 2026",
      time: "12:40pm",
      updatedBy: "Updated by Sales Manager",
      fields: [
        { label: "Price (₹)", value: "3999" },
        { label: "Location", value: "Anna Nagar" },
        { label: "Effective Date", value: "10 Feb 2025" },
      ],
    },
    {
      date: "21 May 2026",
      time: "12:40pm",
      updatedBy: "Updated by Sales Manager",
      fields: [
        { label: "Price (₹)", value: "3999" },
        { label: "Location", value: "Anna Nagar" },
        { label: "Effective Date", value: "10 Feb 2025" },
      ],
    },
    {
      date: "21 May 2026",
      time: "12:40pm",
      updatedBy: "Updated by Sales Manager",
      fields: [
        { label: "Price (₹)", value: "3999" },
        { label: "Location", value: "Anna Nagar" },
        { label: "Effective Date", value: "10 Feb 2025" },
      ],
    },
  ];
}
