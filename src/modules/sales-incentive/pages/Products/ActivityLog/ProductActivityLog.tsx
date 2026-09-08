import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomModal from "../../../../../shared/components/ui/Modal/CustomModal";
import type { ProductActivityLogEntry } from "../../../types/salesIncentive.types";

interface ProductActivityLogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  entries: ProductActivityLogEntry[];
}

export default function ProductActivityLog({
  isOpen,
  onClose,
  title,
  subtitle,
  entries,
}: ProductActivityLogProps) {
  return (
    <CustomModal isOpen={isOpen}>
      <div className="w-[500px] max-w-[92vw] bg-white h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mx-24 py-20">
          <div className="pr-10 min-w-0">
            <p className="text-16 font-medium text-darkgray truncate">
              Activity Log – {title}
            </p>
            {subtitle && <p className="text-13 text-gray mt-2">({subtitle})</p>}
          </div>
          <IconRenderer
            icon="IoMdClose"
            size={20}
            className="text-gray cursor-pointer shrink-0"
            onClick={onClose}
          />
        </div>
        <div className="border-t border-strokegray shrink-0 mx-24" />

        {/* Timeline */}
        <div className="flex-1 min-h-0 overflow-y-auto px-24 py-20">
          {entries.length === 0 ? (
            <p className="text-13 text-gray text-center py-40">
              No activity recorded yet.
            </p>
          ) : (
            entries.map((entry, index) => {
              const isLast = index === entries.length - 1;
              return (
                <div
                  key={`${entry.date}-${entry.time}-${index}`}
                  className={`relative pl-[30px] ${isLast ? "" : "pb-20"}`}
                >
                  <div
                    className={`absolute left-0 ${index == 0 ? "top-[10px]" : "top-[67px]"} w-[12px] h-[12px] rounded-full bg-[#B9B7C6] flex items-center justify-center`}
                  >
                    <div className="w-[5px] h-[5px] rounded-full bg-primary" />
                  </div>
                  {!isLast && (
                    <div
                      className={`absolute flex left-[5.2px] ${index == 0 ? "top-[28px]" : "top-[85px]"} bottom-[-20px] ${index == 0 ? "h-[195px]" : "h-[136px]"}  w-[1.6px] bg-[#B9B7C6]`}
                    />
                  )}

                  {/* Entry card */}
                  <div className="border border-strokegray rounded-6 py-12">
                    <p className="text-12 text-darkgray flex items-center gap-[6px] mx-16">
                      <span className="font-medium text-14">{entry.date}</span>
                      <span className="w-[4px] h-[4px] rounded-full bg-litegray inline-block" />
                      <span className="text-gray">{entry.time}</span>
                    </p>
                    <p className="text-13 text-gray mt-4 mx-16">
                      {entry.updatedBy}
                    </p>
                    <div className="h-[0.3px] bg-strokegray my-14" />
                    <div className="grid grid-cols-3 gap-10 mx-16">
                      {entry.fields.map((field) => (
                        <div key={field.label}>
                          <p className="text-12 text-gray">{field.label}</p>
                          <p className="text-13 font-medium text-darkgray mt-4">
                            {field.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </CustomModal>
  );
}
