import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import addProductConfig from "../../../../../assets/json/addProductConfig.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import type {
  AddProductConfig,
  AddProductOption,
} from "../../../types/salesIncentive.types";
import ProductClassification from "./ProductClassification";
import ProductHierarchy from "./ProductHierarchy";
import ProductRows from "./ProductRows";
import SectionFields from "./SectionFields";

const config = addProductConfig as unknown as AddProductConfig;

interface ProductRowData {
  id: string;
  values: Record<string, string>;
}

function makeRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AddProduct() {
  const navigate = useNavigate();

  const [classificationValues, setClassificationValues] = useState<
    Record<string, string>
  >({});
  const [sectionValues, setSectionValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [productRows, setProductRows] = useState<ProductRowData[]>([
    { id: makeRowId(), values: {} },
  ]);
  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, AddProductOption[]>
  >({});

  const mergedSteps = config.classification.steps.map((step) => {
    const extra = dynamicOptions[step.id];
    if (!extra?.length) return step;
    if (step.options) {
      return { ...step, options: [...step.options, ...extra] };
    }
    if (step.optionsByParent) {
      const parentVal = classificationValues[step.dependsOn ?? ""];
      if (parentVal) {
        const merged = { ...step.optionsByParent };
        merged[parentVal] = [...(merged[parentVal] ?? []), ...extra];
        return { ...step, optionsByParent: merged };
      }
    }
    return step;
  });

  const handleAddOption = useCallback(
    (stepId: string, option: AddProductOption) => {
      setDynamicOptions((prev) => ({
        ...prev,
        [stepId]: [...(prev[stepId] ?? []), option],
      }));
    },
    [],
  );

  const handleClassificationChange = useCallback(
    (stepId: string, value: string) => {
      setClassificationValues((prev) => {
        const next = { ...prev, [stepId]: value };
        const steps = config.classification.steps.sort(
          (a, b) => a.order - b.order,
        );
        const idx = steps.findIndex((s) => s.id === stepId);
        for (let i = idx + 1; i < steps.length; i++) {
          delete next[steps[i].id];
        }
        return next;
      });
    },
    [],
  );

  const handleSectionFieldChange = useCallback(
    (sectionId: string, key: string, value: string) => {
      setSectionValues((prev) => ({
        ...prev,
        [sectionId]: { ...(prev[sectionId] ?? {}), [key]: value },
      }));
    },
    [],
  );

  const handleProductFieldChange = useCallback(
    (rowId: string, key: string, value: string) => {
      setProductRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, values: { ...r.values, [key]: value } } : r,
        ),
      );
    },
    [],
  );

  const handleAddRow = useCallback(() => {
    setProductRows((prev) => [...prev, { id: makeRowId(), values: {} }]);
  }, []);

  const handleRemoveRow = useCallback((rowId: string) => {
    setProductRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const handleCancel = () => navigate("/product");

  const handleSubmit = () => {
    const missingSteps = config.classification.steps.filter(
      (s) => !classificationValues[s.id],
    );
    if (missingSteps.length > 0) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: `Please select ${missingSteps.map((s) => s.label).join(", ")}`,
        duration: 3000,
      });
      return;
    }
    const emptyProducts = productRows.filter(
      (r) => !r.values.productName?.trim(),
    );
    if (emptyProducts.length > 0) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please enter Product Name for all product rows",
        duration: 3000,
      });
      return;
    }
    navigate("/product");
  };

  function getAppliedLabel(appliesTo: string): string {
    const val = classificationValues[appliesTo];
    if (!val) return "--";
    const step = mergedSteps.find((s) => s.id === appliesTo);
    if (!step) return val;
    const opts =
      step.options ??
      (step.dependsOn && step.optionsByParent
        ? (step.optionsByParent[classificationValues[step.dependsOn] ?? ""] ??
          [])
        : []);
    return opts.find((o) => o.value === val)?.label ?? val;
  }

  return (
    <div className="pt-12 flex flex-col h-full overflow-hidden bg-bgcolor">
      {/* Breadcrumb */}
      <div className="flex items-center gap-8 shrink-0 mx-24">
        <button
          onClick={handleCancel}
          className="flex items-center justify-center cursor-pointer"
          aria-label="Back"
        >
          <IconRenderer icon="LuArrowLeft" size={18} />
        </button>
        <p className="p-small text-gray">
          {config.breadcrumb.slice(0, -1).map((crumb) => (
            <span key={crumb}>{crumb} / </span>
          ))}
          <span className="text-darkgray font-semibold">
            {config.breadcrumb[config.breadcrumb.length - 1]}
          </span>
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 mt-16 flex gap-[16px] mx-24 mb-20 overflow-hidden">
        {/* Left — Form */}
        <div
          className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[16px] pr-[4px]"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Classification */}
          <ProductClassification
            steps={mergedSteps}
            values={classificationValues}
            onChange={handleClassificationChange}
            onAddOption={handleAddOption}
            title={config.classification.title}
            subtitle={config.classification.subtitle}
            icon={config.classification.icon}
            productCount={productRows.length}
          />

          {/* Dynamic Sections */}
          {config.sections.map((section) => (
            <SectionFields
              key={section.id}
              section={section}
              values={sectionValues[section.id] ?? {}}
              onChange={(key, value) =>
                handleSectionFieldChange(section.id, key, value)
              }
              appliedValue={getAppliedLabel(section.appliesTo)}
            />
          ))}

          {/* Product Rows */}
          <ProductRows
            title={config.productSection.title}
            subtitle={config.productSection.subtitle}
            icon={config.productSection.icon}
            fields={config.productSection.fields}
            rows={productRows}
            onFieldChange={handleProductFieldChange}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
          />
        </div>

        {/* Right — Hierarchy Sidebar */}
        <div className="w-[260px] shrink-0">
          <ProductHierarchy
            steps={mergedSteps}
            values={classificationValues}
            title={config.hierarchy.title}
            icon={config.hierarchy.icon}
            productCount={productRows.length}
            productNames={productRows
              .map((r) => r.values.productName?.trim())
              .filter(Boolean) as string[]}
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-end gap-10 px-24 py-[12px] shrink-0 border-t border-[#E5E7EB] bg-white">
        <CustomButton
          title={config.buttons.cancel.label}
          backgroundColor="bg-white"
          height="h-[38px]"
          gap="gap-[6px]"
          borderRadius="rounded-6"
          borderColor="border-[#E5E7EB]"
          textColor="text-darkgray"
          borderWidth="border-1"
          icon={
            <IconRenderer
              icon={config.buttons.cancel.icon}
              size={14}
              className="text-darkgray"
            />
          }
          iconPosition="left"
          onClick={handleCancel}
        />
        <CustomButton
          title={config.buttons.submit.label}
          backgroundColor="bg-primary"
          height="h-[38px]"
          gap="gap-[6px]"
          borderRadius="rounded-6"
          textColor="text-white"
          icon={
            <IconRenderer
              icon={config.buttons.submit.icon}
              size={14}
              className="text-white"
            />
          }
          iconPosition="left"
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}
