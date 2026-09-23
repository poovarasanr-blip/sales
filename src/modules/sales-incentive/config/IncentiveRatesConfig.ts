import type {
  GroupedTableColumn,
  ProductActivityLogEntry,
  BulkUploadColumnConfig,
  CategoryGroup,
  IncentiveRatesUploadRow,
} from "../types/salesIncentive.types";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface IncentiveRateSubItem {
  subCategory: string;
  eligibleIncentive: number;
  effectiveDate: string;
}

export interface IncentiveRateCategory {
  category: string;
  items: IncentiveRateSubItem[];
}

/* ------------------------------------------------------------------ */
/* Table columns — matches the screenshot exactly                      */
/* ------------------------------------------------------------------ */

export const INCENTIVE_RATES_COLUMNS: GroupedTableColumn[] = [
  {
    key: "category",
    label: "Category",
    icon: "FiSearch",
    filterable: "text",
    width: "18%",
    mergeRowSpan: true,
  },
  {
    key: "subCategory",
    label: "Sub Category",
    icon: "FiSearch",
    filterable: "text",
    width: "25%",
  },
  {
    key: "eligibleIncentive",
    label: "Eligible Incentive(₹)",
    width: "18%",
    mergeRowSpan: false,
  },
  {
    key: "effectiveDate",
    label: "Effective Date",
    icon: "MdOutlineCalendarToday",
    filterable: "date",
    width: "18%",
  },
  {
    key: "action",
    label: "Action",
    width: "12%",
    align: "center",
    alineItem: "center",
  },
];

/* ------------------------------------------------------------------ */
/* Bulk upload column config                                           */
/* ------------------------------------------------------------------ */

export const INCENTIVE_RATES_UPLOAD_COLUMNS: BulkUploadColumnConfig<IncentiveRatesUploadRow>[] =
  [
    {
      key: "IncentiveProductCategory",
      header: "Category",
      required: true,
      type: "string",
      groupLevel: 1,
    },
    {
      key: "IncentiveProductSubCategory",
      header: "Sub Category",
      required: true,
      type: "string",
    },
    {
      key: "IncentiveProduct",
      header: "Product",
      required: true,
      type: "string",
    },
    {
      key: "EligibleIncentive",
      header: "Eligible Incentive(₹)/Product",
      required: true,
      type: "number",
    },
    {
      key: "Effective Date",
      header: "Effective Date",
      required: true,
      type: "date",
    },
  ];

const DISPLAY_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDMY(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900)
    return null;
  return `${String(day).padStart(2, "0")} ${DISPLAY_MONTH_NAMES[month - 1]} ${year}`;
}

export function formatDateForDisplay(raw: unknown): string | null {
  if (raw == null) return null;

  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    return formatDMY(raw.getDate(), raw.getMonth() + 1, raw.getFullYear());
  }

  if (typeof raw === "number") {
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return formatDMY(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
  }

  const str = String(raw).trim();
  if (!str) return null;

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return formatDMY(parseInt(dmy[1]), parseInt(dmy[2]), parseInt(dmy[3]));

  // YYYY-MM-DD (ISO)
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return formatDMY(parseInt(iso[3]), parseInt(iso[2]), parseInt(iso[1]));

  // Already in display format DD Mon YYYY
  const display = str.match(
    /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i,
  );
  if (display) {
    const mi = DISPLAY_MONTH_NAMES.findIndex(
      (m) => m.toLowerCase() === display[2].toLowerCase(),
    );
    if (mi >= 0)
      return formatDMY(parseInt(display[1]), mi + 1, parseInt(display[3]));
  }

  // Numeric string (e.g. serial passed as text)
  if (/^\d+(\.\d+)?$/.test(str)) {
    return formatDateForDisplay(parseFloat(str));
  }

  return null;
}


/* ------------------------------------------------------------------ */
/* Mock data — 48 categories matching the screenshot pagination        */
/* ------------------------------------------------------------------ */

