import { useMemo, useState } from "react";
import CustomModal from "../../../../shared/components/ui/Modal/CustomModal";
import CustomAvatar from "../../../../shared/components/ui/Avatar/Avatar";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import CustomButton from "../../../../shared/components/ui/Button/CustomButton";
import CustomDropdown from "../../../../shared/components/forms/FormSelect/CustomDropdown";
import LoaderModal from "../../../../shared/components/ui/LoaderModal/LoaderModal";
import { showToast } from "../../../../shared/components/ui/CustomToast/UseToast";
import { useAuthStore } from "../../../../app/store/useAuthStore";

interface ProductDetail {
  source: Record<string, unknown>;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  salesTarget: number;
  incentive: number;
  status: number;
  isNew: boolean;
}

type ApiRecord = Record<string, unknown>;

function mapApiRecord(record: ApiRecord): ProductDetail {
  return {
    source: { ...record },
    categoryId: String(record.IncentiveProductCategoryId ?? ""),
    categoryName: String(record.IncentiveProductCategory ?? ""),
    subCategoryId: String(record.IncentiveProductSubCategoryId ?? ""),
    subCategoryName: String(record.IncentiveProductSubCategory ?? ""),
    salesTarget: Number(record.BaseTargetQuantity) || 0,
    incentive: Number(record.Incentive) || 0,
    status: Number(record.Status ?? 1),
    isNew: false,
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type FieldErrors = Record<
  number,
  Partial<
    Record<
      "categoryId" | "subCategoryName" | "salesTarget" | "incentive",
      string
    >
  >
>;

interface EmployeeSalesTargetUpdateModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  detailsData?: ApiRecord[];
  onClose: () => void;
  onSave: (records: ApiRecord[]) => void;
}

export default function EmployeeSalesTargetUpdateModal({
  detailsData,
  isOpen,
  isSubmitting,
  onClose,
  onSave,
}: EmployeeSalesTargetUpdateModalProps) {
  const records = detailsData ?? [];
  const categories = useAuthStore((state) => state.IncentiveProductCategories);
  const subCategories = useAuthStore(
    (state) => state.IncentiveProductSubCategories,
  );
  const [products, setProducts] = useState<ProductDetail[]>(() =>
    records.map(mapApiRecord),
  );
  const [expandedCards, setExpandedCards] = useState<Set<number>>(
    () => new Set(records.map((_, i) => i)),
  );
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const employee = records[0] ?? {};
  const employeeName = String(employee.EmployeeName ?? "");
  const employeeCode = String(employee.EmployeeCode ?? "");
  const employeeId = String(employee.EmployeeId ?? "");
  const dealerName = String(employee.DealerName ?? "");
  const managerName = String(employee.ManagerName ?? "");
  const managerCode = String(employee.ManagerCode ?? "");

  const categoryOptions = useMemo(
    () =>
      categories.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const record = item as ApiRecord;
        if (record.Id === null || record.Id === undefined) return [];
        return [{ label: String(record.Name ?? ""), value: String(record.Id) }];
      }),
    [categories],
  );

  const totalIncentive = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          product.status === 0 ? sum : sum + product.incentive,
        0,
      ),
    [products],
  );

  function getAvailableOptions(currentIdx: number) {
    const categoryId = products[currentIdx]?.categoryId;
    if (!categoryId) return [];
    const usedIds = products
      .filter(
        (product, index) =>
          index !== currentIdx &&
          product.categoryId === categoryId &&
          product.status !== 0,
      )
      .map((product) => product.subCategoryId);
    return subCategories.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as ApiRecord;
      const id = String(record.Id ?? "");
      const name = String(record.Name ?? "");
      if (
        !id ||
        !name ||
        String(record.IncentiveProductCategoryId ?? "") !== categoryId ||
        usedIds.includes(id)
      ) {
        return [];
      }
      return [{ id, name }];
    });
  }

  function toggleCard(idx: number) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function removeProduct(idx: number) {
    if (!products[idx]?.isNew) {
      setProducts((prev) =>
        prev.map((product, index) =>
          index === idx
            ? {
                ...product,
                status: 0,
                source: { ...product.source, Status: 0 },
              }
            : product,
        ),
      );
      return;
    }

    setProducts((prev) => prev.filter((_, index) => index !== idx));
    setExpandedCards((prev) => {
      const next = new Set<number>();
      prev.forEach((value) => {
        if (value < idx) next.add(value);
        else if (value > idx) next.add(value - 1);
      });
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return Object.fromEntries(
        Object.entries(next).map(([key, value]) => [
          Number(key) > idx ? Number(key) - 1 : Number(key),
          value,
        ]),
      );
    });
    if (openDropdownIdx === idx) setOpenDropdownIdx(null);
    else if (openDropdownIdx !== null && openDropdownIdx > idx)
      setOpenDropdownIdx(openDropdownIdx - 1);
  }

  function updateProduct(
    idx: number,
    field: "salesTarget" | "incentive",
    value: number,
  ) {
    setProducts((prev) =>
      prev.map((product, index) =>
        index === idx
          ? {
              ...product,
              [field]: value,
              source: {
                ...product.source,
                [field === "salesTarget" ? "BaseTargetQuantity" : "Incentive"]:
                  value,
              },
            }
          : product,
      ),
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

  function updateCategory(idx: number, categoryId: string) {
    const selectedCategory = categoryOptions.find(
      (option) => option.value === categoryId,
    );
    setProducts((prev) =>
      prev.map((product, index) =>
        index === idx
          ? {
              ...product,
              categoryId,
              categoryName: selectedCategory?.label ?? "",
              subCategoryId: "",
              subCategoryName: "",
              source: {
                ...product.source,
                IncentiveProductCategoryId: Number(categoryId),
                IncentiveProductCategory: selectedCategory?.label ?? "",
                IncentiveProductSubCategoryId: 0,
                IncentiveProductSubCategory: "",
              },
            }
          : product,
      ),
    );
    setOpenDropdownIdx(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (next[idx]) {
        delete next[idx].categoryId;
        delete next[idx].subCategoryName;
        if (Object.keys(next[idx]).length === 0) delete next[idx];
      }
      return next;
    });
  }

  function updateSubCategoryName(idx: number, subCategoryId: string) {
    const selectedSubCategory = subCategories.find(
      (item) =>
        item &&
        typeof item === "object" &&
        String((item as ApiRecord).Id ?? "") === subCategoryId,
    ) as ApiRecord | undefined;
    const name = String(selectedSubCategory?.Name ?? "");
    const draft = products[idx];
    const existingIdx = products.findIndex(
      (product, index) =>
        index !== idx &&
        !product.isNew &&
        product.status === 0 &&
        product.categoryId === draft?.categoryId &&
        product.subCategoryId === subCategoryId,
    );

    if (draft?.isNew && existingIdx !== -1) {
      setProducts((prev) =>
        prev.map((product, index) =>
          index === existingIdx
            ? {
                ...product,
                salesTarget: draft.salesTarget,
                incentive: draft.incentive,
                status: 1,
                source: {
                  ...product.source,
                  BaseTargetQuantity: draft.salesTarget,
                  IncentiveAgainstBaseTargetQuantity: draft.salesTarget,
                  Incentive: draft.incentive,
                  Status: 1,
                },
              }
            : product,
        ),
      );
      setOpenDropdownIdx(null);
      removeProduct(idx);
      return;
    }

    setProducts((prev) =>
      prev.map((product, index) =>
        index === idx
          ? {
              ...product,
              subCategoryId,
              subCategoryName: name,
              source: {
                ...product.source,
                IncentiveProductSubCategoryId: Number(subCategoryId),
                IncentiveProductSubCategory: name,
              },
            }
          : product,
      ),
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
    const incompleteDraft = products.some(
      (product) =>
        product.status !== 0 && (!product.categoryId || !product.subCategoryId),
    );
    if (incompleteDraft) {
      showToast({
        type: "error",
        title: "Selection Required",
        message:
          "Select a Category and Sub Category before adding another item.",
        duration: 3000,
      });
      return;
    }

    const matchingDraft = products.find(
      (product) =>
        product.isNew &&
        products.some(
          (existing) =>
            !existing.isNew &&
            existing.status === 0 &&
            existing.categoryId === product.categoryId &&
            existing.subCategoryId === product.subCategoryId,
        ),
    );
    if (matchingDraft) {
      const draftIdx = products.indexOf(matchingDraft);
      const existingIdx = products.findIndex(
        (product) =>
          !product.isNew &&
          product.status === 0 &&
          product.categoryId === matchingDraft.categoryId &&
          product.subCategoryId === matchingDraft.subCategoryId,
      );
      setProducts((prev) =>
        prev.map((product, index) =>
          index === existingIdx
            ? {
                ...product,
                salesTarget: matchingDraft.salesTarget,
                incentive: matchingDraft.incentive,
                status: 1,
                source: {
                  ...product.source,
                  BaseTargetQuantity: matchingDraft.salesTarget,
                  IncentiveAgainstBaseTargetQuantity: matchingDraft.salesTarget,
                  Incentive: matchingDraft.incentive,
                  Status: 1,
                },
              }
            : product,
        ),
      );
      removeProduct(draftIdx);
      return;
    }

    const newIdx = products.length;
    const source = records[0] ?? {};
    setProducts((prev) => [
      ...prev,
      {
        source: {
          ...source,
          Id: 0,
          ClientLocalId: `target-${Date.now()}-${newIdx}`,
          IncentiveProductCategoryId: 0,
          IncentiveProductSubCategoryId: 0,
          BaseTargetQuantity: 0,
          Incentive: 0,
          Status: 1,
        },
        categoryId: "",
        categoryName: "",
        subCategoryId: "",
        subCategoryName: "",
        salesTarget: 0,
        incentive: 0,
        actualQuantity: 0,
        incentiveEligibility: "",
        status: 1,
        isNew: true,
      },
    ]);
    setExpandedCards((prev) => new Set([...prev, newIdx]));
  }

  // function handleSave() {
  //   const errors: FieldErrors = {};
  //   let hasErrors = false;

  //   products.forEach((p, idx) => {
  //     if (p.status === 0) return;
  //     const errs: Record<string, string> = {};
  //     if (!p.categoryId) {
  //       errs.categoryId = "Category is required";
  //       hasErrors = true;
  //     }
  //     if (!p.subCategoryName) {
  //       errs.subCategoryName = "Sub Category is required";
  //       hasErrors = true;
  //     }
  //     if (!p.subCategoryId) {
  //       errs.subCategoryName = "Sub Category is required";
  //       hasErrors = true;
  //     }
  //     if (!p.salesTarget || p.salesTarget <= 0) {
  //       errs.salesTarget = "Sales Target is required";
  //       hasErrors = true;
  //     }
  //     if (p.incentive < 0 || isNaN(p.incentive)) {
  //       errs.incentive = "Incentive must be a valid value";
  //       hasErrors = true;
  //     }
  //     const eligibilityMissing =
  //       typeof p.incentiveEligibility === "number"
  //         ? p.incentiveEligibility <= 0
  //         : !p.incentiveEligibility.trim();
  //     if (eligibilityMissing) {
  //       errs.incentiveEligibility = "Incentive Eligibility is required";
  //       hasErrors = true;
  //     }
  //     if (Object.keys(errs).length > 0) {
  //       errors[idx] = errs;
  //     }
  //   });

  //   setFieldErrors(errors);

  //   if (hasErrors) {
  //     setExpandedCards((prev) => {
  //       const next = new Set(prev);
  //       Object.keys(errors).forEach((k) => next.add(Number(k)));
  //       return next;
  //     });
  //     showToast({
  //       type: "error",
  //       title: "Validation Error",
  //       message: "Please fix the highlighted fields before saving.",
  //       duration: 3000,
  //     });
  //     return;
  //   }

  //   showToast({
  //     type: "success",
  //     title: "Validated",
  //     message: "Employee sales targets updated successfully.",
  //     duration: 3000,
  //   });
  //   onSave(
  //     products.map((product) => ({
  //       ...product.source,
  //       IncentiveProductCategoryId: Number(product.categoryId) || 0,
  //       IncentiveProductCategory: product.categoryName,
  //       IncentiveProductSubCategoryId: Number(product.subCategoryId) || 0,
  //       IncentiveProductSubCategory: product.subCategoryName,
  //       BaseTargetQuantity: product.salesTarget,
  //       Incentive: product.incentive,
  //       Status: product.status,
  //     })),
  //   );
  //   onClose();
  // }
  function handleSave() {
    const errors: FieldErrors = {};
    let hasErrors = false;

    products.forEach((p, idx) => {
      if (p.status === 0) return;
      const errs: Record<string, string> = {};
      if (!p.categoryId) {
        errs.categoryId = "Category is required";
        hasErrors = true;
      }
      if (!p.subCategoryId) {
        errs.subCategoryName = "Sub Category is required";
        hasErrors = true;
      }
      if (!p.salesTarget || p.salesTarget <= 0) {
        errs.salesTarget = "Sales Target is required";
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
        Object.keys(errors).forEach((key) => {
          next.add(Number(key));
        });
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
    const monthToNumber = (value: unknown) => {
      if (typeof value === "number")
        return value >= 1 && value <= 12 ? value : 0;
      const month = String(value ?? "")
        .trim()
        .toLowerCase();
      const numericMonth = Number(month);
      if (numericMonth >= 1 && numericMonth <= 12) return numericMonth;
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];
      return months.indexOf(month) + 1;
    };
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const finalData = products.map((product) => {
      if (product.isNew) {
        const newProduct = product as ProductDetail & {
          incentiveProduct?: string;
          incentiveAmount?: number;
        };
        return {
          EmployeeCode: employeeCode,
          EmployeeName: employeeName,
          SalesIncentiveConfigurationCode: "",
          IncentiveSubCategory: product.subCategoryName ?? "",
          IncentiveProduct: newProduct.incentiveProduct ?? "",
          Month: currentMonth,
          Year: currentYear,
          IncentiveAgainstBaseTargetQuantity: product.salesTarget,
          Incentive: product.incentive ?? newProduct.incentiveAmount,
          IncentiveApplicableEligibilityPercentage: "",
          IncentiveProductSubCategoryId: Number(product.subCategoryId),
          CompanyId: 5,
          BaseTargetQuantity: product.salesTarget,
        };
      }

      const source = product.source;
      const record: Record<string, unknown> = { ...source };
      const available = (value: unknown) =>
        value !== undefined && value !== null && value !== "";
      const categoryId = Number(product.categoryId);
      const subCategoryId = Number(product.subCategoryId);
      const salesTarget = Number(product.salesTarget);
      const incentive = Number(product.incentive);
      const month = monthToNumber(source.Month);
      const year = Number(source.Year);

      if (available(product.categoryId) && categoryId > 0) {
        record.IncentiveProductCategoryId = categoryId;
      }
      if (available(product.categoryName)) {
        record.IncentiveProductCategory = product.categoryName;
      }
      if (available(product.subCategoryId) && subCategoryId > 0) {
        record.IncentiveProductSubCategoryId = subCategoryId;
      }
      if (available(product.subCategoryName)) {
        record.IncentiveProductSubCategory = product.subCategoryName;
      }
      if (Number.isFinite(salesTarget) && salesTarget > 0) {
        record.BaseTargetQuantity = salesTarget;
        record.IncentiveAgainstBaseTargetQuantity = salesTarget;
      }
      if (Number.isFinite(incentive)) record.Incentive = incentive;
      if (month > 0) record.Month = month;
      if (Number.isFinite(year) && year > 0) record.Year = year;
      if (!available(source.CompanyId)) record.CompanyId = 5;
      record.Status = product.status;

      return record;
    });
    onSave(finalData);
    // showToast({
    //   type: "success",
    //   title: "Validated",
    //   message: "Employee sales targets updated successfully.",
    //   duration: 3000,
    // });
    // onSave(
    //   products.map((product) => ({
    //     ...product.source,
    //     IncentiveProductCategoryId: Number(product.categoryId) || 0,
    //     IncentiveProductCategory: product.categoryName,
    //     IncentiveProductSubCategoryId: Number(product.subCategoryId) || 0,
    //     IncentiveProductSubCategory: product.subCategoryName,
    //     BaseTargetQuantity: product.salesTarget,
    //     Incentive: product.incentive,
    //     Status: product.status,
    //   })),
    // );

    // onClose();
  }
  return (
    <CustomModal isOpen={isOpen}>
      <div className="w-[800px] bg-white h-full flex flex-col">
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
          {records.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center mt-[23px] gap-x-14">
                <CustomAvatar
                  backgroundColor="bg-[#FFFFFF2E]"
                  height="h-[42px]"
                  width="w-[42px]"
                  title={initials(employeeName)}
                  borderWidth="border-1"
                />
                <div className="gap-[5px] flex flex-col">
                  <div className="flex items-center gap-[5px]">
                    <p className="text-white font-semibold text-16">
                      {employeeName}
                    </p>
                    <p className="text-strokegray font-normal text-12">
                      ({employeeCode}
                      {employeeId ? ` • ID ${employeeId}` : ""})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-12 font-normal text-strokegray">
                      {dealerName}
                    </p>
                    <div className="w-4 h-4 rounded-full bg-strokegray" />
                    <p className="text-12 font-normal text-strokegray">
                      Manager: {managerName}
                      {managerCode ? ` (${managerCode})` : ""}
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
          {products
            .map((product, idx) => ({ product, idx }))
            .filter(({ product }) => product.status !== 0)
            .map(({ product, idx }) => {
              const cardErrors = fieldErrors[idx];
              const hasNameError = !!cardErrors?.subCategoryName;
              const options = getAvailableOptions(idx);

              return (
                <div
                  key={idx}
                  className="border border-strokegray rounded-8 mb-16 overflow-visible relative flex justify-between"
                >
                  {/* Card body */}
                  <div className="px-14 py-16 flex justify-between w-[96%] ">
                    <div className="w-[218px]">
                      <CustomDropdown
                        label="Category"
                        options={categoryOptions}
                        value={product.categoryId}
                        onChange={(value) => updateCategory(idx, value)}
                        disabled={product.status === 0}
                        borderColor={
                          cardErrors?.categoryId
                            ? "border-danger"
                            : "border-strokegray"
                        }
                        borderRadius="rounded-4"
                        borderWidth="border-1"
                        titleTextColor="text-darkgray"
                      />
                    </div>
                    {/* Sub-category dropdown trigger */}
                    <div className="gap-[5px] flex flex-col">
                      <p className="text-xs font-normal text-darkgray">
                        Sub Category
                      </p>
                      <div
                        className={`flex items-center gap-6 relative h-[37px] border rounded-[4px] w-[218px] justify-between px-[6px] pl-[7px] ${
                          hasNameError ? "border-danger" : "border-strokegray"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!product.categoryId) return;
                          setOpenDropdownIdx(
                            openDropdownIdx === idx ? null : idx,
                          );
                        }}
                      >
                        <p
                          className={`text-13 font-normal ${
                            hasNameError
                              ? "text-danger"
                              : product.subCategoryName
                                ? "text-darkgray"
                                : "text-litegray"
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
                        {product.categoryId && openDropdownIdx === idx && (
                          <div className="absolute top-full left-0 mt-4 bg-white border border-strokegray rounded-6 shadow-lg z-20 min-w-[220px]">
                            {options.length > 0 ? (
                              options.map((option) => (
                                <div
                                  key={option.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSubCategoryName(idx, option.id);
                                  }}
                                  className="px-12 py-10 text-13 text-darkgray hover:bg-[#F5F7FF] cursor-pointer first:rounded-t-6 last:rounded-b-6"
                                >
                                  {option.name}
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
                    </div>
                    <div className="w-[106px]">
                      <FieldInput
                        label="SalesTarget (nos)"
                        value={product.salesTarget}
                        onChange={(v) => updateProduct(idx, "salesTarget", v)}
                        error={cardErrors?.salesTarget}
                      />
                    </div>
                    <div className="w-[106px]">
                      <FieldInput
                        label="Incentive (₹)"
                        value={product.incentive}
                        onChange={(v) => updateProduct(idx, "incentive", v)}
                        error={cardErrors?.incentive}
                      />
                    </div>
                  </div>
                  <div className="border-l w-[36px] border-strokegray items-center justify-center flex">
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
              Add Category
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
            disabled={isSubmitting}
            onClick={handleSave}
          />
        </div>
      </div>
      <LoaderModal
        isOpen={isSubmitting}
        message="Saving employee sales targets..."
      />
    </CustomModal>
  );
}

/* ---- Field input ---- */

interface FieldInputProps {
  label: string;
  value: number | string;
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
    <div className="flex flex-col gap-[4px]">
      <label className="text-12 font-normal text-darkgray">{label}</label>
      <input
        type={readOnly && typeof value === "string" ? "text" : "number"}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value) || 0)}
        readOnly={readOnly}
        className={`h-[37px] rounded-4 border px-12 text-14 text-darkgray outline-none bg-white ${
          error ? "border-danger" : "border-strokegray"
        } ${readOnly ? "cursor-default opacity-60" : "focus:border-primary"}`}
      />
    </div>
  );
}
