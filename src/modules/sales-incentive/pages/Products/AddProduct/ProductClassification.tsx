import { useState } from "react";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import type {
  AddProductOption,
  AddProductStep,
} from "../../../types/salesIncentive.types";
import AddNewModal from "./AddNewModal";
import SearchableDropdown from "./SearchableDropdown";
import ProductClassificationIcon from "../../../../../assets/icons/AddProduct/ProductClassification.svg";

interface ProductClassificationProps {
  steps: AddProductStep[];
  values: Record<string, string>;
  onChange: (stepId: string, value: string) => void;
  onAddOption: (stepId: string, option: AddProductOption) => void;
  title: string;
  subtitle: string;
  icon: string;
  productCount?: number;
}

export default function ProductClassification({
  steps,
  values,
  onChange,
  onAddOption,
  title,
  subtitle,
  icon,
  productCount = 0,
}: ProductClassificationProps) {
  const [addModalStepId, setAddModalStepId] = useState<string | null>(null);
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
          const selected = isSelected(step);
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
          onSave={(name) => {
            const slug = name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
            onAddOption(modalStep.id, { label: name, value: slug });
            onChange(modalStep.id, slug);
            setAddModalStepId(null);
          }}
        />
      )}
    </div>
  );
}
