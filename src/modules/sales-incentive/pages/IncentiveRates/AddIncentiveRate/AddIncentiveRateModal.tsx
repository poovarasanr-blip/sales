import { useEffect, useMemo, useState } from "react";
import CustomModal from "../../../../../shared/components/ui/Modal/CustomModal";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomDropdown from "../../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomDatePicker from "../../../../../shared/components/forms/FormDatePicker/FormDatePicker";
import { useAuthStore } from "../../../../../app/store/useAuthStore";
import { useClientSessionStore } from "../../../../../app/store/useClientSessionStore";

export interface AddIncentiveRateValues {
  Id: number;
  CompanyId: number;
  ClientId: number;
  ClientContractId: number;
  TeamId: number;
  EmployeeId: number;
  IncentiveProductId: number;
  IncentiveProductSubCategoryId: number;
  IncentiveProductCategoryId: number;
  DealerId: number;
  EligibleIncentiveAmount: number;
  EffectiveFrom: string;
  EffectiveTo: string;
  Status: number;
}

interface AddIncentiveRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddIncentiveRateValues) => void;
}

function getLookupValue(record: unknown, keys: string[]): unknown {
  if (!record || typeof record !== "object") return undefined;
  const values = record as Record<string, unknown>;
  return keys.map((key) => values[key]).find((value) => value != null);
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
}: AddIncentiveRateModalProps) {
  const categories = useAuthStore((state) => state.IncentiveProductCategories);
  const subCategories = useAuthStore(
    (state) => state.IncentiveProductSubCategories,
  );
  const clientId = useClientSessionStore((state) => state.clientId);
  const clientContractId = useClientSessionStore(
    (state) => state.clientContractId,
  );
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
    () =>
      categories.flatMap((record) => {
        return {
          label: String(record?.Name),
          value: record?.Id,
          ...record,
        };
      }),
    [categories],
  );

  const subCategoryOptions = subCategories
    ?.filter((item) => item?.IncentiveProductCategoryId == category)
    .map((item) => ({
      label: String(item?.Name),
      value: item?.Id,
      ...item,
    }));

  function handleSubmit() {
    const value = Number(amount);
    if (
      !category ||
      !subCategory ||
      !amount ||
      isNaN(value) ||
      !effectiveDate ||
      clientId === null ||
      clientContractId === null
    )
      return;
    const formattedDate = new Date(
      effectiveDate?.getTime() - effectiveDate?.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    const formateToDate = effectiveDate
      ? (() => {
          const date = new Date(effectiveDate);
          date.setFullYear(date.getFullYear() + 2);
          return date.toISOString().split("T")[0];
        })()
      : "";
    onSubmit({
      Id: 0,
      CompanyId: 5,
      ClientId: clientId,
      ClientContractId: clientContractId,
      TeamId: 0,
      EmployeeId: 0,
      IncentiveProductId: 0,
      IncentiveProductSubCategoryId: Number(subCategory),
      IncentiveProductCategoryId: Number(category),
      DealerId: 0,
      EligibleIncentiveAmount: value,
      EffectiveFrom: formattedDate,
      EffectiveTo: formateToDate,
      Status: 1,
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
