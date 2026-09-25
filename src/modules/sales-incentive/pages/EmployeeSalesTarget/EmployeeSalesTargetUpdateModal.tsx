import { useMemo, useState } from "react";
import CustomModal from "../../../../shared/components/ui/Modal/CustomModal";
import CustomAvatar from "../../../../shared/components/ui/Avatar/Avatar";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import CustomButton from "../../../../shared/components/ui/Button/CustomButton";
import { showToast } from "../../../../shared/components/ui/CustomToast/UseToast";

interface ProductDetail {
  subCategoryName: string;
  salesTarget: number;
  incentive: number;
  actualQuantity: number;
  incentiveEligibility: number;
}

export interface EmployeeTargetData {
  employeeCode: string;
  employeeName: string;
  company: string;
  location: string;
  managerCode: string;
  managerName: string;
  month: string;
  ProductDetails: ProductDetail[];
}

const DUMMY_DATA: EmployeeTargetData = {
  employeeCode: "76077",
  employeeName: "Test update Shalini",
  company: "Vasanth & Co",
  location: "Bangalore",
  managerCode: "27521",
  managerName: "rajesh magaji",
  month: "September 2026",
  ProductDetails: [
    {
      subCategoryName: "Basic Rice Cooker",
      salesTarget: 45,
      incentive: 800,
      actualQuantity: 77,
      incentiveEligibility: 85,
    },
    {
      subCategoryName: "Automatic Rice Cooker",
      salesTarget: 25,
      incentive: 900,
      actualQuantity: 0,
      incentiveEligibility: 85,
    },
    {
      subCategoryName: "Juice Mixer Grinder",
      salesTarget: 25,
      incentive: 900,
      actualQuantity: 0,
      incentiveEligibility: 85,
    },
  ],
};

const DUMMY_SUB_CATEGORIES = ["Standard Mixer Grinder", "Electric Kettle"];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type FieldErrors = Record<number, Partial<Record<string, string>>>;

