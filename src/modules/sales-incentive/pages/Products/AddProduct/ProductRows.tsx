import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import type { AddProductFieldConfig } from "../../../types/salesIncentive.types";
import ProductIcon from "../../../../../assets/icons/AddProduct/Products.svg";

interface ProductRowData {
  id: string;
  values: Record<string, string>;
}

interface ProductRowsProps {
  title: string;
  subtitle: string;
  icon: string;
  fields: AddProductFieldConfig[];
  rows: ProductRowData[];
  onFieldChange: (rowId: string, key: string, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
}

export default function ProductRows({
  title,
  subtitle,
  icon,
  fields,
  rows,
  onFieldChange,
  onAddRow,
  onRemoveRow,
}: ProductRowsProps) {
  const rowGroups = new Map<number, AddProductFieldConfig[]>();
  fields.forEach((f) => {
    const r = f.row ?? 1;
    if (!rowGroups.has(r)) rowGroups.set(r, []);
    rowGroups.get(r)!.push(f);
  });
  const sortedGroups = [...rowGroups.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="border border-strokegray rounded-6 bg-white shadow-card-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-[20px] py-[12px]">
        <div className="flex items-center gap-[10px]">
          <div className="w-[29px] h-[29px] rounded-full bg-[#DFE7FF] flex items-center justify-center">
            <IconRenderer imageUrl={ProductIcon} />
          </div>
          <div>
            <p className="text-14 font-semibold text-darkgray">{title}</p>
            <p className="text-12 text-gray">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="px-[14px]  pb-[12px]  flex flex-col gap-[12px]">
        {rows.map((row, rowIdx) => (
          <div
            key={row.id}
            className={`relative flex items-start gap-[12px] rounded-6 bg-[#F5F7FF] `}
          >
            {/* Fields */}
            <div className="flex-1 flex flex-col gap-[12px]  p-[12px]">
              {sortedGroups.map(([groupRow, groupFields]) => (
                <div
                  key={groupRow}
                  className="grid gap-[16px]"
                  style={{
                    gridTemplateColumns: `repeat(${groupFields.length}, 1fr)`,
                  }}
                >
                  {groupFields.map((field) => (
                    <div key={field.key}>
                      <label className="text-12 font-medium text-darkgray mb-[6px] block">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          value={row.values[field.key] ?? ""}
                          onChange={(e) =>
                            onFieldChange(row.id, field.key, e.target.value)
                          }
                          className="w-full h-[40px] px-[12px] border border-[#E5E7EB] rounded-[8px] bg-white text-13 text-darkgray cursor-pointer outline-none"
                        >
                          <option value="">{field.placeholder}</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={row.values[field.key] ?? ""}
                          onChange={(e) =>
                            onFieldChange(row.id, field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          className="w-full h-[40px] px-[12px] border border-[#E5E7EB] rounded-[8px] bg-white text-13 text-darkgray outline-none placeholder:text-[#9CA3AF]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Add / Remove circle button */}
            <div
              className="border-l w-[36px] flex flex-col items-center gap-[30px] rounded-4 border-strokegray justify-center"
              style={{ height: "163px" }}
            >
              {rows.length > 1 && (
                <button type="button" onClick={() => onRemoveRow(row.id)}>
                  <IconRenderer
                    icon="FaRegTrashAlt"
                    size={17}
                    color="#FE6C6C"
                  />
                </button>
              )}
              {rowIdx === rows.length - 1 && (
                <button
                  type="button"
                  onClick={onAddRow}
                  className="w-[17px] h-[17px] rounded-full border-2 border-[#5C67FD] flex items-center justify-center cursor-pointer"
                >
                  <IconRenderer icon="FiPlus" size={14} color="#5C67FD" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
