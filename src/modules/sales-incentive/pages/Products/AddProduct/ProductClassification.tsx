import { useRef, useState } from "react";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import type {
  AddProductOption,
  AddProductStep,
} from "../../../types/salesIncentive.types";
import AddNewModal from "./AddNewModal";
import SearchableDropdown from "./SearchableDropdown";
import ProductClassificationIcon from "../../../../../assets/icons/AddProduct/ProductClassification.svg";
import {
  handleCreatecategory,
  handleCreateSubcategory,
} from "../../../../../query/api";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../../../../app/store/useAuthStore";
import encrypt from "../../../../../utils/security/encrypt";
import decrypt from "../../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../../utils/security/ParseData";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import LoaderModal from "../../../../../shared/components/ui/LoaderModal/LoaderModal";

interface ProductClassificationProps {
  steps: AddProductStep[];
  values: Record<string, string>;
  onChange: (stepId: string, value: string) => void;
  onAddOption: (stepId: string, option: AddProductOption) => void;
  title: string;
  subtitle: string;
  productCount?: number;
  onRefreshCategories: () => Promise<AddProductOption[]>;
}

export default function ProductClassification({
  steps,
  values,
  onChange,
  onAddOption,
  title,
  subtitle,
  productCount = 0,
  onRefreshCategories,
}: ProductClassificationProps) {
  const [addModalStepId, setAddModalStepId] = useState<string | null>(null);
  const sessionData = useAuthStore((s) => s.sessionData);
  const pendingAddRef = useRef<{
    name: string;
    description: string;
    stepId: string;
  } | null>(null);
  const codeSequenceRef = useRef(0);

  const handleMutationResult = async (response: unknown) => {
    const pendingAdd = pendingAddRef.current;
    pendingAddRef.current = null;
    if (!pendingAdd) return;

    try {
      const responseRecord = response as {
        status?: number;
        data?: unknown;
      };
      if (
        typeof responseRecord.status !== "number" ||
        responseRecord.status < 200 ||
        responseRecord.status >= 300
      ) {
        const errorData =
          responseRecord.data && typeof responseRecord.data === "object"
            ? (responseRecord.data as Record<string, unknown>)
            : {};
        throw new Error(
          typeof errorData.message === "string"
            ? errorData.message
            : "Unable to create this classification.",
        );
      }
      const responseBody = responseRecord.data;
      const responseData =
        typeof responseBody === "string"
          ? responseBody
          : responseBody && typeof responseBody === "object"
            ? (responseBody as Record<string, unknown>).data
            : undefined;
      const parsedResponse = responseData
        ? parseNestedJson(
            JSON.parse(
              decrypt(
                String(responseData),
                sessionData?.Key ?? "",
                sessionData?.Vector ?? "",
              ),
            ),
          )
        : parseNestedJson(responseBody);
      if (parsedResponse?.Status === false) {
        throw new Error(
          parsedResponse?.Message ?? "Unable to create this classification.",
        );
      }

      let categoryRefreshFailed = false;
      if (pendingAdd.stepId === "category") {
        try {
          const refreshedOptions = await onRefreshCategories();
          const createdOption = refreshedOptions.find(
            (option) =>
              option.label.toLowerCase() === pendingAdd.name.toLowerCase(),
          );
          if (createdOption) onChange(pendingAdd.stepId, createdOption.value);
        } catch {
          categoryRefreshFailed = true;
        }
      } else {
        onAddOption(pendingAdd.stepId, {
          label: pendingAdd.name,
          value: pendingAdd.name,
        });
        onChange(pendingAdd.stepId, pendingAdd.name);
      }

      showToast({
        type: categoryRefreshFailed ? "error" : "success",
        title: categoryRefreshFailed ? "Created, refresh failed" : "Success",
        message: categoryRefreshFailed
          ? "Category created, but the category list could not be refreshed."
          : (parsedResponse?.Message ?? "Classification created successfully."),
        duration: 3000,
      });
      setAddModalStepId(null);
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create this classification.",
        duration: 3000,
      });
    }
  };

  const { isPending: createCategoryPending, mutate: handlecreateCat } =
    useMutation({
      mutationFn: (variables: { payload: string; token: string }) =>
        handleCreatecategory(variables.payload, variables.token),
      onSuccess: handleMutationResult,
      onError: (error) => {
        console.log("Create category error:", error);
        pendingAddRef.current = null;
        showToast({
          type: "error",
          title: "Error",
          message: "Unable to create category. Please try again.",
          duration: 3000,
        });
      },
    });

  const { isPending: createSubCategoryPending, mutate: handlecreateSubCat } =
    useMutation({
      mutationFn: (variables: { payload: string; token: string }) =>
        handleCreateSubcategory(variables.payload, variables.token),
      onSuccess: handleMutationResult,
      onError: (error) => {
        console.log("Create subcategory error:", error);
        pendingAddRef.current = null;
        showToast({
          type: "error",
          title: "Error",
          message: "Unable to create sub category. Please try again.",
          duration: 3000,
        });
      },
    });

  const handleCreate = (name: string, description: string) => {
    if (!modalStep) return;
    if (!name || !description) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Name and Description are required.",
        duration: 3000,
      });
      return;
    }
    if (!sessionData?.Key || !sessionData?.Vector || !sessionData?.Token) {
      showToast({
        type: "error",
        title: "Session Error",
        message: "Session data not available. Please log in again.",
        duration: 3000,
      });
      return;
    }
    const codePrefix = name.slice(0, 3).toUpperCase();
    codeSequenceRef.current = (codeSequenceRef.current % 999) + 1;
    const codeSuffix = String(codeSequenceRef.current).padStart(3, "0");
    pendingAddRef.current = { name, description, stepId: modalStep.id };
    if (modalStep.id === "category") {
      const params = {
        Id: 0,
        Code: `${codePrefix}${codeSuffix}`,
        Name: name,
        Description: description,
        Status: 1,
      };
      const encParams = encrypt(
        JSON.stringify(params),
        sessionData?.Key,
        sessionData?.Vector,
      );
      handlecreateCat({
        payload: encParams,
        token: sessionData?.Token ?? "",
      });
    } else {
      const categoryId = Number(values[modalStep.dependsOn ?? ""]);
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        pendingAddRef.current = null;
        showToast({
          type: "error",
          title: "Validation Error",
          message: "Select a valid Category before adding a Sub Category.",
          duration: 3000,
        });
        return;
      }
      const params = {
        Id: 0,
        Code: `${codePrefix}${codeSuffix}`,
        Name: name,
        Description: description,
        IncentiveProductCategoryId: categoryId,
        Status: 1,
      };
      const encParams = encrypt(
        JSON.stringify(params),
        sessionData?.Key,
        sessionData?.Vector,
      );
      handlecreateSubCat({
        payload: encParams,
        token: sessionData?.Token ?? "",
      });
    }
  };

  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const modalStep = addModalStepId
    ? sorted.find((s) => s.id === addModalStepId)
    : null;
  function getOptions(step: AddProductStep) {
    if (step.options) return step.options;
    if (step.dependsOn && step.optionsByParent) {
      const parentVal = values[step.dependsOn];
      return parentVal ? (step.optionsByParent[parentVal] ?? []) : [];
    }
    return [];
  }

  function isDisabled(step: AddProductStep) {
    if (!step.dependsOn) return false;
    return !values[step.dependsOn];
  }

  function isSelected(step: AddProductStep) {
    return !!values[step.id];
  }

  const allSelected = sorted.every((s) => isSelected(s));
  const hasAnySelection = sorted.some((s) => isSelected(s));

  function isNextToFill(step: AddProductStep): boolean {
    if (isSelected(step)) return false;
    if (isDisabled(step)) return false;
    if (!hasAnySelection) return false;
    return true;
  }
  const nextStepIdx = sorted.findIndex((s) => isNextToFill(s));

  const isSaving = createCategoryPending || createSubCategoryPending;

  return (
    <div className="border border-strokegray rounded-6 bg-white shadow-card-xl">
      {/* Header */}
      <div className="flex items-center gap-[10px] px-[20px] py-[14px] border-b border-strokegray">
        <div className="w-[29px] h-[29px] rounded-full bg-[#DFE7FF] flex items-center justify-center">
          <IconRenderer imageUrl={ProductClassificationIcon} />
        </div>
        <div>
          <p className="text-14 font-semibold text-darkgray">{title}</p>
          <p className="text-12 text-gray">{subtitle}</p>
        </div>
      </div>

      {/* Steps Row */}
      <div className="flex items-stretch gap-[12px] px-[20px] py-[18px]">
        {sorted.map((step, idx) => {
          const stepNum = String(step.order).padStart(2, "0");
          const disabled = isDisabled(step);
          const isNext = idx === nextStepIdx;

          return (
            <div
              key={step.id}
              className="flex items-stretch gap-[12px] flex-1 min-w-0"
            >
              {/* Step Card */}
              <div
                className={`flex-1 min-w-0 rounded-[6px] h-[77px] p-[14px] border ${
                  isNext
                    ? "border-dashed border-[#707AFD] bg-[#F5F7FF]"
                    : "border-strokegray bg-white"
                }`}
              >
                <div className="flex items-center gap-[8px] mb-[10px]">
                  <span className="text-11 font-bold px-[6px] py-[1px] rounded-[4px] bg-[#FFF4EA] text-[#FFA55B]">
                    {stepNum}
                  </span>
                  <span className="text-12 font-medium text-[#59596C]">
                    {step.label}
                  </span>
                </div>
                <SearchableDropdown
                  options={getOptions(step)}
                  value={values[step.id] ?? ""}
                  onChange={(v) => onChange(step.id, v)}
                  placeholder={step.placeholder}
                  searchable={step.searchable}
                  allowAdd={step.allowAdd}
                  addLabel={step.addLabel}
                  disabled={disabled}
                  onAddNew={() => setAddModalStepId(step.id)}
                />
              </div>

              {/* Arrow Separator */}
              {idx < sorted.length - 1 && (
                <div className="flex items-center shrink-0">
                  <IconRenderer
                    icon="FiArrowRight"
                    size={16}
                    className="text-[#D1D5DB]"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Products Summary Step */}
        <div className="flex items-stretch gap-[12px] flex-1 min-w-0">
          <div className="flex items-center shrink-0">
            <IconRenderer
              icon="FiArrowRight"
              size={16}
              className="text-[#D1D5DB]"
            />
          </div>
          <div
            className={`flex-1 min-w-0 rounded-[6px] h-[77px] p-[14px] border ${
              allSelected
                ? "border-dashed border-[#707AFD] bg-[#F5F7FF]"
                : "border-strokegray bg-white"
            }`}
          >
            <div className="flex items-center gap-[8px] mb-[10px]">
              <span className="text-11 font-bold px-[6px] py-[1px] rounded-[4px] bg-[#FFF4EA] text-[#FFA55B]">
                {String(sorted.length + 1).padStart(2, "0")}
              </span>
              <span className="text-12 font-medium text-[#59596C]">
                Products
              </span>
            </div>
            <p className="text-14 text-darkgray">{productCount} Products</p>
          </div>
        </div>
      </div>

      {/* Add New Modal */}
      {modalStep && (
        <AddNewModal
          title={`Add New ${modalStep.label}`}
          label={`New ${modalStep.label}`}
          placeholder={`Enter ${modalStep.label} Name`}
          onCancel={() => setAddModalStepId(null)}
          onSave={handleCreate}
          isSaving={isSaving}
        />
      )}
      <LoaderModal
        isOpen={isSaving}
        message={
          modalStep?.id === "subCategory"
            ? "Adding sub category..."
            : "Adding category..."
        }
      />
    </div>
  );
}
