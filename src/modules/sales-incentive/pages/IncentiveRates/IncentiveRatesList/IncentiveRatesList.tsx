import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import Config from "../../../../../assets/json/Config.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import NoDataFound from "../../../../../shared/components/ui/NoDataFound/NoDataFound";
import BulkUploadCard from "../../../../../shared/components/ui/BulkUpload/BulkUploadCard";
import ProductActivityLog from "../../Products/ActivityLog/ProductActivityLog";
import AddIncentiveRateModal from "../AddIncentiveRate/AddIncentiveRateModal";
import type { AddIncentiveRateValues } from "../AddIncentiveRate/AddIncentiveRateModal";
import CustomInput from "../../../../../shared/components/forms/FormInput/CustomTextInput";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import LoaderModal from "../../../../../shared/components/ui/LoaderModal/LoaderModal";
import { useAuthStore } from "../../../../../app/store/useAuthStore";
import {
  handleGetProductBulkTemplate,
  handleGetExcelTemplate,
  handleUpsertIncentiveRates,
  handleGetIncentiveRates,
} from "../../../../../query/api";
import encrypt from "../../../../../utils/security/encrypt";
import decrypt from "../../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../../utils/security/ParseData";
import { generateSampleFile } from "../../../../../shared/utils/BulkuploadUtils";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import {
  INCENTIVE_RATES_COLUMNS,
  INCENTIVE_RATES_MOCK_DATA,
  INCENTIVE_RATES_UPLOAD_COLUMNS,
  getIncentiveRateActivityLog,
  toIncentiveRatesTableData,
} from "../../../config/IncentiveRatesConfig";
import type { IncentiveRateCategory } from "../../../config/IncentiveRatesConfig";
import type {
  CategoryGroup,
  SubCategoryGroup,
  GroupedTableColumn,
  UploadingFileState,
  RowValidationResult,
  BulkUploadColumnConfig,
  ProductActivityLogEntry,
  IncentiveRatesUploadRow,
} from "../../../types/salesIncentive.types";

/* ---- Bulk-upload column config (from Config.json) ---- */

const productUploadColumns: BulkUploadColumnConfig<Record<string, any>>[] = (
  (Config as any).ProductUploadColumns ?? []
).map((col: any) => ({
  key: col.apiField,
  header: col.header,
  required: col.required ?? false,
  type: (col.type as "string" | "number" | "date") ?? "string",
}));

/* ---- Helpers ---- */

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
  if (parts.length < 3) return display;
  const day = parts[0].padStart(2, "0");
  const month = String(MONTHS.indexOf(parts[1]) + 1).padStart(2, "0");
  return `${parts[2]}-${month}-${day}`;
}

function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

const TOMORROW_ISO = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
})();

/* ---- Location state from bulk upload ---- */

interface IncentiveRatesLocationState {
  bulkUploadSuccessCount?: number;
  addedProducts?: Record<string, any>[];
}

/* ---- Constants ---- */

const PAGE_SIZE = 10;
const layout =
  (PageLayOut as any)?.IncentiveRates ?? (PageLayOut as any)?.Products;

/* ---- Main Component ---- */

