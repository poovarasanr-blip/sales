import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import NoDataFound from "../../../../../shared/components/ui/NoDataFound/NoDataFound";
import BulkUploadCard from "../../../../../shared/components/ui/BulkUpload/BulkUploadCard";
import {
  PRODUCT_SAMPLE_ROWS,
  PRODUCT_UPLOAD_COLUMNS,
  PRODUCT_FLAT_COLUMNS,
  PRODUCT_MOCK_FLAT_DATA,
  flattenProducts,
  getProductDetailData,
  getSubCategoryActivityLog,
  type ProductUploadRow,
} from "../../../config/Productbulkupload";
import type {
  ProductFlatRow,
  ProductDetailData,
  ProductActivityLogEntry,
  GroupedTableColumn,
  SortDirection,
} from "../../../types/salesIncentive.types";
import CustomModal from "../../../../../shared/components/ui/Modal/CustomModal";
import ProductDetailModal from "../ProductDetailModal/ProductDetailModal";
import ProductActivityLog from "../ActivityLog/ProductActivityLog";
import { generateSampleFile } from "../../../../../shared/utils/BulkuploadUtils";
import { useBulkUpload } from "../../../hooks/Usebulkupload";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import CustomInput from "../../../../../shared/components/forms/FormInput/CustomTextInput";

interface ProductListLocationState {
  bulkUploadSuccessCount?: number;
  addedProducts?: ProductUploadRow[];
}

const PAGE_SIZE = 10;

const STATUS_OPTIONS: ProductFlatRow["status"][] = [
  "Active",
  "Inactive",
  "Not Available",
];

function getStatusColor(status: ProductFlatRow["status"]) {
  switch (status) {
    case "Active":
      return { text: "text-[#22C55E]", bg: "bg-[#22C55E]" };
    case "Inactive":
      return { text: "text-danger", bg: "bg-danger" };
    case "Not Available":
      return { text: "text-[#F59E0B]", bg: "bg-[#F59E0B]" };
  }
}

