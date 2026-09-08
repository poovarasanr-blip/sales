import React, { useEffect, useMemo, useState } from "react";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import type {
  CategoryGroup,
  GroupedIncentiveTableProps,
  GroupedTableColumn,
  SortDirection,
  SubCategoryGroup,
  TablePaginationProps,
} from "../../../../modules/sales-incentive/types/salesIncentive.types";

const CATEGORY_LEVEL_KEYS = new Set([
  "category",
  "targetQuantity",
  "eligibleIncentive",
]);

const DEFAULT_PAGE_SIZE = 10;

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function applyFilters(
  data: CategoryGroup[],
  textFilters: Record<string, string>,
  dateFilter: string,
): CategoryGroup[] {
  const categoryQ = (textFilters.category ?? "").trim().toLowerCase();
  const subCategoryQ = (textFilters.subCategory ?? "").trim().toLowerCase();
  const productQ = (textFilters.product ?? "").trim().toLowerCase();
  const selectedDate = dateFilter ? new Date(dateFilter) : null;

  return data
    .filter(
      (cat) => !categoryQ || cat.category.toLowerCase().includes(categoryQ),
    )
    .map((cat) => {
      const subCategories = cat.subCategories
        .filter(
          (sub) =>
            !subCategoryQ ||
            sub.subCategory.toLowerCase().includes(subCategoryQ),
        )
        .map((sub) => {
          const products = sub.products.filter((p) => {
            if (productQ && !p.product.toLowerCase().includes(productQ))
              return false;
            if (selectedDate) {
              const t = new Date(p.effectiveDate);
              if (Number.isNaN(t.getTime())) return false;
              if (!isSameDate(t, selectedDate)) return false;
            }
            return true;
          });
          return { ...sub, products };
        })
        .filter((sub) => sub.products.length > 0);

      return { ...cat, subCategories };
    })
    .filter((cat) => cat.subCategories.length > 0);
}

function applySort(
  data: CategoryGroup[],
  sort: { key: string; direction: SortDirection } | null,
): CategoryGroup[] {
  if (!sort) return data;
  const { key, direction } = sort;
  if (key !== "targetQuantity" && key !== "eligibleIncentive") return data;

  const sorted = [...data].sort((a, b) => {
    const av = Number(a[key]) || 0;
    const bv = Number(b[key]) || 0;
    return direction === "asc" ? av - bv : bv - av;
  });
  return sorted;
}

interface HeaderCellProps {
  column: GroupedTableColumn;
  isOpen: boolean;
  onToggleOpen: () => void;
  textValue: string;
  onTextChange: (v: string) => void;
  dateValue: string;
  onDateChange: (v: string) => void;
  sortDirection: SortDirection | null;
  onSortClick: () => void;
  alineItem?: string;
  /** Opt-in replacement for this cell's whole label/filter/icon area — only
   * set for a column when the caller's renderCustomHeader returns content
   * for it, so every other column (and every screen that never passes
   * renderCustomHeader at all) renders exactly as before. */
  customContent?: React.ReactNode;
}

function HeaderCell({
  column,
  isOpen,
  onToggleOpen,
  textValue,
  onTextChange,
  dateValue,
  onDateChange,
  sortDirection,
  onSortClick,
  alineItem = "flex-start",
  customContent,
}: HeaderCellProps) {
  const isFilterOpen = isOpen && !!column.filterable;

  const iconName = isFilterOpen
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
    else if (column.filterable) onToggleOpen();
  }

  return (
    <th
      className="grouped-table__th h-[33px] p-3 sticky top-0 z-10 bg-white"
      style={{
        textAlign: column.align ?? "left",
        width: column.width,
      }}
    >
      <div
        className="grouped-table__header-cell flex items-center w-full"
        style={{ justifyContent: alineItem }}
      >
        {customContent !== undefined ? (
          customContent
        ) : isOpen && column.filterable === "text" ? (
          <input
            autoFocus
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={column.label}
            className={`${labelClass} border-none outline-none bg-transparent w-full p-0`}
          />
        ) : isOpen && column.filterable === "date" ? (
          <input
            autoFocus
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            className={`${labelClass} border-none outline-none bg-transparent w-full p-0`}
          />
        ) : (
          <span className={`grouped-table__header-label ${labelClass}`}>
            {column.label}
          </span>
        )}
        {iconName && (
          <span
            className={`grouped-table__header-icon ml-[13px] inline-flex flex-shrink-0 ${
              isInteractive ? "cursor-pointer" : "cursor-default"
            }`}
            onClick={handleIconClick}
          >
            <IconRenderer icon={iconName} size={16} />
          </span>
        )}
      </div>
    </th>
  );
}

