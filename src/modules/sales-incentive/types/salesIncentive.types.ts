export interface RouteNavigation {
  name?: string;
  icon?: string;
  route?: string;
}
export interface BarDataItem {
  label: string;
  value1: number;
  value2: number;
  value3: number;
}
// Dashboard Types
export interface SalesOverviewData {
  Title?: string;
  Date?: string;
  DescriptionText?: string;
  Icon?: string;
}
export interface BarChartItem {
  label: string;
  values: number[];
}
export interface SalesOverviewLabel {
  label?: string;
  color?: string;
}
export interface SalesOverviewProps {
  pageLayOutData?: SalesOverviewData;
  labels: SalesOverviewLabel[];
  data: BarChartItem[];
}
export interface SalesSubmissionsData {
  Icon?: string;
  Name: string;
  Value: number;
  TextColor?: string;
  BackgroundColor?: string;
}
export interface SalesSubmissionsProps {
  pageLayOutData?: SalesOverviewData;
  pageData?: SalesSubmissionsData[];
}
export interface chartValues {
  BranchName?: string;
  Products?: BarDataItem[];
}
export interface SalesDealsChart {
  XAxis?: number[];
  Branches?: chartValues[];
}
export interface SalesDealerProps {
  pageLayOutData?: SalesOverviewData;
  labels?: SalesOverviewLabel[];
  charData?: SalesDealsChart;
}
export interface SalesTopAchievedProps {
  pageLayOutData?: SalesOverviewData;
  data?: {
    EmployeeId?: string | number;
    Employees?: number;
    Percentage?: number;
    EmployeeName?: string;
    Amount?: number;
    Color?: string;
  }[];
  TotalAchievement?: number;
  TotalEmployees?: number;
}
export interface CustomTableProps {
  header?: string;
}
export type SortDirection = "asc" | "desc";
export interface GroupedTableColumn {
  key: string;
  label: string;
  icon?: string;
  align?: "left" | "center" | "right";
  width?: string;
  sortable?: boolean;
  filterable?: "text" | "date";
  alineItem?: string;
  testSize?: number;
  fontWeight?: number;
  color?: string;
  mergeRowSpan?: boolean;
}
export interface ProductEntry {
  product: string;
  effectiveDate: string;
}
export interface SubCategoryGroup {
  subCategory: string;
  products: ProductEntry[];
  actual?: number;
  regularized?: number | null;
  target?: number;
  incentive?: number | null;
}
export interface CategoryGroup {
  employeeCode?: string;
  employeeName?: string;
  category: string;
  targetQuantity: string | number;
  eligibleIncentive: string | number;
  subCategories: SubCategoryGroup[];
  managerName?: string;
  managerCode?: string;
  storeName?: string;
  submittedDate?: string;
  actualAmount?: number;
  adjustment?: number;
  final?: number;
}
export interface GroupedIncentiveTableProps {
  columns: GroupedTableColumn[];
  data: CategoryGroup[];
  emptyMessage?: string;
  renderCustomCell?: (
    column: GroupedTableColumn,
    category: CategoryGroup,
    subCategory: SubCategoryGroup,
  ) => React.ReactNode;
  /** Opt-in override for one column's header cell (e.g. a "select all"
   * checkbox instead of a plain label) — return undefined for every other
   * column so its default label/sort/filter header renders unchanged.
   * Existing callers that don't pass this see no change at all. */
  renderCustomHeader?: (column: GroupedTableColumn) => React.ReactNode;
  onStateChange?: (state: {
    textFilters: Record<string, string>;
    dateFilter: string;
    sort: { key: string; direction: SortDirection } | null;
  }) => void;
  showVerticalLines?: boolean;
  pagination?: boolean;
  pageSize?: number;
  stripedGroups?: boolean;
  evenDataBackgroundColor?: string;
  paddingHorizontal?: string;
  paddingVertical?: string;
  hideSubRowBorders?: boolean;
}
export interface TeamSalesProps {
  pageLayOutData?: SalesOverviewData;
  labels?: SalesOverviewLabel[];
}
export interface NodataFoundProps {
  title?: string;
  description?: string;
}
export interface BulkUploadCardProps {
  title?: string;
  description?: string;
  sampleButtonTitle?: string;
  sampleButtonIcon?: string;
  dragDropText?: string;
  browseText?: string;
  filesHereText?: string;
  uploadIcon?: string;
  uploadIconSize?: number;
  uploadIconColor?: string;
  onSampleDownload?: () => void;
  onBrowseClick?: () => void;
  onDrop?: (files: FileList) => void;
  className?: string;
}
//Bulk Upload
export interface BulkUploadColumnConfig<T> {
  key: keyof T;
  header: string;
  required?: boolean;
  type?: "string" | "number" | "date";
}
export interface RowValidationResult<T> {
  rowNumber: number;
  data: T;
  errors: string[];
}
export interface BulkParseResult<T> {
  headerErrors: string[];
  validRows: RowValidationResult<T>[];
  invalidRows: RowValidationResult<T>[];
}
export interface UploadingFileState {
  name: string;
  progress: number;
}
export interface EmployeeSalesTargetUploadRow {
  "Employee Code": string;
  "Employee Name": string;
  Company: string;
  Location: string;
  "Manager Code": string;
  "Manager Name": string;
  Month: string;
  Category: string;
  "Sales Target (nos)": number;
  [key: string]: string | number;
}
export interface EmployeeTargetCategoryRow {
  category: string;
  salesTarget: number;
}
export interface EmployeeTargetGroup {
  employeeCode: string;
  employeeName: string;
  company: string;
  location: string;
  managerCode: string;
  managerName: string;
  month: string;
  categories: EmployeeTargetCategoryRow[];
}
export interface ManagerOption {
  label: string;
  value: string;
}
export interface TablePaginationProps {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
export interface ActualSalesUploadRow {
  "Employee Code": string;
  "Employee Name": string;
  Company: string;
  Location: string;
  "Manager Code": string;
  "Manager Name": string;
  Month: string;
  Category: string;
  "Actual Sales": number;
  Products?: string;
  [key: string]: string | number | undefined;
}
export interface ProductSalesDetail {
  product: string;
  actualSales: number;
}
export interface CategorySalesDetail {
  category: string;
  totalSales: number;
  products: ProductSalesDetail[];
}
export interface EmployeeSalesDetail {
  employeeCode: string;
  employeeName: string;
  role: string;
  company: string;
  location: string;
  managerName: string;
  month: string;
  categories: CategorySalesDetail[];
}
export interface ActualSalesDetailProduct {
  product: string;
  actualSales: number;
}
export interface ActualSalesDetailCategory {
  category: string;
  totalSales: number;
  products: ActualSalesDetailProduct[];
}
export interface ActualSalesEmployeeDetail {
  employeeCode: string;
  employeeName: string;
  role?: string;
  company: string;
  location: string;
  managerName: string;
  month: string;
  categories: ActualSalesDetailCategory[];
  groups: CategoryGroup[];
}
export interface IncentiveRow {
  "Employee Code": string;
  "Employee Name": string;
  "Manager Code": string;
  "Manager Name": string;
  StoreName?: string;
  Month: string;
  SubmittedDate?: string;
  Category:
    | "Mixer Grinders"
    | "Microwave Ovens"
    | "Rice Cookers"
    | "Induction Cooktops"
    | "Refrigerators";
  Actual: number;
  Regularized: number | null;
  Target: number;
  Incentive: number | null;
  IncentiveAmount: number;
  Adjustment: number;
}
export interface IncentiveExportRow {
  "Employee Code": string;
  "Employee Name": string;
  Manager: string;
  Category: string;
  Actual: number;
  Regularized: number | string;
  Target: number;
  Incentive: number | string;
  "Actual(₹)": number;
  "Adjustment(₹)": number;
  "Final(₹)": number;
  [key: string]: string | number;
}
export interface IncentiveCategoryLine {
  category: string;
  actual: number;
  regularized: number | null;
  target: number;
  incentive: number | null;
}
export interface IncentiveEmployeeGroup {
  employeeCode: string;
  employeeName: string;
  employeeSubtitle: string;
  manager: string;
  managerCode: string;
  submittedDate: string;
  rows: IncentiveCategoryLine[];
  actualAmount: number;
  adjustment: number;
  final: number;
}

/** One entry in the Incentive "Activity Log" drawer timeline. */
export interface ActivityLogEntry {
  date: string;
  time: string;
  /** e.g. "Sales" — who/what performed the action. */
  subject: string;
  /** e.g. "approved" / "rejected" — the colored verb in the sentence. */
  verb: string;
  verbColor?: "success" | "danger";
  /** e.g. "and incentive adjusted by HR Manager" — rest of the sentence. */
  suffix: string;
  existingIncentive: number;
  adjustment: number;
  finalIncentive: number;
  remarks?: string;
}

/* -------------------------------------------------------------------- */
/* Sales (approval) — salesConfig.json                                   */
/* -------------------------------------------------------------------- */

export type SalesStatus = "pending" | "approved" | "rejected";
export type SalesTabId = "PENDING" | "APPROVED" | "REJECTED";

export interface SalesEmployee {
  EmployeeId: string;
  EmployeeName: string;
  Dealer: string;
}
export interface SalesManager {
  ManagerId: string;
  ManagerName: string;
  SubmittedDate: string;
}
export interface SalesProductLine {
  SalesProductId: number;
  SalesProductName: string;
  ActualSales: number;
  RegularizedSales: number;
  SalesTarget: number;
  IncentiveAmount: number;
  AchievementPercentage: string;
}
export interface SalesDetailRemarks {
  HasAttachment: boolean;
  HasDocument: boolean;
}
export interface SalesRegularizedRow {
  Id: number;
  SalesProductName: string;
  Products: string[];
  ActualSales: (number | null)[];
  RegularizedSales: (number | null)[];
  Remarks: SalesDetailRemarks;
  OverallRegularizedSales: number;
  SalesTarget: number;
  IncentiveAmount: number | null;
  PerformanceRange: string;
}
export interface SalesRegularizedSalesDetail {
  Title: string;
  AchievedLegend: { Label: string; Color: string }[];
  Columns: { Key: string; Label: string }[];
  Rows: SalesRegularizedRow[];
}
export interface SalesAttachment {
  IsAvailable: boolean;
  Label: string;
  FileName: string | null;
}
export interface SalesMonthlyRow {
  Id: number;
  SalesDate: string;
  SalesCategoryName: string;
  SalesProductName: string;
  SalesQuantity: number;
  Attachment: SalesAttachment;
  SubmittedDate: string;
}
export interface SalesMonthlySalesDetail {
  Title: string;
  Columns: {
    Key: string;
    Label: string;
    IsFilterable?: boolean;
    Type?: string;
    Icon?: string;
    IsSortable?: boolean;
  }[];
  Rows: SalesMonthlyRow[];
}
/** Per-record detail payload — each Sales record owns its own, never shared. */
export interface SalesRecordDetails {
  RegularizedSales: SalesRegularizedSalesDetail;
  MonthlySales: SalesMonthlySalesDetail;
}
export interface SalesRecord {
  Id: number;
  RejectedDate?: string;
  Employee: SalesEmployee;
  Manager: SalesManager;
  SalesProducts: SalesProductLine[];
  ActualIncentiveAmount: number;
  AdjustmentAmount: number;
  FinalIncentiveAmount: number;
  Status: SalesStatus;
  Details: SalesRecordDetails;
}
export interface SalesConfigData {
  PendingColumnHeaders: unknown[];
  PendingData: SalesRecord[];
  ApprovedColumnHeaders: unknown[];
  ApprovedData: SalesRecord[];
  RejectedColumnHeaders: unknown[];
  RejectedData: SalesRecord[];
}

/** One row of the Sales list table — one per employee/record, 5 fixed
 * category sub-rows underneath (same grouping shape GroupedIncentiveTable
 * already renders for Incentive/Actual Sales). */
export interface SalesSubCategoryGroup extends SubCategoryGroup {
  achievementPercentage: number;
}
export interface SalesCategoryGroupRow extends CategoryGroup {
  salesId: number;
  status: SalesStatus;
  rejectedDate?: string;
  approvedDate?: string;
  dealer?: string;
  subCategories: SalesSubCategoryGroup[];
}
