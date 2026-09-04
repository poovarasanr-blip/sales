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
  charData?: SalesDealsChart[];
}
export interface SalesTopAchievedProps {
  pageLayOutData?: SalesOverviewData;
  data?: {
    EmployeeId?: string;
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
}
export interface ProductEntry {
  product: string;
  effectiveDate: string;
}
export interface SubCategoryGroup {
  subCategory: string;
  products: ProductEntry[];
}
export interface CategoryGroup {
  category: string;
  targetQuantity: string | number;
  eligibleIncentive: string | number;
  subCategories: SubCategoryGroup[];
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
  onStateChange?: (state: {
    textFilters: Record<string, string>;
    dateFilter: string;
    sort: { key: string; direction: SortDirection } | null;
  }) => void;
  showVerticalLines?: boolean;
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
  /** 0-100 */
  progress: number;
}