interface EmployeeSalesTargetUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeSalesTargetUpdateModal({
  isOpen,
  onClose,
}: EmployeeSalesTargetUpdateModalProps) {
  const data = DUMMY_DATA;

  const [products, setProducts] = useState<ProductDetail[]>(
    data.ProductDetails,
  );
  const [expandedCards, setExpandedCards] = useState<Set<number>>(
    () => new Set(data.ProductDetails.map((_, i) => i)),
  );
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const totalIncentive = useMemo(
    () => products.reduce((sum, p) => sum + p.incentive, 0),
    [products],
  );

  function getAvailableOptions(currentIdx: number) {
    const usedNames = products
      .filter((_, i) => i !== currentIdx)
      .map((p) => p.subCategoryName)
      .filter(Boolean);
    return DUMMY_SUB_CATEGORIES.filter((sc) => !usedNames.includes(sc));
  }

  function toggleCard(idx: number) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function removeProduct(idx: number) {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
    setExpandedCards((prev) => {
      const next = new Set<number>();
      prev.forEach((v) => {
        if (v < idx) next.add(v);
        else if (v > idx) next.add(v - 1);
      });
      return next;
    });
    setFieldErrors((prev) => {
      const next: FieldErrors = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i < idx) next[i] = v;
        else if (i > idx) next[i - 1] = v;
      });
      return next;
    });
    if (openDropdownIdx === idx) setOpenDropdownIdx(null);
    else if (openDropdownIdx !== null && openDropdownIdx > idx)
      setOpenDropdownIdx(openDropdownIdx - 1);
  }

  function updateProduct(
    idx: number,
    field: keyof ProductDetail,
    value: number,
  ) {
    setProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
    setFieldErrors((prev) => {
      const cardErrors = prev[idx];
      if (!cardErrors) return prev;
      const { [field]: _, ...rest } = cardErrors;
      if (Object.keys(rest).length === 0) {
        const { [idx]: __, ...outer } = prev;
        return outer;
      }
      return { ...prev, [idx]: rest };
    });
  }

  function updateSubCategoryName(idx: number, name: string) {
    setProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, subCategoryName: name } : p)),
    );
    setOpenDropdownIdx(null);
    setFieldErrors((prev) => {
      const cardErrors = prev[idx];
      if (!cardErrors?.subCategoryName) return prev;
      const { subCategoryName: _, ...rest } = cardErrors;
      if (Object.keys(rest).length === 0) {
        const { [idx]: __, ...outer } = prev;
        return outer;
      }
      return { ...prev, [idx]: rest };
    });
  }

  function addSubCategory() {
    const newIdx = products.length;
    setProducts((prev) => [
      ...prev,
      {
        subCategoryName: "",
        salesTarget: 0,
        incentive: 0,
        actualQuantity: 0,
        incentiveEligibility: 0,
      },
    ]);
    setExpandedCards((prev) => new Set([...prev, newIdx]));
    setOpenDropdownIdx(newIdx);
  }

  function handleSave() {
    const errors: FieldErrors = {};
    let hasErrors = false;

    products.forEach((p, idx) => {
      const errs: Record<string, string> = {};
      if (!p.subCategoryName) {
        errs.subCategoryName = "Sub Category is required";
        hasErrors = true;
      }
      if (!p.salesTarget || p.salesTarget <= 0) {
        errs.salesTarget = "Sales Target is required";
        hasErrors = true;
      }
      if (p.incentive < 0 || isNaN(p.incentive)) {
        errs.incentive = "Incentive must be a valid value";
        hasErrors = true;
      }
      if (!p.incentiveEligibility || p.incentiveEligibility <= 0) {
        errs.incentiveEligibility = "Incentive Eligibility is required";
        hasErrors = true;
      }
      if (Object.keys(errs).length > 0) {
        errors[idx] = errs;
      }
    });

    setFieldErrors(errors);

    if (hasErrors) {
      setExpandedCards((prev) => {
        const next = new Set(prev);
        Object.keys(errors).forEach((k) => next.add(Number(k)));
        return next;
      });
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please fix the highlighted fields before saving.",
        duration: 3000,
      });
      return;
    }

    showToast({
      type: "success",
      title: "Validated",
      message: "All records are valid. Save API not implemented yet.",
      duration: 3000,
    });
  }

  return (
    <CustomModal isOpen={isOpen}>
      <div className="w-[750px] bg-white h-full flex flex-col">
        <div className="bg-primary h-[140px] rounded-br-[20px] rounded-bl-[20px] px-[25px] shrink-0">
          <div className="flex justify-between py-10 border-b border-gray">
            <p className="text-white text-heading-6">Employee Sales Target</p>
            <IconRenderer
              icon="IoMdClose"
              color="#A8A8AD"
              size={20}
              onClick={onClose}
              className="cursor-pointer"
            />
          </div>
          {data && (
            <div className="flex items-center justify-between">
              <div className="flex items-center mt-[23px] gap-x-14">
                <CustomAvatar
                  backgroundColor="bg-[#FFFFFF2E]"
                  height="h-[42px]"
                  width="w-[42px]"
                  title={initials(data.employeeName)}
                  borderWidth="border-1"
                />
                <div className="gap-[5px] flex flex-col">
                  <div className="flex items-center gap-[5px]">
                    <p className="text-white font-semibold text-16">
                      {data?.employeeName}
                    </p>
                    <p className="text-strokegray font-normal text-12">
                      ({data?.employeeCode})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-12 font-normal text-strokegray">
                      {data?.company} - {data?.location}
                    </p>
                    <div className="w-4 h-4 rounded-full bg-strokegray" />
                    <p className="text-12 font-normal text-strokegray">
                      Manager: {data?.managerName}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-[23px]">
                <p className="text-12 text-strokegray font-normal">
                  Total Incentive Amount
                </p>
                <p className="text-white font-medium text-13">
                  ₹ {totalIncentive.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Backdrop to close dropdown on outside click */}
        {openDropdownIdx !== null && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpenDropdownIdx(null)}
          />
        )}

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-24 py-20">
          {products.map((product, idx) => {
            const cardErrors = fieldErrors[idx];
            const hasNameError = !!cardErrors?.subCategoryName;
            const options = getAvailableOptions(idx);

            return (
              <div
                key={idx}
                className="border border-strokegray rounded-8 mb-16 overflow-visible relative"
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-16 py-12 cursor-pointer"
                  onClick={() => toggleCard(idx)}
                >
                  {/* Sub-category dropdown trigger */}
                  <div
                    className="flex items-center gap-6 relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownIdx(openDropdownIdx === idx ? null : idx);
                    }}
                  >
                    <p
                      className={`text-14 font-medium ${
                        hasNameError
                          ? "text-danger"
                          : product.subCategoryName
                            ? "text-darkgray"
                            : "text-gray"
                      }`}
                    >
                      {product.subCategoryName || "Choose Sub Category"}
                    </p>
                    <IconRenderer
                      icon="MdKeyboardArrowDown"
                      size={20}
                      className={`text-gray transition-transform duration-200 ${
                        openDropdownIdx === idx ? "rotate-180" : ""
                      }`}
                    />

                    {/* Dropdown menu */}
                    {openDropdownIdx === idx && (
                      <div className="absolute top-full left-0 mt-4 bg-white border border-strokegray rounded-6 shadow-lg z-20 min-w-[220px]">
                        {options.length > 0 ? (
                          options.map((option) => (
                            <div
                              key={option}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSubCategoryName(idx, option);
                              }}
                              className="px-12 py-10 text-13 text-darkgray hover:bg-[#F5F7FF] cursor-pointer first:rounded-t-6 last:rounded-b-6"
                            >
                              {option}
                            </div>
                          ))
                        ) : (
                          <div className="px-12 py-10 text-13 text-gray">
                            No options available
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProduct(idx);
                    }}
                    className="text-[#EF4444] hover:text-[#DC2626] transition-colors"
                    aria-label="Delete sub category"
                  >
                    <IconRenderer icon="FiTrash2" size={16} />
                  </button>
                </div>

                {/* Name validation error */}
                {hasNameError && expandedCards.has(idx) && (
                  <div className="px-16 -mt-4 mb-4">
                    <p className="text-11 text-danger">
                      {cardErrors.subCategoryName}
                    </p>
                  </div>
                )}

                {/* Card body */}
                {expandedCards.has(idx) && (
                  <div className="px-16 pb-16">
                    <div className="grid grid-cols-3 gap-16">
                      <FieldInput
                        label="SalesTarget (nos)"
                        value={product.salesTarget}
                        onChange={(v) => updateProduct(idx, "salesTarget", v)}
                        error={cardErrors?.salesTarget}
                      />
                      <FieldInput
                        label="Incentive (₹)"
                        value={product.incentive}
                        onChange={(v) => updateProduct(idx, "incentive", v)}
                        error={cardErrors?.incentive}
                      />
                      <FieldInput
                        label="Incentive Eligibility (%)"
                        value={product.incentiveEligibility}
                        onChange={(v) =>
                          updateProduct(idx, "incentiveEligibility", v)
                        }
                        error={cardErrors?.incentiveEligibility}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add sub-category link */}
          <div className="flex justify-end mt-4">
            <button
              onClick={addSubCategory}
              className="flex items-center gap-[5px] text-13 font-medium text-secondary"
            >
              <IconRenderer icon="AiOutlinePlus" color="#5C67FD" size={16} />
              Add Sub Category
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-12 px-24 py-12 border-t border-strokegray shrink-0 bg-white">
          <CustomButton
            title="Cancel"
            backgroundColor="bg-white"
            textColor="text-darkgray"
            borderColor="border-strokegray"
            borderWidth="border-1"
            gap="gap-[5px]"
            height="h-[36px]"
            onClick={onClose}
            icon={
              <IconRenderer
                icon="FaRegTimesCircle"
                size={14}
                className="text-litegray"
              />
            }
            iconPosition="left"
          />
          <CustomButton
            title="Save"
            backgroundColor="bg-primary"
            textColor="text-white"
            gap="gap-[5px]"
            height="h-[36px]"
            borderRadius="rounded-6"
            icon={
              <IconRenderer
                icon="FiCheckCircle"
                size={14}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={handleSave}
          />
        </div>
      </div>
    </CustomModal>
  );
}

/* ---- Field input ---- */

interface FieldInputProps {
  label: string;
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  error?: string;
}

function FieldInput({
  label,
  value,
  onChange,
  readOnly,
  error,
}: FieldInputProps) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-12 font-medium text-darkgray">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value) || 0)}
        readOnly={readOnly}
        className={`h-[40px] rounded-6 border px-12 text-14 text-darkgray outline-none bg-[#F7F8FC] ${
          error ? "border-danger" : "border-strokegray"
        } ${readOnly ? "cursor-default opacity-60" : "focus:border-primary"}`}
      />
      {error && <p className="text-11 text-danger mt-1">{error}</p>}
    </div>
  );
}
