import { useEffect, useMemo, useState } from "react";
import CustomModal from "../../../../../shared/components/ui/Modal/CustomModal";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDropdown from "../../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomDatePicker from "../../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import type { IncentiveRateCategory } from "../../../config/IncentiveRatesConfig";

export interface AddIncentiveRateValues {
  category: string;
  subCategory: string;
  eligibleIncentive: number;
  effectiveDate: Date;
}

interface AddIncentiveRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddIncentiveRateValues) => void;
  categories: IncentiveRateCategory[];
}

const TOMORROW = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
})();

export default function AddIncentiveRateModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
}: AddIncentiveRateModalProps) {
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCategory("");
    setSubCategory("");
    setAmount("");
    setEffectiveDate(null);
  }, [isOpen]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.category, value: c.category })),
    [categories],
  );

  const subCategoryOptions = useMemo(() => {
    const cat = categories.find((c) => c.category === category);
    return (cat?.items ?? []).map((i) => ({
      label: i.subCategory,
      value: i.subCategory,
    }));
  }, [categories, category]);

  function handleSubmit() {
    const value = Number(amount);
    if (!category || !subCategory || !amount || isNaN(value) || !effectiveDate)
      return;
    onSubmit({
      category,
      subCategory,
      eligibleIncentive: value,
      effectiveDate,
    });
  }

  return (
    <CustomModal isOpen={isOpen}>
      <div className="w-[500px] max-w-[92vw] bg-white h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mx-24 py-20">
          <p className="text-16 font-medium text-darkgray">
            Add Incentive Rate
          </p>
          <IconRenderer
            icon="IoMdClose"
            size={20}
            className="text-gray cursor-pointer shrink-0"
            onClick={onClose}
          />
        </div>
        <div className="border-t border-strokegray shrink-0 mx-24" />

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-24 py-20 flex flex-col gap-24">
          <div className="flex flex-col gap-8">
            <label className="text-13 font-normal text-darkgray">
              Category
            </label>
            <CustomDropdown
              placeholder="Choose..."
              options={categoryOptions}
              value={category}
              borderRadius="rounded-6"
              onChange={(v) => {
                setCategory(v);
                setSubCategory("");
              }}
            />
          </div>

          <div className="flex flex-col gap-8">
            <label className="text-13 font-normal text-darkgray">
              Sub Category
            </label>
            <CustomDropdown
              placeholder="Choose..."
              options={subCategoryOptions}
              value={subCategory}
              borderRadius="rounded-6"
              onChange={setSubCategory}
            />
          </div>

          <div className="flex flex-col gap-8">
            <label className="text-13 font-normal text-darkgray">
              Eligible Incentive Amount (₹)/Per Product
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              placeholder="00"
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-[37px] px-10 text-13 text-darkgray bg-white border-1 border-strokegray rounded-6 outline-none placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-8">
            <label className="text-13 font-normal text-darkgray">
              Effective Date
            </label>
            <CustomDatePicker
              placeholder="DD/MM/YYYY"
              value={effectiveDate}
              onChange={setEffectiveDate}
              minDate={TOMORROW}
              height="h-[37px]"
              borderColor="border-strokegray"
              borderRadious="rounded-6"
              icon="LuCalendar"
              iconSize={16}
              textColor="text-darkgray"
              placeholderColor="placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-14 px-24 py-12 border-t border-strokegray shrink-0 bg-white">
          <CustomButton
            title="Cancel"
            backgroundColor="bg-strokegray"
            textColor="text-gray"
            height="h-[34px]"
            width="w-[90px]"
            gap="gap-[6px]"
            borderRadius="rounded-6"
            icon={
              <IconRenderer
                icon="FaRegTimesCircle"
                size={14}
                className="text-gray"
              />
            }
            iconPosition="left"
            onClick={onClose}
          />
          <CustomButton
            title="Add Incentive Rate"
            backgroundColor="bg-primary"
            textColor="text-white"
            height="h-[34px]"
            padding="px-20"
            gap="gap-[6px]"
            borderRadius="rounded-6"
            icon={
              <IconRenderer
                icon="LuCircleCheckBig"
                size={14}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </CustomModal>
  );
}
