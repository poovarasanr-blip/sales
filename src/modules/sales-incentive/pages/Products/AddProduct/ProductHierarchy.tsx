import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import type { AddProductStep } from "../../../types/salesIncentive.types";
import ProductHierarchyIcon from "../../../../../assets/icons/AddProduct/ProductHierarchy.svg";

interface ProductHierarchyProps {
  steps: AddProductStep[];
  values: Record<string, string>;
  title: string;
  icon: string;
  productCount?: number;
  productNames?: string[];
}

export default function ProductHierarchy({
  steps,
  values,
  title,
  icon,
  productCount = 0,
  productNames = [],
}: ProductHierarchyProps) {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  function getLabel(step: AddProductStep): string {
    const val = values[step.id];
    if (!val) return "--";
    const opts =
      step.options ??
      (step.dependsOn && step.optionsByParent
        ? (step.optionsByParent[values[step.dependsOn] ?? ""] ?? [])
        : []);
    return opts.find((o) => o.value === val)?.label ?? val;
  }

  const allItems = [
    ...sorted.map((s) => ({
      num: String(s.order).padStart(2, "0"),
      label: s.label,
      value: getLabel(s),
      hasValue: !!values[s.id],
    })),
    {
      num: String(sorted.length + 1).padStart(2, "0"),
      label: "Products",
      value:
        productNames.length > 0
          ? productNames.map((n, i) => `${i + 1}. ${n}`).join("\n")
          : "--",
      hasValue: productNames.length > 0,
    },
  ];

  return (
    <div className="border border-strokegray rounded-6 bg-white shadow-card-xl">
      <div className="flex items-center gap-[10px] px-[16px] py-[14px]">
        <div className="">
          <IconRenderer imageUrl={ProductHierarchyIcon} />
        </div>
        <p className="text-14 font-medium text-darkgray">{title}</p>
      </div>

      <div className="px-[16px] py-[12px]">
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1;
          return (
            <div key={item.num} className="flex gap-[12px]">
              {/* Number + Connector */}
              <div className="flex flex-col items-center w-[28px] shrink-0">
                <span
                  className={`text-11 font-bold w-[23px] h-[18px] flex items-center justify-center rounded-[4px] shrink-0 bg-[#FFF4EA] text-[#FFA55B]`}
                >
                  {item.num}
                </span>
                {!isLast && (
                  <div className="w-[1.5px] flex-1 min-h-[35px] bg-[#E5E7EB] my-[4px] mt-[10px]" />
                )}
              </div>
              {/* Text */}
              <div className={`mt-[-20px]`}>
                <p className="text-12 text-[#59596C] leading-[22px] font-medium">
                  {item.label}
                </p>
                <p className="text-13 font-medium text-[#31314D] whitespace-pre-line">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
