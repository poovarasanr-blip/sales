import * as XLSX from "xlsx";
import type {
  BulkParseResult,
  BulkUploadColumnConfig,
  RowValidationResult,
} from "../../modules/sales-incentive/types/salesIncentive.types";

export function readFileAsArrayBuffer(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = () => {
      onProgress?.(100);
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function generateSampleFile<T extends Record<string, unknown>>(
  columns: BulkUploadColumnConfig<T>[],
  sampleRows: T[],
  fileName: string,
  sheetName = "Sheet1",
): void {
  const headers = columns.map((c) => c.header);
  const plainRows = sampleRows.map((row) => {
    const mapped: Record<string, unknown> = {};
    columns.forEach((c) => {
      mapped[c.header] = row[c.key];
    });
    return mapped;
  });

  const worksheet = XLSX.utils.json_to_sheet(plainRows, { header: headers });
  worksheet["!cols"] = columns.map(() => ({ wch: 22 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

export function parseWorkbook<T extends Record<string, unknown>>(
  buffer: ArrayBuffer,
  columns: BulkUploadColumnConfig<T>[],
): BulkParseResult<T> {
  const empty: BulkParseResult<T> = {
    headerErrors: [],
    validRows: [],
    invalidRows: [],
  };
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      ...empty,
      headerErrors: ["Could not read the file. It may be corrupted."],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ...empty, headerErrors: ["The uploaded file has no sheets."] };
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    {
      header: 1,
      blankrows: false,
    },
  );

  if (rows.length === 0) {
    return { ...empty, headerErrors: ["The uploaded file is empty."] };
  }

  const actualHeaders = rows[0].map((h) => String(h ?? "").trim());
  const expectedHeaders = columns.map((c) => c.header);

  const missing = expectedHeaders.filter((h) => !actualHeaders.includes(h));
  const unexpected = actualHeaders.filter(
    (h) => h && !expectedHeaders.includes(h),
  );

  const headerErrors: string[] = [];
  if (missing.length > 0)
    headerErrors.push(`Missing required column(s): ${missing.join(", ")}`);
  if (unexpected.length > 0)
    headerErrors.push(`Unrecognized column(s): ${unexpected.join(", ")}`);
  if (headerErrors.length > 0) return { ...empty, headerErrors };

  const columnIndex = new Map<string, number>();
  columns.forEach((col) =>
    columnIndex.set(String(col.key), actualHeaders.indexOf(col.header)),
  );

  const validRows: RowValidationResult<T>[] = [];
  const invalidRows: RowValidationResult<T>[] = [];

  rows.slice(1).forEach((rawRow, i) => {
    const data = {} as T;
    const errors: string[] = [];
    columns.forEach((col) => {
      const idx = columnIndex.get(String(col.key)) ?? -1;
      const rawValue = idx >= 0 ? rawRow[idx] : undefined;
      const isBlank =
        rawValue === undefined ||
        rawValue === null ||
        String(rawValue).trim() === "";
      if (col.required && isBlank) {
        errors.push(`${col.header} is required`);
      }
      let value: unknown = rawValue;
      if (!isBlank && col.type === "number") {
        const num = Number(rawValue);
        if (Number.isNaN(num)) {
          errors.push(`${col.header} must be a number`);
        } else {
          value = num;
        }
      }
      (data as Record<string, unknown>)[col.key as string] = isBlank
        ? ""
        : value;
    });

    const isRowFullyBlank = Object.values(
      data as Record<string, unknown>,
    ).every((v) => v === undefined || v === null || v === "");
    if (isRowFullyBlank) return;

    const result: RowValidationResult<T> = { rowNumber: i + 1, data, errors };
    (errors.length === 0 ? validRows : invalidRows).push(result);
  });

  return { headerErrors: [], validRows, invalidRows };
}

export function getFileExtensionLabel(fileName: string): string {
  const ext = fileName.split(".").pop() ?? "";
  return ext.slice(0, 3).toUpperCase() || "FILE";
}