interface DefaultCellProps {
  column: GroupedTableColumn;
  category: CategoryGroup;
  subCategory: SubCategoryGroup;
}

function DefaultCell({ column, category, subCategory }: DefaultCellProps) {
  switch (column.key) {
    case "subCategory":
      return <>{subCategory.subCategory}</>;
    case "product":
      return (
        <div className="grouped-table__stack">
          {subCategory.products.map((p, i) => (
            <div key={`${p.product}-${i}`} className="grouped-table__stack-row">
              {p.product}
            </div>
          ))}
        </div>
      );
    case "effectiveDate":
      if (column.mergeRowSpan && category.effectiveDate) {
        return <>{category.effectiveDate}</>;
      }
      return (
        <div className="grouped-table__stack">
          {subCategory.products.map((p, i) => (
            <div key={`${p.product}-${i}`} className="grouped-table__stack-row">
              {p.effectiveDate}
            </div>
          ))}
        </div>
      );
    case "locations":
      return (
        <div className="grouped-table__stack">
          {subCategory.products.map((p, i) => (
            <div key={`${p.product}-${i}`} className="grouped-table__stack-row">
              {p.location || ""}
            </div>
          ))}
        </div>
      );
    case "category":
      return <>{category.category}</>;
    case "targetQuantity":
      return <>{category.targetQuantity}</>;
    case "eligibleIncentive":
      return <>{category.eligibleIncentive}</>;
    default:
      return null;
  }
}