export default function IncentiveRatesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = useAuthStore((s) => s.sessionData);
  const [productTemplate, setProductTemplate] = useState<any>([]);
  const [uploadingFile, setUploadingFile] = useState<UploadingFileState | null>(
    null,
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [categories, setCategories] = useState<IncentiveRateCategory[]>([]);
  const [listingRefreshVersion, setListingRefreshVersion] = useState(0);
  const { mutate: fetchBulkTemplate } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleGetProductBulkTemplate(variables.payload, variables.token),
    onSuccess: (response: any) => {
      if (response?.status === 200) {
        const decryptedData = decrypt(
          response?.data,
          sessionData?.Key,
          sessionData?.Vector,
        );
        const parsedData = parseNestedJson(JSON.parse(decryptedData));
        setProductTemplate(parsedData?.dynamicObject[0]);
      }
    },
  });
  const {
    mutate: handleUpsertIncentiveProductMapping,
    isPending: isAddSubmitting,
  } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleUpsertIncentiveRates(variables.payload, variables.token),
    onSuccess: (response: any) => {
      if (response?.status === 200) {
        const decryptedData = decrypt(
          response?.data,
          sessionData?.Key,
          sessionData?.Vector,
        );
        const parsedData = parseNestedJson(JSON.parse(decryptedData));
        if (parsedData?.Status) {
          setIsAddOpen(false);
          setListingRefreshVersion((version) => version + 1);
          showToast({
            type: "success",
            title: "Success!",
            message: parsedData?.Message,
            duration: 2000,
          });
        } else {
          showToast({
            type: "error",
            title: "Error!",
            message: parsedData?.Message,
            duration: 2000,
          });
        }
      }
    },
  });

  const downloadExcelTemplate = (response: any) => {
    const base64 = response?.dynamicObject;
    if (!base64) return;
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "IncentiveRatesTemplate.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const { mutate: fetchExcelTemplate } = useMutation({
    mutationFn: (variables: { payload: string; token: string }) =>
      handleGetExcelTemplate(variables.payload, variables.token),
    onSuccess: (response: any) => {
      if (response?.status === 200) {
        const decryptedData = decrypt(
          response?.data,
          sessionData?.Key,
          sessionData?.Vector,
        );
        const parsedData = parseNestedJson(JSON.parse(decryptedData));
        downloadExcelTemplate(parsedData);
      }
    },
  });
  const { mutate: handleFetchIncentiveData, isPending: isListingLoading } =
    useMutation({
      mutationFn: () =>
        handleGetIncentiveRates(
          sessionData?.Key,
          sessionData?.Vector,
          sessionData?.Token,
        ),
      onSuccess: (response: any) => {
        if (response?.status === 200) {
          const decryptedData = decrypt(
            response?.data,
            sessionData?.Key,
            sessionData?.Vector,
          );
          const parsedData = parseNestedJson(JSON.parse(decryptedData));
          const tableData: IncentiveRateCategory[] = parsedData?.Result?.reduce(
            (acc: IncentiveRateCategory[], item: any) => {
              const category = item?.IncentiveProductCategory ?? "";
              const newItem = {
                id: item?.Id,
                subCategory: item?.IncentiveProductSubCategory ?? "",
                product: item?.IncentiveProduct ?? "",
                eligibleIncentive: item?.EligibleIncentiveAmount ?? 0,
                effectiveDate: item?.EffectiveDate ?? "",
                effectiveFrom: item?.EffectiveFrom ?? "",
                effectiveTo: item?.EffectiveTo ?? "",
                categoryId: item?.IncentiveProductCategoryId,
                subCategoryId: item?.IncentiveProductSubCategoryId,
                productId: item?.IncentiveProductId,
              };
              const existingCategory = acc.find(
                (item) => item.category === category,
              );
              if (existingCategory) {
                existingCategory.items.push(newItem);
              } else {
                acc.push({
                  category,
                  items: [newItem],
                });
              }
              return acc;
            },
            [],
          );
          console.log(tableData, "tableData");
          setCategories(tableData);
        }
      },
    });

  useEffect(() => {
    handleFetchIncentiveData();
  }, [handleFetchIncentiveData, listingRefreshVersion]);

  useEffect(() => {
    if (sessionData?.Key && sessionData?.Vector && sessionData?.Token) {
      const encPayload = encrypt(
        JSON.stringify(Config.IncentiveRatesBulkConfig),
        sessionData.Key,
        sessionData.Vector,
      );
      const stdBase64 = encPayload.replace(/\*/g, "+").replace(/-/g, "/");
      fetchBulkTemplate({
        payload: stdBase64,
        token: sessionData.Token,
      });
    }
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    eligibleIncentive?: number;
    effectiveDate?: string;
  }>({});
  const [isAddOpen, setIsAddOpen] = useState(false);

  function handleAddIncentiveRate(values: AddIncentiveRateValues) {
    const encPayload = encrypt(
      JSON.stringify(values),
      sessionData.Key,
      sessionData.Vector,
    );
    const stdBase64 = encPayload.replace(/\*/g, "+").replace(/-/g, "/");
    handleUpsertIncentiveProductMapping({
      payload: stdBase64,
      token: sessionData?.Token,
    });
  }

  /* ---- Activity log state ---- */

  const [activityLog, setActivityLog] = useState<{
    title: string;
    entries: ProductActivityLogEntry[];
  } | null>(null);

  /* ---- Bulk upload success handling ---- */

  useEffect(() => {
    const state = location.state as IncentiveRatesLocationState | undefined;
    if (!state?.addedProducts?.length) return;
    showToast({
      type: "success",
      title: "Success!",
      message: `${state.bulkUploadSuccessCount ?? state.addedProducts.length} records have been added`,
      duration: 3000,
    });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  /* ---- Table data (converted + global-search-filtered) ---- */

  const tableData = useMemo(() => {
    let data = toIncentiveRatesTableData(categories);
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      data = data
        .map((cat) => {
          if (cat.category.toLowerCase().includes(q)) return cat;
          return {
            ...cat,
            subCategories: cat.subCategories.filter((sub) =>
              sub.subCategory.toLowerCase().includes(q),
            ),
          };
        })
        .filter((cat) => cat.subCategories.length > 0);
    }
    return data;
  }, [categories, searchTerm]);

  /* ---- Edit handlers ---- */

  function startEdit(categoryName: string, subCategoryName: string) {
    const cat = categories.find((c) => c.category === categoryName);
    const item = cat?.items.find((i) => i.subCategory === subCategoryName);
    if (!item) return;
    setEditingKey(`${categoryName}||${subCategoryName}`);
    setEditValues({
      eligibleIncentive: item.eligibleIncentive,
      effectiveDate: item.effectiveDate,
    });
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValues({});
  }

  function confirmEdit() {
    if (!editingKey) return;
    const [cat, subCat] = editingKey.split("||");
    setCategories((prev) =>
      prev.map((c) =>
        c.category === cat
          ? {
              ...c,
              items: c.items.map((item) =>
                item.subCategory === subCat
                  ? {
                      ...item,
                      eligibleIncentive:
                        editValues.eligibleIncentive ?? item.eligibleIncentive,
                      effectiveDate:
                        editValues.effectiveDate ?? item.effectiveDate,
                    }
                  : item,
              ),
            }
          : c,
      ),
    );
    setEditingKey(null);
    setEditValues({});
    showToast({
      type: "success",
      title: "Updated",
      message: "Incentive rate updated successfully",
      duration: 2000,
    });
  }

  function handleEditChange(key: string, value: string | number) {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  }

  /* ---- Activity log ---- */

  function openLog(subCategory: string) {
    setActivityLog({
      title: subCategory,
      entries: getIncentiveRateActivityLog(subCategory),
    });
  }

  /* ---- Sample download ---- */

  const handleSampleDownload = useCallback(() => {
    if (!sessionData?.Key || !sessionData?.Vector || !sessionData?.Token)
      return;
    const param = {
      ImportLayout: productTemplate,
      FillWithData: null,
      SearchElements: [],
      ExtraParameters: null,
    };
    const encPayload = encrypt(
      JSON.stringify(param),
      sessionData.Key,
      sessionData.Vector,
    );
    const stdBase64 = encPayload.replace(/\*/g, "+").replace(/-/g, "/");
    fetchExcelTemplate({
      payload: stdBase64,
      token: sessionData.Token,
    });
  }, [productTemplate, sessionData, fetchExcelTemplate]);

  /* ---- Download Excel ---- */

  const handleDownloadExcel = useCallback(() => {
    const exportRows: Record<string, any>[] = [];
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        exportRows.push({
          Category: cat.category,
          "Sub Category": item.subCategory,
          "Eligible Incentive (₹)": item.eligibleIncentive,
          "Effective Date": item.effectiveDate,
        });
      });
    });
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
        key: "Eligible Incentive (₹)",
        header: "Eligible Incentive (₹)",
        required: true,
        type: "number",
      },
      {
        key: "Effective Date",
        header: "Effective Date",
        required: true,
        type: "string",
      },
    ];
    generateSampleFile(
      exportCols,
      exportRows,
      "IncentiveRates.xlsx",
      "IncentiveRates",
    );
  }, [categories]);

  /* ---- File upload ---- */

  const handleFilesReceived = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;

      setFileError(null);
      setUploadingFile({ name: file.name, progress: 0 });

      try {
        const buffer = await file.arrayBuffer();
        setUploadingFile((prev) => (prev ? { ...prev, progress: 100 } : prev));

        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setFileError("The uploaded file has no sheets.");
          setUploadingFile(null);
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(
          workbook.Sheets[sheetName],
        ) as IncentiveRatesUploadRow[];

        const validRows: RowValidationResult<IncentiveRatesUploadRow>[] = [];
        const invalidRows: RowValidationResult<IncentiveRatesUploadRow>[] = [];

        jsonData.forEach((row, i) => {
          const errors: string[] = [];

          INCENTIVE_RATES_UPLOAD_COLUMNS.forEach((col) => {
            const value = row[col.key as string];
            const isEmpty =
              value === undefined ||
              value === null ||
              String(value).trim() === "";
            if (col.required && isEmpty) {
              errors.push(`${col.header} is required`);
            }
            if (!isEmpty) {
              if (col.type === "number" && isNaN(Number(value))) {
                errors.push(`${col.header} must be a number`);
              }
              if (col.type === "date") {
                const dateStr = String(value).trim();
                const isValidFormat =
                  /^\d{2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/.test(
                    dateStr,
                  );
                if (!isValidFormat) {
                  errors.push(
                    `${col.header} must be in DD MMM YYYY format (e.g. 22 Aug 2027)`,
                  );
                }
              }
            }
          });

          const isRowFullyBlank = INCENTIVE_RATES_UPLOAD_COLUMNS.every(
            (col) => {
              const v = row[col.key as string];
              return v === undefined || v === null || String(v).trim() === "";
            },
          );
          if (isRowFullyBlank) return;

          const result: RowValidationResult<IncentiveRatesUploadRow> = {
            rowNumber: i + 1,
            data: row,
            errors,
          };
          (errors.length === 0 ? validRows : invalidRows).push(result);
        });

        setUploadingFile(null);
        navigate("/incentiveRates/bulkUpload", {
          state: { validRows, invalidRows },
        });
      } catch {
        setFileError(
          "Could not read the file. It may be corrupted or in an unsupported format.",
        );
        setUploadingFile(null);
      }
    },
    [navigate],
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

  const hasData = categories.length > 0;

  return (
    <div
      className={`px-h pt-12 bg-bgcolor flex flex-col ${hasData ? "h-full overflow-hidden" : "min-h-[100%] overflow-scroll scrollbar-hide"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-heading-6 text-darkgray">
          {layout?.PageTitle ?? "Incentive Rates"}
        </p>
        <div className="flex items-center gap-12">
          <CustomButton
            title={
              layout?.CustomButtons?.AddProductButton?.Name ?? "+ Add Product"
            }
            backgroundColor="bg-white"
            height="h-37"
            gap="gap-[7px]"
            borderRadius="rounded-6"
            borderColor="border-primary"
            textColor="text-primary"
            borderWidth="border-1"
            onClick={() => setIsAddOpen(true)}
          />
          {(layout?.IsBulkUploadRequired ?? true) && (
            <CustomButton
              backgroundColor="bg-primary"
              height="h-37"
              width="w-[119px]"
              gap="gap-[6px]"
              title={layout?.CustomButtons?.UploadButton?.Name ?? "Bulk Upload"}
              borderRadius="rounded-6"
              textColor="text-white"
              icon={
                <IconRenderer
                  icon={layout?.CustomButtons?.UploadButton?.Icon ?? "FiUpload"}
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

      {hasData ? (
        <div className="flex-1 min-h-0 border-1 border-strokegray rounded-6 bg-white mt-14 mb-14 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-16 mt-14">
            <div className="w-[360px]">
              <CustomInput
                rightIcon="FiSearch"
                placeholder="Search..."
                height="h-[42px]"
                rightIconStyle="text-gray"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e)}
              />
            </div>
            <CustomButton
              title={
                layout?.CustomButtons?.DownloadButton?.Name ?? "Download Excel"
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
          <div className="flex-1 min-h-0 px-16 mt-10 incentive-rates-table">
            <style>{`
              .incentive-rates-table .grouped-table td[rowspan] {
                border-right: 1.5px solid #eee;
              }
              .incentive-rates-table .grouped-table__scroll-wrapper {
                scrollbar-gutter: stable;
              }
            `}</style>
            <GroupedIncentiveTable
              columns={INCENTIVE_RATES_COLUMNS}
              data={tableData}
              evenDataBackgroundColor="#F8F9FB"
              showVerticalLines={true}
              pagination={true}
              pageSize={PAGE_SIZE}
              emptyMessage="No incentive rates found."
              renderCustomCell={(
                column: GroupedTableColumn,
                category: CategoryGroup,
                subCategory: SubCategoryGroup,
              ) => {
                const rowKey = `${category.category}||${subCategory.subCategory}`;
                const isEditing = editingKey === rowKey;

                switch (column.key) {
                  case "eligibleIncentive":
                    if (isEditing) {
                      return (
                        <input
                          type="number"
                          min={0}
                          value={
                            editValues.eligibleIncentive ??
                            subCategory.incentive ??
                            ""
                          }
                          onChange={(e) =>
                            handleEditChange(
                              "eligibleIncentive",
                              Number(e.target.value),
                            )
                          }
                          className="w-[80%] h-[29px] px-2 text-13 text-[#59596C] border border-[#ddd] rounded-4 outline-none bg-white"
                        />
                      );
                    }
                    return subCategory.incentive ?? "";

                  case "effectiveDate":
                    if (isEditing) {
                      return (
                        <input
                          type="date"
                          min={TOMORROW_ISO}
                          value={displayToISO(
                            editValues.effectiveDate ??
                              subCategory.products[0]?.effectiveDate ??
                              "",
                          )}
                          onChange={(e) =>
                            handleEditChange(
                              "effectiveDate",
                              isoToDisplay(e.target.value),
                            )
                          }
                          className="w-[80%] h-[29px] px-2 text-13 text-[#59596C] border border-[#ddd] rounded-4 outline-none bg-white cursor-pointer"
                        />
                      );
                    }
                    return subCategory.products[0]?.effectiveDate ?? "";

                  case "action":
                    if (isEditing) {
                      return (
                        <div className="flex items-center justify-center gap-[15px]">
                          <button
                            aria-label="Cancel"
                            className="cursor-pointer"
                            onClick={cancelEdit}
                          >
                            <IconRenderer
                              icon="FaRegTimesCircle"
                              size={18}
                              className="text-danger"
                            />
                          </button>
                          <button
                            aria-label="Confirm"
                            className="cursor-pointer"
                            onClick={confirmEdit}
                          >
                            <IconRenderer
                              icon="LuCircleCheckBig"
                              size={18}
                              className="text-[#22C55E]"
                            />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center justify-center gap-[15px]">
                        <button
                          aria-label="History"
                          className="cursor-pointer"
                          onClick={() => openLog(subCategory.subCategory)}
                        >
                          <IconRenderer
                            icon={layout?.HistoryIcon ?? "GoHistory"}
                            size={16}
                            className="text-gray"
                          />
                        </button>
                        <button
                          aria-label="Edit"
                          className="cursor-pointer"
                          onClick={() =>
                            startEdit(
                              category.category,
                              subCategory.subCategory,
                            )
                          }
                        >
                          <IconRenderer
                            icon={layout?.EditIcon ?? "RxPencil1"}
                            size={16}
                            className="text-gray"
                          />
                        </button>
                      </div>
                    );

                  default:
                    return undefined;
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 border-1 border-strokegray rounded-6 bg-white my-14 items-center justify-center">
          <NoDataFound
            description={
              (PageLayOut as any)?.NoDataFound?.SubTitle ??
              "Let's add incentive rates using the bulk upload option"
            }
            title={
              (PageLayOut as any)?.NoDataFound?.Title ?? "Looks like empty"
            }
          />
          <BulkUploadCard
            title={(PageLayOut as any)?.BuldUploadcard?.CardTitle}
            description={(PageLayOut as any)?.BuldUploadcard?.CardSubTitle}
            browseText={(PageLayOut as any)?.BuldUploadcard?.UploadLabel2}
            dragDropText={(PageLayOut as any)?.BuldUploadcard?.UploadLabel1}
            sampleButtonTitle={
              (PageLayOut as any)?.BuldUploadcard?.DownloadButtonText
            }
            sampleButtonIcon={(PageLayOut as any)?.BuldUploadcard?.DownloadIcon}
            uploadIcon={(PageLayOut as any)?.BuldUploadcard?.UploadIcon}
            filesHereText={(PageLayOut as any)?.BuldUploadcard?.UploadLabel3}
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

      {/* Add Incentive Rate */}
      <AddIncentiveRateModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddIncentiveRate}
        isSubmitting={isAddSubmitting}
      />

      {/* Activity Log */}
      <ProductActivityLog
        isOpen={!!activityLog}
        onClose={() => setActivityLog(null)}
        title={activityLog?.title ?? ""}
        entries={activityLog?.entries ?? []}
      />
      <LoaderModal
        isOpen={isListingLoading}
        message="Loading incentive rates..."
      />
    </div>
  );
}