const MONTHS = [
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

function displayToISO(display: string): string {
  const parts = display.split(" ");
  const day = parts[0].padStart(2, "0");
  const month = String(MONTHS.indexOf(parts[1]) + 1).padStart(2, "0");
  return `${parts[2]}-${month}-${day}`;
}

function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

const TODAY_ISO = new Date().toISOString().split("T")[0];

/* ---- Header Cell ---- */

interface FlatHeaderCellProps {
  column: GroupedTableColumn;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  filterValue: string;
  onFilterChange: (v: string) => void;
  sortDirection: SortDirection | null;
  onSortClick: () => void;
  filterOptions?: string[];
}

function FlatHeaderCell({
  column,
  isFilterOpen,
  onToggleFilter,
  filterValue,
  onFilterChange,
  sortDirection,
  onSortClick,
  filterOptions,
}: FlatHeaderCellProps) {
  const isOpen = isFilterOpen && !!column.filterable;

  const iconName = isOpen
    ? "LuX"
    : column.sortable
      ? sortDirection === "asc"
        ? "LuArrowUp"
        : sortDirection === "desc"
          ? "LuArrowDown"
          : (column.icon ?? "LuArrowUpDown")
      : column.icon;

  const labelClass = "text-12 font-semibold text-darkgray";
  const isInteractive = !!(column.sortable || column.filterable);

  function handleIconClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (column.sortable) onSortClick();
    else if (column.filterable) onToggleFilter();
  }

  return (
    <th
      className="h-[33px] px-4 py-2 sticky top-0 z-10 bg-white whitespace-nowrap"
      style={{ textAlign: column.align ?? "left", width: column.width }}
    >
      <div className="flex items-center w-full">
        {isOpen && column.filterable === "text" ? (
          <input
            autoFocus
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder={column.label}
            className={`${labelClass} border-none outline-none bg-transparent w-full p-0`}
          />
        ) : isOpen && column.filterable === "select" ? (
          <select
            autoFocus
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className={`${labelClass} border-none outline-none bg-transparent cursor-pointer p-0`}
          >
            <option value="">All {column.label}</option>
            {filterOptions?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : isOpen && column.filterable === "date" ? (
          <input
            autoFocus
            type="date"
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className={`${labelClass} border-none outline-none bg-transparent cursor-pointer p-0`}
          />
        ) : (
          <span className={labelClass}>{column.label}</span>
        )}
        {iconName && (
          <span
            className={`ml-[13px] inline-flex flex-shrink-0 ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
            onClick={handleIconClick}
          >
            <IconRenderer icon={iconName} size={16} />
          </span>
        )}
      </div>
    </th>
  );
}

/* ---- Display Cell ---- */

function FlatCell({
  column,
  row,
  onOpenDetail,
  onOpenLog,
}: {
  column: GroupedTableColumn;
  row: ProductFlatRow;
  onOpenDetail?: (category: string) => void;
  onOpenLog?: (category: string) => void;
}) {
  switch (column.key) {
    case "category":
      return <span>{row.category}</span>;
    case "subCategoryCount":
      return (
        <span
          className="text-primary cursor-pointer inline-flex items-center gap-[2px]"
          onClick={() => onOpenDetail?.(row.category)}
        >
          {row.subCategoryCount} Items
          <IconRenderer
            icon="MdChevronRight"
            size={16}
            className="text-primary"
          />
        </span>
      );
    case "effectiveDate":
      return <>{row.effectiveDate}</>;
    case "targetQuantity":
      return <>{row.targetQuantity}</>;
    case "eligibleIncentive":
      return <>{row.eligibleIncentive}</>;
    case "productCount":
      return (
        <span
          className="text-primary cursor-pointer inline-flex items-center gap-[2px]"
          onClick={() => onOpenDetail?.(row.category)}
        >
          {row.productCount} Items
          <IconRenderer
            icon="MdChevronRight"
            size={16}
            className="text-primary"
          />
        </span>
      );
    case "status": {
      const colors = getStatusColor(row.status);
      return (
        <span
          className={`inline-flex items-center gap-[6px] text-12 font-medium ${colors.text}`}
        >
          <span className={`w-[8px] h-[8px] rounded-full ${colors.bg}`} />
          {row.status}
        </span>
      );
    }
    case "action":
      return (
        <div className="flex items-center justify-center gap-[15px]">
          <button
            aria-label="History"
            className="cursor-pointer"
            onClick={() => onOpenLog?.(row.category)}
          >
            <IconRenderer
              icon={PageLayOut?.Products?.HistoryIcon ?? "GoHistory"}
              size={16}
              className="text-gray"
            />
          </button>
          <button aria-label="Edit" className="cursor-pointer">
            <IconRenderer
              icon={PageLayOut?.Products?.EditIcon ?? "RxPencil1"}
              size={16}
              className="text-gray"
            />
          </button>
        </div>
      );
    default:
      return null;
  }
}

/* ---- Edit Cell ---- */

function EditCell({
  column,
  row,
  editValues,
  onEditChange,
  onCancel,
  onConfirm,
}: {
  column: GroupedTableColumn;
  row: ProductFlatRow;
  editValues: Partial<ProductFlatRow>;
  onEditChange: (key: string, value: string | number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const inputClass =
    "w-[80%] h-[29px] px-2 text-13 text-[#59596C] border border-[#ddd] rounded-4 outline-none bg-white";

  switch (column.key) {
    case "category":
      return <span>{row.category}</span>;
    case "subCategoryCount":
      return (
        <span className="text-primary cursor-pointer inline-flex items-center gap-[2px]">
          {row.subCategoryCount} Items
          <IconRenderer
            icon="MdChevronRight"
            size={16}
            className="text-primary"
          />
        </span>
      );
    case "effectiveDate":
      return (
        <input
          type="date"
          min={TODAY_ISO}
          value={displayToISO(editValues.effectiveDate ?? row.effectiveDate)}
          onChange={(e) =>
            onEditChange("effectiveDate", isoToDisplay(e.target.value))
          }
          className={`${inputClass} cursor-pointer`}
        />
      );
    case "targetQuantity":
      return (
        <input
          type="number"
          value={editValues.targetQuantity ?? row.targetQuantity}
          onChange={(e) =>
            onEditChange("targetQuantity", Number(e.target.value))
          }
          className={inputClass}
        />
      );
    case "eligibleIncentive":
      return (
        <input
          type="number"
          value={editValues.eligibleIncentive ?? row.eligibleIncentive}
          onChange={(e) =>
            onEditChange("eligibleIncentive", Number(e.target.value))
          }
          className={inputClass}
        />
      );
    case "productCount":
      return (
        <span className="text-primary cursor-pointer inline-flex items-center gap-[2px]">
          {row.productCount} Items
          <IconRenderer
            icon="MdChevronRight"
            size={16}
            className="text-primary"
          />
        </span>
      );
    case "status": {
      const currentStatus = editValues.status ?? row.status;
      return (
        <div className="relative h-[29px]">
          <select
            value={currentStatus}
            onChange={(e) =>
              onEditChange(
                "status",
                e.target.value as unknown as string | number,
              )
            }
            className={`${inputClass} w-full appearance-none cursor-pointer bg-white pr-8`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconRenderer
              icon="IoMdArrowDropdown"
              size={18}
              className="text-[#59596C]"
            />
          </span>
        </div>
      );
    }
    case "action":
      return (
        <div className="flex items-center justify-center gap-[15px]">
          <button aria-label="Cancel" onClick={onCancel}>
            <IconRenderer
              icon="FaRegTimesCircle"
              size={18}
              className="text-danger"
            />
          </button>
          <button aria-label="Confirm" onClick={onConfirm}>
            <IconRenderer
              icon="LuCircleCheckBig"
              size={18}
              className="text-[#22C55E]"
            />
          </button>
        </div>
      );
    default:
      return null;
  }
}

/* ---- Main Component ---- */

export default function ProductList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadingFile, fileError, startUpload } =
    useBulkUpload<ProductUploadRow>(PRODUCT_UPLOAD_COLUMNS);

  const [products, setProducts] = useState<ProductFlatRow[]>(
    PRODUCT_MOCK_FLAT_DATA,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(null);
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProductFlatRow>>({});
  const [detailData, setDetailData] = useState<ProductDetailData | null>(null);
  const [activityLog, setActivityLog] = useState<{
    title: string;
    entries: ProductActivityLogEntry[];
  } | null>(null);

  function openDetail(category: string) {
    setDetailData(getProductDetailData(category));
  }

  function openLog(category: string) {
    setActivityLog({
      title: category,
      entries: getSubCategoryActivityLog(category),
    });
  }
  function closeDetail() {
    setDetailData(null);
  }

  useEffect(() => {
    const state = location.state as ProductListLocationState | undefined;
    if (!state?.addedProducts?.length) return;
    const newFlat = flattenProducts(state.addedProducts);
    setProducts((prev) => [...prev, ...newFlat]);
    showToast({
      type: "success",
      title: "Success!",
      message: `${state.bulkUploadSuccessCount ?? state.addedProducts.length} products has been added`,
      duration: 3000,
    });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const filteredProducts = useMemo(() => {
    let result = products;
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => p.category.toLowerCase().includes(q));
    }
    const categoryQ = (textFilters.category ?? "").trim();
    if (categoryQ) {
      result = result.filter((p) => p.category === categoryQ);
    }
    const statusQ = (textFilters.status ?? "").trim();
    if (statusQ) {
      result = result.filter((p) => p.status === statusQ);
    }
    const dateQ = (textFilters.effectiveDate ?? "").trim();
    if (dateQ) {
      result = result.filter((p) => displayToISO(p.effectiveDate) === dateQ);
    }
    if (sort) {
      const key = sort.key as keyof ProductFlatRow;
      result = [...result].sort((a, b) => {
        const av = Number(a[key]) || 0;
        const bv = Number(b[key]) || 0;
        return sort.direction === "asc" ? av - bv : bv - av;
      });
    }
    return result;
  }, [products, searchTerm, textFilters, sort]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [filteredProducts, currentPage],
  );
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalItems);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, textFilters, sort]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  function startEdit(row: ProductFlatRow) {
    setEditingCategory(row.category);
    setEditValues({
      effectiveDate: row.effectiveDate,
      targetQuantity: row.targetQuantity,
      eligibleIncentive: row.eligibleIncentive,
      status: row.status,
    });
  }

  function cancelEdit() {
    setEditingCategory(null);
    setEditValues({});
  }

  function confirmEdit() {
    if (!editingCategory) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.category === editingCategory
          ? { ...p, ...(editValues as Partial<ProductFlatRow>) }
          : p,
      ),
    );
    setEditingCategory(null);
    setEditValues({});
  }

  function handleEditChange(key: string, value: string | number) {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  }

  const handleSampleDownload = useCallback(() => {
    generateSampleFile(
      PRODUCT_UPLOAD_COLUMNS,
      PRODUCT_SAMPLE_ROWS,
      "Product_Bulk_Upload_Sample.xlsx",
      "Products",
    );
  }, []);

  const handleDownloadExcel = useCallback(() => {
    const exportRows = filteredProducts.map((p) => ({
      Category: p.category,
      "Sub Category": `${p.subCategoryCount} Items`,
      "Effective Date": p.effectiveDate,
      "Target Quantity": p.targetQuantity,
      "Eligible Incentive (₹)": p.eligibleIncentive,
      Products: `${p.productCount} Items`,
      Status: p.status,
    }));
    const exportCols: {
      key: string;
      header: string;
      required: boolean;
      type: "string" | "number";
    }[] = [
      { key: "Category", header: "Category", required: true, type: "string" },
      {
        key: "Sub Category",
        header: "Sub Category",
        required: true,
        type: "string",
      },
      {
        key: "Effective Date",
        header: "Effective Date",
        required: true,
        type: "string",
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
      { key: "Products", header: "Products", required: true, type: "string" },
      { key: "Status", header: "Status", required: true, type: "string" },
    ];
    generateSampleFile(exportCols, exportRows, "Products.xlsx", "Products");
  }, [filteredProducts]);

  const handleFilesReceived = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;
      const result = await startUpload(file);
      if (!result) return;
      navigate("/bulkUpload", {
        state: {
          validRows: result.validRows,
          invalidRows: result.invalidRows,
        },
      });
    },
    [startUpload, navigate],
  );

  const handleBrowseClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) handleFilesReceived(target.files);
    };
    input.click();
  }, [handleFilesReceived]);

  const filterOptionsMap = useMemo<Record<string, string[]>>(
    () => ({
      category: [...new Set(products.map((p) => p.category))].sort(),
      status: [...STATUS_OPTIONS],
    }),
    [products],
  );

  const hasProducts = products.length > 0;

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    for (let i = start; i < start + 3 && i <= totalPages; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div
      className={`px-h pt-12 bg-bgcolor flex flex-col ${hasProducts ? "h-full overflow-hidden" : "min-h-[100%] overflow-scroll scrollbar-hide"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-heading-6 text-darkgray">
          {PageLayOut?.Products?.PageTitle}
        </p>
        <div className="flex items-center gap-12">
          <CustomButton
            title={
              PageLayOut?.Products?.CustomButtons?.AddProductButton?.Name ??
              "+ Add Products"
            }
            backgroundColor="bg-white"
            height="h-37"
            gap="gap-[7px]"
            borderRadius="rounded-6"
            borderColor="border-primary"
            textColor="text-primary"
            borderWidth="border-1"
            onClick={() => navigate("/product/add")}
          />
          {PageLayOut?.Products?.IsBulkUploadRequired && (
            <CustomButton
              backgroundColor="bg-primary"
              height="h-37"
              width="w-[119px]"
              gap="gap-[7px]"
              title={PageLayOut?.Products?.CustomButtons?.UploadButton?.Name}
              borderRadius="rounded-6"
              textColor="text-white"
              icon={
                <IconRenderer
                  icon={PageLayOut?.Products?.CustomButtons?.UploadButton?.Icon}
                  size={16}
                  className="text-white"
                />
              }
              iconPosition="left"
              onClick={handleBrowseClick}
            />
          )}
        </div>
      </div>

      {hasProducts ? (
        <div className="flex-1 min-h-0 border-1 border-strokegray rounded-6 bg-white mt-14 mb-14 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-16 mt-14">
            <div className="w-[360px]">
              <CustomInput
                rightIcon="FiSearch"
                placeholder="Search..."
                height={"h-[42px]"}
                rightIconStyle="text-gray"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e)}
              />
            </div>
            <CustomButton
              title={
                PageLayOut?.Products?.CustomButtons?.DownloadButton?.Name ??
                "Download Excel"
              }
              backgroundColor="bg-white"
              textColor="text-primary"
              height="h-37"
              gap="gap-[10px]"
              borderRadius="rounded-6"
              borderColor="border-primary"
              borderWidth="border-1"
              icon={
                <IconRenderer
                  icon="LuDownload"
                  size={15}
                  className="text-primary"
                />
              }
              iconPosition="left"
              onClick={handleDownloadExcel}
            />
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 px-16 mt-10">
            <div className="border border-[#eee] rounded-4 overflow-auto max-h-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#eee]">
                    {PRODUCT_FLAT_COLUMNS.map((col) => (
                      <FlatHeaderCell
                        key={col.key}
                        column={col}
                        isFilterOpen={openFilterKey === col.key}
                        onToggleFilter={() =>
                          setOpenFilterKey((prev) =>
                            prev === col.key ? null : col.key,
                          )
                        }
                        filterValue={textFilters[col.key] ?? ""}
                        onFilterChange={(v) =>
                          setTextFilters((prev) => ({
                            ...prev,
                            [col.key]: v,
                          }))
                        }
                        sortDirection={
                          sort?.key === col.key ? sort.direction : null
                        }
                        onSortClick={() => toggleSort(col.key)}
                        filterOptions={filterOptionsMap[col.key]}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={PRODUCT_FLAT_COLUMNS.length}
                        className="text-center py-20 text-gray text-13"
                      >
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    pagedProducts.map((row) => {
                      const isEditing = editingCategory === row.category;
                      return (
                        <tr
                          key={row.category}
                          className={`border-b border-[#eee] ${isEditing ? "bg-[#f9f9ff]" : ""}`}
                        >
                          {PRODUCT_FLAT_COLUMNS.map((col) => (
                            <td
                              key={col.key}
                              className="px-4 py-[11px] text-13 text-[#59596C]"
                              style={{ textAlign: col.align ?? "left" }}
                            >
                              {isEditing ? (
                                <EditCell
                                  column={col}
                                  row={row}
                                  editValues={editValues}
                                  onEditChange={handleEditChange}
                                  onCancel={cancelEdit}
                                  onConfirm={confirmEdit}
                                />
                              ) : col.key === "action" ? (
                                <div className="flex items-center justify-center gap-[15px]">
                                  <button
                                    aria-label="History"
                                    className="cursor-pointer"
                                    onClick={() => openLog(row.category)}
                                  >
                                    <IconRenderer
                                      icon={
                                        PageLayOut?.Products?.HistoryIcon ??
                                        "GoHistory"
                                      }
                                      size={16}
                                      className="text-gray"
                                    />
                                  </button>
                                  <button
                                    aria-label="Edit"
                                    className="cursor-pointer"
                                    onClick={() => startEdit(row)}
                                  >
                                    <IconRenderer
                                      icon={
                                        PageLayOut?.Products?.EditIcon ??
                                        "RxPencil1"
                                      }
                                      size={16}
                                      className="text-gray"
                                    />
                                  </button>
                                </div>
                              ) : (
                                <FlatCell
                                  column={col}
                                  row={row}
                                  onOpenDetail={openDetail}
                                  onOpenLog={openLog}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between px-16 pb-10 shrink-0 mt-10">
              <p className="text-13 text-gray">
                {rangeStart} – {rangeEnd} of {totalItems}
              </p>
              <div className="flex items-center gap-6 px-6 py-4">
                <button
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className={`w-[36px] h-[30px] rounded-6 bg-primary flex items-center justify-center ${
                    currentPage === 1 ? "cursor-not-allowed" : ""
                  }`}
                  aria-label="First page"
                >
                  <IconRenderer
                    icon="IoMdSkipBackward"
                    size={13}
                    className="text-white"
                  />
                </button>
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`w-[26px] h-[26px] flex items-center justify-center ${
                    currentPage === 1 ? "cursor-not-allowed" : ""
                  }`}
                  aria-label="Previous page"
                >
                  <IconRenderer
                    icon="MdChevronLeft"
                    size={18}
                    className="text-primary"
                  />
                </button>
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`min-w-[22px] h-[26px] px-4 text-13 flex items-center justify-center ${
                      num === currentPage
                        ? "text-primary font-semibold"
                        : "text-gray font-normal"
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`w-[26px] h-[26px] flex items-center justify-center ${
                    currentPage === totalPages ? "cursor-not-allowed" : ""
                  }`}
                  aria-label="Next page"
                >
                  <IconRenderer
                    icon="MdChevronRight"
                    size={18}
                    className="text-primary"
                  />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`w-[36px] h-[30px] rounded-6 bg-primary flex items-center justify-center ${
                    currentPage === totalPages ? "cursor-not-allowed" : ""
                  }`}
                  aria-label="Last page"
                >
                  <IconRenderer
                    icon="IoMdSkipForward"
                    size={13}
                    className="text-white"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 border-1 border-strokegray rounded-6 bg-white my-14 items-center justify-center">
          <NoDataFound
            description={PageLayOut?.NoDataFound?.SubTitle}
            title={PageLayOut?.NoDataFound?.Title}
          />
          <BulkUploadCard
            title={PageLayOut?.BuldUploadcard?.CardTitle}
            description={PageLayOut?.BuldUploadcard?.CardSubTitle}
            browseText={PageLayOut?.BuldUploadcard?.UploadLabel2}
            dragDropText={PageLayOut?.BuldUploadcard?.UploadLabel1}
            sampleButtonTitle={PageLayOut?.BuldUploadcard?.DownloadButtonText}
            sampleButtonIcon={PageLayOut?.BuldUploadcard?.DownloadIcon}
            uploadIcon={PageLayOut?.BuldUploadcard?.UploadIcon}
            filesHereText={PageLayOut?.BuldUploadcard?.UploadLabel3}
            onSampleDownload={handleSampleDownload}
            onBrowseClick={handleBrowseClick}
            onDrop={handleFilesReceived}
            uploadingFile={uploadingFile}
          />
          {fileError && (
            <p className="p-tiny text-red-600 mt-8 max-w-[632px] text-center">
              {fileError}
            </p>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <ProductDetailModal
        isOpen={!!detailData}
        onClose={closeDetail}
        detailData={detailData}
      />

      {/* Activity Log */}
      <ProductActivityLog
        isOpen={!!activityLog}
        onClose={() => setActivityLog(null)}
        title={activityLog?.title ?? ""}
        entries={activityLog?.entries ?? []}
      />
    </div>
  );
}