function TablePagination({
  rangeStart,
  rangeEnd,
  total,
  currentPage,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    for (let i = start; i < start + 3 && i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="grouped-table__pagination flex items-center justify-between px-3 pb-10 shrink-0 mt-10">
      <p className="text-13 text-gray">
        {rangeStart} - {rangeEnd} of {total}
      </p>
      <div className="flex items-center gap-6 px-6 py-4">
        <button
          onClick={() => onPageChange(1)}
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
          onClick={() => onPageChange(currentPage - 1)}
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
            onClick={() => onPageChange(num)}
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
          onClick={() => onPageChange(currentPage + 1)}
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
          onClick={() => onPageChange(totalPages)}
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
  );
}

/* ---------------------------------------------------------------------- */

export default function GroupedIncentiveTable({
  columns,
  data,
  emptyMessage = "No results.",
  renderCustomCell,
  renderCustomHeader,
  onStateChange,
  showVerticalLines = false,
  pagination = false,
  pageSize = DEFAULT_PAGE_SIZE,
  evenDataBackgroundColor,
  paddingHorizontal = "px-3",
  paddingVertical = "py-3",
  hideSubRowBorders = false,
}: GroupedIncentiveTableProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sort, setSort] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(null);
  const [page, setPage] = useState<number>(1);

  const visibleData = useMemo(() => {
    const filtered = applyFilters(data, textFilters, dateFilter);
    const sorted = applySort(filtered, sort);
    onStateChange?.({ textFilters, dateFilter, sort });
    return sorted;
  }, [data, textFilters, dateFilter, sort]);

  const totalItems = visibleData.length;
  const effectivePageSize = pagination ? pageSize : totalItems || 1;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(totalItems / effectivePageSize))
    : 1;
  const currentPage = Math.min(page, totalPages);

  const pagedData = useMemo(() => {
    if (!pagination) return visibleData;
    const start = (currentPage - 1) * effectivePageSize;
    return visibleData.slice(start, start + effectivePageSize);
  }, [visibleData, pagination, currentPage, effectivePageSize]);

  const rangeStart =
    totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const rangeEnd = Math.min(currentPage * effectivePageSize, totalItems);

  useEffect(() => {
    setPage(1);
  }, [textFilters, dateFilter, sort, data]);

  function toggleOpen(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div className="grouped-table__wrapper h-full flex flex-col">
      <style>{`
        .grouped-table__scroll-wrapper::-webkit-scrollbar { width: 6px; }
        .grouped-table__scroll-wrapper::-webkit-scrollbar-thumb { background: #d0d0d8; border-radius: 4px; }
        .grouped-table__scroll-wrapper::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="grouped-table__scroll-wrapper flex-1 min-h-0 overflow-auto">
        <table className="grouped-table w-full border-collapse table-fixed">
          <thead>
            <tr>
              {columns.map((column) => (
                <HeaderCell
                  key={column.key}
                  column={column}
                  isOpen={openKey === column.key}
                  onToggleOpen={() => toggleOpen(column.key)}
                  textValue={textFilters[column.key] ?? ""}
                  onTextChange={(v) =>
                    setTextFilters((prev) => ({ ...prev, [column.key]: v }))
                  }
                  dateValue={dateFilter}
                  onDateChange={setDateFilter}
                  sortDirection={
                    sort?.key === column.key ? sort.direction : null
                  }
                  onSortClick={() => toggleSort(column.key)}
                  alineItem={column?.alineItem}
                  customContent={renderCustomHeader?.(column)}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            ) : (
              pagedData.map((category, categoryIndex) => {
                const rowSpan = category.subCategories.length || 1;
                const isShadedGroup =
                  evenDataBackgroundColor && categoryIndex % 2 === 1;
                return category.subCategories.map((subCategory, subIndex) => {
                  const isFirstSubRow = subIndex === 0;
                  const isLastSubRow = subIndex === category.subCategories.length - 1;

                  let trBorderClass = "";
                  if (showVerticalLines) {
                    if (!hideSubRowBorders || (isFirstSubRow && isLastSubRow)) {
                      trBorderClass = "border-[1.5px] border-[#eee]";
                    } else if (isFirstSubRow) {
                      trBorderClass = "border-x-[1.5px] border-t-[1.5px] border-[#eee]";
                    } else if (isLastSubRow) {
                      trBorderClass = "border-x-[1.5px] border-b-[1.5px] border-[#eee]";
                    } else {
                      trBorderClass = "border-x-[1.5px] border-[#eee]";
                    }
                  }

                  return (
                    <tr
                      key={`${category.category}-${subCategory.subCategory}`}
                      className={trBorderClass}
                      style={
                        isShadedGroup
                          ? { backgroundColor: evenDataBackgroundColor }
                          : { backgroundColor: "#fff" }
                      }
                    >
                      {columns.map((column) => {
                        const isCategoryLevel =
                          column.mergeRowSpan ??
                          CATEGORY_LEVEL_KEYS.has(column.key);
                        if (isCategoryLevel && !isFirstSubRow) return null;
                        const content = renderCustomCell?.(
                          column,
                          category,
                          subCategory,
                        ) ?? (
                          <DefaultCell
                            column={column}
                            category={category}
                            subCategory={subCategory}
                          />
                        );

                        return (
                          <td
                            key={column.key}
                            rowSpan={isCategoryLevel ? rowSpan : undefined}
                            className={`${paddingHorizontal} ${paddingVertical} h-[37px] content-center ${
                              !showVerticalLines
                                ? "border-[1.5px] border-strokegray"
                                : ""
                            }`}
                            style={{
                              textAlign: column.align ?? "left",
                              verticalAlign: isCategoryLevel ? "middle" : "top",
                              fontSize: column?.testSize ?? 13,
                              fontWeight: column?.fontWeight ?? 400,
                              color: column?.color ?? "#59596C",
                            }}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination && totalItems > 0 && (
        <TablePagination
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          total={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