/** Hand-crafted first 5 categories (visible on first page in screenshot) */
const HAND_CRAFTED: Record<string, IncentiveRateSubItem[]> = {
  "Mixer Grinder": [
    {
      subCategory: "Standard Mixer Grinder",
      eligibleIncentive: 10,
      effectiveDate: "01 Jan 2026",
    },
    {
      subCategory: "Juicer Mixer Grinder",
      eligibleIncentive: 15,
      effectiveDate: "01 Apr 2026",
    },
    {
      subCategory: "Basic Mixer Grinder",
      eligibleIncentive: 10,
      effectiveDate: "01 Jan 2026",
    },
    {
      subCategory: "Heavy Duty Mixer Grinder",
      eligibleIncentive: 18,
      effectiveDate: "01 Apr 2026",
    },
  ],
  "Rice Cooker": [
    {
      subCategory: "Basic Rice Cooker",
      eligibleIncentive: 10,
      effectiveDate: "01 Jan 2026",
    },
    {
      subCategory: "Automatic Rice Cooker",
      eligibleIncentive: 15,
      effectiveDate: "01 Apr 2026",
    },
    {
      subCategory: "Electric Rice Cooker",
      eligibleIncentive: 10,
      effectiveDate: "01 Apr 2026",
    },
  ],
  "Microwave Oven": [
    {
      subCategory: "Solo Microwave Oven",
      eligibleIncentive: 10,
      effectiveDate: "01 Jan 2026",
    },
    {
      subCategory: "Grill Microwave Oven",
      eligibleIncentive: 15,
      effectiveDate: "01 Apr 2026",
    },
    {
      subCategory: "Convection Microwave Oven",
      eligibleIncentive: 10,
      effectiveDate: "01 Apr 2026",
    },
    {
      subCategory: "Heavy Duty Microwave Oven",
      eligibleIncentive: 18,
      effectiveDate: "01 Apr 2026",
    },
  ],
  "Air Fryer": [
    {
      subCategory: "Compact Air Fryer",
      eligibleIncentive: 10,
      effectiveDate: "01 Jan 2026",
    },
    {
      subCategory: "Digital Air Fryer",
      eligibleIncentive: 15,
      effectiveDate: "01 Apr 2026",
    },
    {
      subCategory: "Air Fryer Oven",
      eligibleIncentive: 10,
      effectiveDate: "01 Apr 2026",
    },
  ],
  "Electric Kettle": [
    {
      subCategory: "Standard Electric Kettle",
      eligibleIncentive: 10,
      effectiveDate: "01 Jan 2026",
    },
    {
      subCategory: "Stainless Steel Kettle",
      eligibleIncentive: 15,
      effectiveDate: "01 Apr 2026",
    },
    {
      subCategory: "Thermo Pot",
      eligibleIncentive: 10,
      effectiveDate: "01 Apr 2026",
    },
    {
      subCategory: "Heavy Duty Thermo Pot",
      eligibleIncentive: 18,
      effectiveDate: "01 Apr 2026",
    },
  ],
};

/** Additional category names to reach 48 total categories */
const EXTRA_CATEGORIES = [
  "Induction Cooktops",
  "Refrigerators",
  "Chimneys",
  "Built-in Hobs",
  "Water Purifiers",
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

const SUB_PREFIXES_3 = ["Standard", "Premium", "Basic"];
const SUB_PREFIXES_4 = ["Standard", "Premium", "Basic", "Heavy Duty"];
const INCENTIVES_3 = [10, 15, 10];
const INCENTIVES_4 = [10, 15, 10, 18];
const DATES_3 = ["01 Jan 2026", "01 Apr 2026", "01 Apr 2026"];
const DATES_4 = ["01 Jan 2026", "01 Apr 2026", "01 Jan 2026", "01 Apr 2026"];

function generateSubItems(
  category: string,
  index: number,
): IncentiveRateSubItem[] {
  const use4 = index % 2 === 0;
  const prefixes = use4 ? SUB_PREFIXES_4 : SUB_PREFIXES_3;
  const incentives = use4 ? INCENTIVES_4 : INCENTIVES_3;
  const dates = use4 ? DATES_4 : DATES_3;
  return prefixes.map((prefix, i) => ({
    subCategory: `${prefix} ${category}`,
    eligibleIncentive: incentives[i],
    effectiveDate: dates[i],
  }));
}

export const INCENTIVE_RATES_MOCK_DATA: IncentiveRateCategory[] = [
  ...Object.entries(HAND_CRAFTED).map(([category, items]) => ({
    category,
    items,
  })),
  ...EXTRA_CATEGORIES.map((cat, i) => ({
    category: cat,
    items: generateSubItems(cat, i),
  })),
];

/* ------------------------------------------------------------------ */
/* Activity log mock                                                   */
/* ------------------------------------------------------------------ */

export function toIncentiveRatesTableData(
  categories: IncentiveRateCategory[],
): CategoryGroup[] {
  return categories.map((cat) => ({
    category: cat.category,
    targetQuantity: "",
    eligibleIncentive: "",
    subCategories: cat.items.map((item) => ({
      subCategory: item.subCategory,
      products: [
        {
          product: item.subCategory,
          effectiveDate: item.effectiveDate,
        },
      ],
      incentive: item.eligibleIncentive,
    })),
  }));
}

export function getIncentiveRateActivityLog(
  _subCategory: string,
): ProductActivityLogEntry[] {
  return [
    {
      date: "22 May 2026",
      time: "1:15pm",
      updatedBy: "Updated by Sales Manager",
      fields: [
        { label: "Eligible Incentive(₹)", value: "15" },
        { label: "Effective Date", value: "01 Apr 2026" },
      ],
    },
    {
      date: "10 Jan 2026",
      time: "10:30am",
      updatedBy: "Updated by Super Manager",
      fields: [
        { label: "Eligible Incentive(₹)", value: "10" },
        { label: "Effective Date", value: "01 Jan 2026" },
      ],
    },
  ];
}
