import React, { useMemo, useState } from "react";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import type {
  CategoryGroup,
  GroupedIncentiveTableProps,
  GroupedTableColumn,
  SortDirection,
  SubCategoryGroup,
} from "../../../../modules/sales-incentive/types/salesIncentive.types";

const CATEGORY_LEVEL_KEYS = new Set([
  "category",
  "targetQuantity",
  "eligibleIncentive",
]);

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
      // sticky top-0 + bg-white keep this header row pinned while the body
      // scrolls inside the fixed-height wrapper. Nothing else here changed.
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
        {isOpen && column.filterable === "text" ? (
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
      return (
        <div className="grouped-table__stack">
          {subCategory.products.map((p, i) => (
            <div key={`${p.product}-${i}`} className="grouped-table__stack-row">
              {p.effectiveDate}
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

export default function GroupedIncentiveTable({
  columns,
  data,
  emptyMessage = "No results.",
  renderCustomCell,
  onStateChange,
  showVerticalLines = false,
}: GroupedIncentiveTableProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sort, setSort] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(null);

  const visibleData = useMemo(() => {
    const filtered = applyFilters(data, textFilters, dateFilter);
    const sorted = applySort(filtered, sort);
    onStateChange?.({ textFilters, dateFilter, sort });
    return sorted;
  }, [data, textFilters, dateFilter, sort]);

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
    <div className="grouped-table__scroll-wrapper h-full overflow-y-auto">
      <style>{`
        .grouped-table__scroll-wrapper::-webkit-scrollbar { width: 6px; }
        .grouped-table__scroll-wrapper::-webkit-scrollbar-thumb { background: #d0d0d8; border-radius: 4px; }
        .grouped-table__scroll-wrapper::-webkit-scrollbar-track { background: transparent; }
      `}</style>
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
                sortDirection={sort?.key === column.key ? sort.direction : null}
                onSortClick={() => toggleSort(column.key)}
                alineItem={column?.alineItem}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {visibleData.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          ) : (
            visibleData.map((category) => {
              const rowSpan = category.subCategories.length || 1;

              return category.subCategories.map((subCategory, subIndex) => {
                const isFirstSubRow = subIndex === 0;

                return (
                  <tr
                    key={`${category.category}-${subCategory.subCategory}`}
                    className={
                      showVerticalLines ? "border-[1.5px] border-[#eee]" : ""
                    }
                  >
                    {columns.map((column) => {
                      const isCategoryLevel = CATEGORY_LEVEL_KEYS.has(
                        column.key,
                      );
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
                          className={`p-3 h-[37px] content-center ${
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
  );
}
