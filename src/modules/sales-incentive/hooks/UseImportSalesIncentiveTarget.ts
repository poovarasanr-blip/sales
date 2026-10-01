import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { showToast } from "../../../shared/components/ui/CustomToast/UseToast";
import { handleImportSalesIncentiveTarget } from "../../../query/api";
import decrypt from "../../../utils/security/decrypt";
import { parseNestedJson } from "../../../utils/security/ParseData";

interface ImportSalesIncentiveTargetVariables {
  payload: string;
  token: string;
  recordCount: number;
}

interface UseImportSalesIncentiveTargetOptions {
  onImported?: (recordCount: number) => void;
}

export function useImportSalesIncentiveTarget({
  onImported,
}: UseImportSalesIncentiveTargetOptions = {}) {
  const sessionData = useAuthStore((state) => state.sessionData);

  const { mutate: importTargets, isPending } = useMutation({
    mutationFn: ({ payload, token }: ImportSalesIncentiveTargetVariables) =>
      handleImportSalesIncentiveTarget(payload, token),
    onSuccess: (response: any, variables) => {
      if (response?.status >= 200 && response?.status < 300) {
        try {
          const decryptedData = decrypt(
            response?.data,
            sessionData?.Key ?? "",
            sessionData?.Vector ?? "",
          );
          const parsedData = parseNestedJson(JSON.parse(decryptedData));
          if (parsedData?.Status) {
            const results: any[] = parsedData?.Result ?? [];
            const failed = results.filter(
              (result: any) =>
                result.Status === "Failed" && result.ErrorMessage,
            );
            if (failed.length > 0) {
              const successCount = results.length - failed.length;
              showToast({
                type: "error",
                title: "Partial Import",
                message: `${successCount} record(s) imported. ${failed.length} record(s) failed: ${failed.map((result: any) => result.ErrorMessage).join("; ")}`,
                duration: 5000,
              });
            } else {
              showToast({
                type: "success",
                title: "Success!",
                message:
                  parsedData?.Message ??
                  `${variables.recordCount} employee sales target records added`,
                duration: 3000,
              });
              onImported?.(variables.recordCount);
            }
          } else {
            showToast({
              type: "error",
              title: "Error!",
              message: parsedData?.Message,
              duration: 3000,
            });
          }
        } catch {
          showToast({
            type: "error",
            title: "Error",
            message: "Failed to process server response. Please try again.",
            duration: 3000,
          });
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          message:
            response?.data?.message ??
            "Failed to add employee sales targets. Please try again.",
          duration: 3000,
        });
      }
    },
    onError: () => {
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to add employee sales targets. Please try again.",
        duration: 3000,
      });
    },
  });

  return { importTargets, isPending };
}
