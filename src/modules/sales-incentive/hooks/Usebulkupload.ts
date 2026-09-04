import { useCallback, useState } from "react";
import type {
  BulkParseResult,
  BulkUploadColumnConfig,
  UploadingFileState,
} from "../types/salesIncentive.types";
import {
  parseWorkbook,
  readFileAsArrayBuffer,
} from "../../../shared/utils/BulkuploadUtils";

interface UseBulkUploadResult<T> {
  uploadingFile: UploadingFileState | null;
  fileError: string | null;
  startUpload: (file: File) => Promise<BulkParseResult<T> | null>;
  reset: () => void;
}

const MIN_LOADER_DURATION_MS = 2000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useBulkUpload<T extends Record<string, unknown>>(
  columns: BulkUploadColumnConfig<T>[],
): UseBulkUploadResult<T> {
  const [uploadingFile, setUploadingFile] = useState<UploadingFileState | null>(
    null,
  );
  const [fileError, setFileError] = useState<string | null>(null);

  const startUpload = useCallback(
    async (file: File): Promise<BulkParseResult<T> | null> => {
      setFileError(null);
      setUploadingFile({ name: file.name, progress: 0 });
      const startedAt = Date.now();
      const finishLoader = async () => {
        const elapsed = Date.now() - startedAt;
        const remaining = MIN_LOADER_DURATION_MS - elapsed;
        if (remaining > 0) {
          await wait(remaining);
        }
        setUploadingFile(null);
      };

      try {
        const buffer = await readFileAsArrayBuffer(file, (percent) =>
          setUploadingFile((prev) =>
            prev ? { ...prev, progress: percent } : prev,
          ),
        );
        const result = parseWorkbook<T>(buffer, columns);
        setUploadingFile((prev) => (prev ? { ...prev, progress: 100 } : prev));

        if (result.headerErrors.length > 0) {
          setFileError(result.headerErrors.join(" "));
          await finishLoader();
          return null;
        }

        await finishLoader();
        return result;
      } catch {
        setFileError(
          "Could not read the file. It may be corrupted or in an unsupported format.",
        );
        await finishLoader();
        return null;
      }
    },
    [columns],
  );

  const reset = useCallback(() => {
    setUploadingFile(null);
    setFileError(null);
  }, []);

  return { uploadingFile, fileError, startUpload, reset };
}
