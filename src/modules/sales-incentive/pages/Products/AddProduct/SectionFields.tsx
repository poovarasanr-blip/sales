import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import type { AddProductSectionConfig } from "../../../types/salesIncentive.types";
import CategoryIcon from "../../../../../assets/icons/AddProduct/Category.svg";

interface SectionFieldsProps {
  section: AddProductSectionConfig;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  appliedValue?: string;
}

export default function SectionFields({
  section,
  values,
  onChange,
  appliedValue,
}: SectionFieldsProps) {
  return (
    <div className="border border-strokegray rounded-6 bg-white shadow-card-xl">
      {/* Header */}
      <div className="flex items-center gap-[10px] px-[20px] py-[14px] border-b border-strokegray">
        <div className="w-[29px] h-[29px] rounded-full bg-[#DFE7FF] flex items-center justify-center">
          <IconRenderer imageUrl={CategoryIcon} />
        </div>
        <div>
          <p className="text-14 font-semibold text-darkgray">{section.label}</p>
          <p className="text-12 text-gray">
            Applies to &ldquo;{appliedValue || "--"}&rdquo;
          </p>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-4 gap-[16px] px-[20px] py-[16px]">
        {section.fields.map((field) => (
          <div key={field.key}>
            <label className="text-12 font-medium text-darkgray mb-[6px] block">
              {field.label}
            </label>
            {field.type === "select" ? (
              <div className="relative">
                <select
                  value={values[field.key] ?? ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full h-[40px] pl-[12px] pr-[36px] border border-[#E5E7EB] rounded-[6px] bg-white text-13 text-darkgray cursor-pointer outline-none appearance-none"
                >
                  <option value="">{field.placeholder}</option>

                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {/* Custom dropdown icon */}
                <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconRenderer
                    icon="MdKeyboardArrowDown"
                    size={20}
                    className="text-[#6B7280]"
                  />
                </div>
              </div>
            ) : (
              <input
                type={field.type}
                value={values[field.key] ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full h-[40px] px-[12px] border border-[#E5E7EB] rounded-[8px] bg-white text-13 text-darkgray outline-none placeholder:text-[#9CA3AF]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
