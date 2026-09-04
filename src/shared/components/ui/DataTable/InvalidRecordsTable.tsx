import { useEffect, useState } from "react";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import { showToast } from "../CustomToast/UseToast";
import type { BulkUploadColumnConfig } from "../../../../modules/sales-incentive/types/salesIncentive.types";

/* ---------- helpers ---------- */

function toInputDate(display: string): string {
  const d = new Date(display);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function fromInputDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(",", "");
}

function validateField<T>(
  value: unknown,
  col: BulkUploadColumnConfig<T>,
): string | null {
  if (col.required && (value === undefined || value === null || value === "")) {
    return `${col.header} is required`;
  }
  if (col.type === "number") {
    const n = Number(value);
    if (Number.isNaN(n)) return `${col.header} must be a number`;
    if (n <= 0) return `${col.header} must be greater than 0`;
  }
  if (col.type === "date") {
    const d = new Date(value as string);
    if (Number.isNaN(d.getTime())) return `${col.header} must be a valid date`;
  }
  return null;
}

/* ---------- types ---------- */

export interface InvalidRow<T> {
  __id: string;
  data: T;
  errors?: Partial<Record<keyof T, string>>;
}

interface InvalidRecordsTableProps<T extends Record<string, any>> {
  columns: BulkUploadColumnConfig<T>[];
  rows: InvalidRow<T>[];
  onRemove: (ids: string[]) => void;
  /** Called once a row passes validation — parent moves it into the valid list */
  onValidated: (row: T, id: string) => void;
  emptyMessage?: string;
}

/* ---------- component ---------- */

export default function InvalidRecordsTable<T extends Record<string, any>>({
  columns,
  rows,
  onRemove,
  onValidated,
  emptyMessage = "No invalid records.",
}: InvalidRecordsTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Live, always-editable values for every row — keyed by row id.
  const [values, setValues] = useState<Record<string, T>>({});
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, Partial<Record<keyof T, string>>>
  >({});

  useEffect(() => {
    setValues((prev) => {
      const next: Record<string, T> = {};
      rows.forEach((r) => {
        next[r.__id] = prev[r.__id] ?? { ...r.data };
      });
      return next;
    });
    setSelectedIds((prev) => {
      const ids = new Set(rows.map((r) => r.__id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
      });
      return next;
    });
  }, [rows]);

  const hasSelection = selectedIds.size > 0;
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.__id)));
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateValue(id: string, key: keyof T, value: unknown) {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  function validateRow(id: string): boolean {
    const draft = values[id];
    const errs: Partial<Record<keyof T, string>> = {};
    columns.forEach((col) => {
      const err = validateField(draft?.[col.key], col);
      if (err) errs[col.key] = err;
    });

    if (Object.keys(errs).length > 0) {
      setFieldErrors((prev) => ({ ...prev, [id]: errs }));
      return false;
    }

    setFieldErrors((prev) => {
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
    return true;
  }

  function updateRow(id: string) {
    if (!validateRow(id)) {
      showToast({
        type: "error",
        title: "Fix the highlighted fields",
        message: "This record still has invalid values.",
        duration: 3000,
      });
      return;
    }
    onValidated(values[id], id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast({
      type: "success",
      title: "Record updated",
      message: "Moved to valid records.",
      duration: 2500,
    });
  }

  function updateSelected() {
    const ids = Array.from(selectedIds);
    const validIds = ids.filter((id) => validateRow(id));
    const invalidCount = ids.length - validIds.length;

    validIds.forEach((id) => onValidated(values[id], id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      validIds.forEach((id) => next.delete(id));
      return next;
    });

    if (invalidCount > 0) {
      showToast({
        type: "error",
        title: "Some records still have errors",
        message: `${invalidCount} record(s) need correction before they can be added.`,
        duration: 3000,
      });
    } else {
      showToast({
        type: "success",
        title: "Records updated",
        message: `${validIds.length} record(s) moved to valid records.`,
        duration: 2500,
      });
    }
  }

  return (
    <div className="grouped-table__wrapper h-full flex flex-col">
      <div className="grouped-table__scroll-wrapper flex-1 min-h-0 overflow-y-auto">
        <table className="grouped-table w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="w-[36px] p-3 sticky top-0 z-10 bg-white">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="text-12 font-semibold text-darkgray text-left p-3 sticky top-0 z-10 bg-white"
                >
                  {col.header}
                </th>
              ))}
              <th className="text-12 font-semibold text-darkgray p-3 sticky top-0 z-10 bg-white">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="p-6 text-center text-gray text-13"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelected = selectedIds.has(row.__id);
                const draft = values[row.__id] ?? row.data;
                const rowErrors = fieldErrors[row.__id];

                return (
                  <tr
                    key={row.__id}
                    className={isSelected ? "bg-[#F5F7FF]" : undefined}
                  >
                    <td className="p-3 border-[1.5px] border-strokegray">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(row.__id)}
                      />
                    </td>

                    {columns.map((col) => {
                      const hasError = !!rowErrors?.[col.key];
                      const inputType =
                        col.type === "number"
                          ? "number"
                          : col.type === "date"
                            ? "date"
                            : "text";
                      const inputValue =
                        col.type === "date"
                          ? toInputDate(String(draft[col.key] ?? ""))
                          : ((draft[col.key] as any) ?? "");

                      return (
                        <td
                          key={String(col.key)}
                          className="p-3 h-[37px] border-[1.5px] border-strokegray"
                        >
                          <input
                            type={inputType}
                            value={inputValue}
                            onChange={(e) => {
                              const v =
                                col.type === "date"
                                  ? fromInputDate(e.target.value)
                                  : e.target.value;
                              updateValue(row.__id, col.key, v);
                            }}
                            className={`bg-white text-13 border rounded-6 px-3 py-2 w-full outline-none ${
                              hasError ? "border-danger" : "border-strokegray"
                            }`}
                          />
                          {/* {hasError && (
                            <p className="text-11 text-danger mt-1">
                              {rowErrors![col.key]}
                            </p>
                          )} */}
                        </td>
                      );
                    })}

                    <td className="p-3 h-[37px] border-[1.5px] border-strokegray">
                      <div className="flex items-center gap-12">
                        <button
                          onClick={() => onRemove([row.__id])}
                          disabled={hasSelection}
                          className={`flex items-center gap-4 text-13 ${
                            hasSelection
                              ? "text-litegray cursor-not-allowed"
                              : "text-danger"
                          }`}
                        >
                          <IconRenderer icon="FaRegTimesCircle" size={14} />
                          Remove
                        </button>
                        <button
                          onClick={() => updateRow(row.__id)}
                          disabled={hasSelection}
                          className={`flex items-center gap-4 text-13 ${
                            hasSelection
                              ? "text-litegray cursor-not-allowed"
                              : "text-primary"
                          }`}
                        >
                          <IconRenderer icon="FiCheckCircle" size={14} />
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hasSelection && (
        <div className="flex items-center justify-between px-3 py-10 shrink-0 border-t-1 border-strokegray bg-white">
          <p className="text-13 text-primary font-semibold">
            {selectedIds.size} records selected
          </p>
          <div className="flex items-center gap-12">
            <button
              onClick={() => {
                onRemove(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="h-[34px] px-16 rounded-6 border border-danger text-danger text-13 flex items-center gap-6"
            >
              <IconRenderer icon="FaRegTimesCircle" size={14} />
              Remove
            </button>
            <button
              onClick={updateSelected}
              className="h-[34px] px-16 rounded-6 bg-primary text-white text-13 flex items-center gap-6"
            >
              <IconRenderer icon="FiCheckCircle" size={14} />
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
