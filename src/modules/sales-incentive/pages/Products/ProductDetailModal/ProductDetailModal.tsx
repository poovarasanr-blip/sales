import { useEffect, useMemo, useState } from "react";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomModal from "../../../../../shared/components/ui/Modal/CustomModal";
import { PRODUCT_DETAIL_COLUMNS } from "../../../config/Productbulkupload";
import {
  getSubCategoryActivityLog,
  getProductActivityLog,
} from "../../../config/Productbulkupload";
import type {
  ProductDetailData,
  ProductActivityLogEntry,
  ProductFlatRow,
  GroupedTableColumn,
} from "../../../types/salesIncentive.types";
import ProductActivityLog from "../ActivityLog/ProductActivityLog";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function displayToISO(display: string): string {
  const parts = display.split(" ");
  const day = parts[0].padStart(2, "0");
  const month = String(MONTHS.indexOf(parts[1]) + 1).padStart(2, "0");
  return `${parts[2]}-${month}-${day}`;
}

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

/* ---- Detail Header Cell ---- */

interface DetailHeaderCellProps {
  column: GroupedTableColumn;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  filterValue: string;
  onFilterChange: (v: string) => void;
  subCategoryCount?: number;
}

function DetailHeaderCell({
  column,
  isFilterOpen,
  onToggleFilter,
  filterValue,
  onFilterChange,
  subCategoryCount,
}: DetailHeaderCellProps) {
  const isOpen = isFilterOpen && !!column.filterable;
  const iconName = isOpen ? "LuX" : column.icon;
  const labelClass = "text-12 font-semibold text-darkgray";
  const isInteractive = !!column.filterable;

  function handleIconClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (column.filterable) onToggleFilter();
  }

  const labelText =
    column.key === "subCategory" && subCategoryCount !== undefined
      ? `${column.label} (${subCategoryCount})`
      : column.label;

  return (
    <th
      className="h-[36px] px-[14px] py-[6px] sticky top-0 z-10 bg-white whitespace-nowrap"
      style={{ textAlign: column.align ?? "left", width: column.width }}
    >
      <div className="flex items-center w-full">
        {isOpen && column.filterable === "text" ? (
          <input
            autoFocus
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder={labelText}
            className={`${labelClass} border-none outline-none bg-transparent w-full p-0`}
          />
        ) : isOpen && column.filterable === "date" ? (
          <input
            autoFocus
            type="date"
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className={`${labelClass} border-none outline-none bg-transparent cursor-pointer p-0`}
          />
        ) : (
          <span className={labelClass}>{labelText}</span>
        )}
        {iconName && (
          <span
            className={`ml-[10px] inline-flex flex-shrink-0 ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
            onClick={handleIconClick}
          >
            <IconRenderer icon={iconName} size={14} />
          </span>
        )}
      </div>
    </th>
  );
}

/* ---- Activity Log State ---- */

interface ActivityLogState {
  title: string;
  subtitle?: string;
  entries: ProductActivityLogEntry[];
}

/* ---- Product Detail Modal ---- */

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detailData: ProductDetailData | null;
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  detailData,
}: ProductDetailModalProps) {
  const [detailFilterKey, setDetailFilterKey] = useState<string | null>(null);
  const [detailFilters, setDetailFilters] = useState<Record<string, string>>({});
  const [activityLog, setActivityLog] = useState<ActivityLogState | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDetailFilterKey(null);
      setDetailFilters({});
      setActivityLog(null);
    }
  }, [isOpen]);

  const filteredSubCategories = useMemo(() => {
    if (!detailData) return [];
    const subQ = (detailFilters.subCategory ?? "").trim().toLowerCase();
    const prodQ = (detailFilters.product ?? "").trim().toLowerCase();
    const locQ = (detailFilters.location ?? "").trim().toLowerCase();
    const dateQ = (detailFilters.effectiveDate ?? "").trim();

    return detailData.subCategories
      .map((sc) => {
        let prods = sc.products;
        if (prodQ)
          prods = prods.filter((p) => p.product.toLowerCase().includes(prodQ));
        if (locQ)
          prods = prods.filter((p) => p.location.toLowerCase().includes(locQ));
        if (dateQ)
          prods = prods.filter((p) => displayToISO(p.effectiveDate) === dateQ);
        if (prods.length === 0) return null;
        if (subQ && !sc.subCategory.toLowerCase().includes(subQ)) return null;
        return { ...sc, products: prods };
      })
      .filter(Boolean) as typeof detailData.subCategories;
  }, [detailData, detailFilters]);

  function openProductLog(product: string, subCategory: string) {
    setActivityLog({
      title: product,
      subtitle: subCategory,
      entries: getProductActivityLog(product, subCategory),
    });
  }

  if (!detailData) return null;

  return (
    <>
      <CustomModal isOpen={isOpen}>
        <div className="w-[1100px] bg-white h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-[25px] py-[12px] shrink-0">
            <p className="text-[18px] text-darkgray font-semibold">
              {detailData.category}
            </p>
            <IconRenderer
              icon="IoMdClose"
              color="#6B7280"
              size={18}
              onClick={onClose}
              className="cursor-pointer"
            />
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 px-[25px] pt-[6px] pb-[16px] overflow-auto">
            <div className="border border-strokegray rounded-4 overflow-hidden">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  {PRODUCT_DETAIL_COLUMNS.map((col) => (
                    <col key={col.key} style={{ width: col.width }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    {PRODUCT_DETAIL_COLUMNS.map((col) => (
                      <DetailHeaderCell
                        key={col.key}
                        column={col}
                        isFilterOpen={detailFilterKey === col.key}
                        onToggleFilter={() =>
                          setDetailFilterKey((prev) =>
                            prev === col.key ? null : col.key,
                          )
                        }
                        filterValue={detailFilters[col.key] ?? ""}
                        onFilterChange={(v) =>
                          setDetailFilters((prev) => ({ ...prev, [col.key]: v }))
                        }
                        subCategoryCount={detailData.subCategories.length}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubCategories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={PRODUCT_DETAIL_COLUMNS.length}
                        className="text-center py-20 text-gray text-13"
                      >
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubCategories.map((sc, si) =>
                      sc.products.map((prod, pi) => {
                        const isLastInGroup = pi === sc.products.length - 1;
                        const isLastGroup =
                          si === filteredSubCategories.length - 1;
                        return (
                          <tr
                            key={`${sc.subCategory}-${pi}`}
                            className={
                              isLastInGroup && !isLastGroup
                                ? "border-b border-[#E5E7EB]"
                                : ""
                            }
                          >
                            {pi === 0 && (
                              <td
                                rowSpan={sc.products.length}
                                className="px-[14px] py-[8px] text-13 text-gray align-top"
                              >
                                {sc.subCategory}
                              </td>
                            )}
                            <td className="px-[14px] py-[8px] text-13 text-gray">
                              {prod.product}
                            </td>
                            <td className="px-[14px] py-[8px] text-13 text-gray">
                              {prod.effectiveDate}
                            </td>
                            <td className="px-[14px] py-[8px] text-13 text-gray">
                              {prod.location}
                            </td>
                            <td className="px-[14px] py-[8px] text-13">
                              <span className="inline-flex items-center gap-[5px] text-12 text-gray">
                                <span
                                  className={`w-[7px] h-[7px] rounded-full ${getStatusColor(prod.status).bg}`}
                                />
                                {prod.status}
                              </span>
                            </td>
                            <td className="px-[14px] py-[8px] text-13 text-center">
                              <button
                                aria-label="History"
                                className="cursor-pointer"
                                onClick={() =>
                                  openProductLog(prod.product, sc.subCategory)
                                }
                              >
                                <IconRenderer
                                  icon={
                                    PageLayOut?.Products?.HistoryIcon ??
                                    "GoHistory"
                                  }
                                  size={15}
                                  className="text-gray"
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      }),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-10 px-[25px] py-[12px] shrink-0 border-t border-[#E5E7EB]">
            <CustomButton
              title="+ Add Product"
              backgroundColor="bg-white"
              height="h-[34px]"
              gap="gap-[6px]"
              borderRadius="rounded-6"
              borderColor="border-primary"
              textColor="text-primary"
              borderWidth="border-1"
            />
            <CustomButton
              title="Edit"
              backgroundColor="bg-primary"
              height="h-[34px]"
              gap="gap-[6px]"
              borderRadius="rounded-6"
              textColor="text-white"
              icon={
                <IconRenderer
                  icon={PageLayOut?.Products?.EditIcon ?? "RxPencil1"}
                  size={13}
                  className="text-white"
                />
              }
              iconPosition="left"
            />
          </div>
        </div>
      </CustomModal>

      {/* Product Activity Log */}
      <ProductActivityLog
        isOpen={!!activityLog}
        onClose={() => setActivityLog(null)}
        title={activityLog?.title ?? ""}
        subtitle={activityLog?.subtitle}
        entries={activityLog?.entries ?? []}
      />
    </>
  );
}
