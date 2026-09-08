import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomModal from "../../../../../shared/components/ui/Modal/CustomModal";
import type { ActivityLogEntry } from "../../../types/salesIncentive.types";

interface ActivityLogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName?: string;
  /** Data-driven — renders however many entries are passed in, not just two. */
  entries: ActivityLogEntry[];
}

function formatAmount(value: number): string {
  return Number(value).toLocaleString("en-IN");
}

function formatAdjustment(value: number): { text: string; colorClass: string } {
  if (value > 0)
    return { text: `+${formatAmount(value)}`, colorClass: "text-success" };
  if (value < 0)
    return {
      text: `-${formatAmount(Math.abs(value))}`,
      colorClass: "text-danger",
    };
  return { text: formatAmount(value), colorClass: "text-darkgray" };
}

export default function ActivityLog({
  isOpen,
  onClose,
  employeeName,
  entries,
}: ActivityLogProps) {
  return (
    <CustomModal isOpen={isOpen}>
      <div className="w-[500px] max-w-[92vw] bg-white h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mx-24 py-20 ">
          <p className="text-16 font-medium text-darkgray truncate pr-10">
            Activity Log{employeeName ? ` - ${employeeName}` : ""}
          </p>
          <IconRenderer
            icon="IoMdClose"
            size={20}
            className="text-gray cursor-pointer shrink-0"
            onClick={onClose}
          />
        </div>
        <div className="border-t border-strokegray shrink-0 mx-24" />

        <div className="flex-1 min-h-0 overflow-y-auto px-24 py-20">
          {entries.length === 0 ? (
            <p className="text-13 text-gray text-center py-40">
              No activity recorded yet.
            </p>
          ) : (
            entries.map((entry, index) => {
              const isLast = index === entries.length - 1;
              const baseLabel = isLast
                ? "Actual Incentive"
                : "Existing Incentive";
              const adjustment = formatAdjustment(entry.adjustment);

              return (
                <div
                  key={`${entry.date}-${entry.time}-${index}`}
                  className={`relative pl-[34px] ${isLast ? "" : "pb-20"}`}
                >
                  <div
                    className={`absolute left-0 ${index == 0 ? "top-[10px]" : "top-[92px]"} w-[12px] h-[12px] rounded-full bg-[#B9B7C6] flex items-center justify-center`}
                  >
                    <div className="w-[5px] h-[5px] rounded-full bg-primary" />
                  </div>
                  {!isLast && (
                    <div
                      className={`absolute flex left-[5.2px] ${index == 0 ? "top-[28px]" : "top-[109px]"} bottom-[-20px] ${index == 0 ? "h-[282px]" : "h-[200px]"}  w-[1.6px] bg-[#B9B7C6]`}
                    />
                  )}

                  <div className="border border-strokegray rounded-6 py-16">
                    <p className="text-12 text-darkgray flex items-center gap-[6px] mx-16">
                      <span className="font-medium text-14">{entry.date} </span>
                      <div className="w-[4px] h-[4px] rounded-full bg-litegray " />
                      <span className="text-gray"> {entry.time}</span>
                    </p>
                    <p className="text-13 text-gray mt-4 mx-16">
                      {entry.subject}{" "}
                      <span
                        className={`font-medium ${
                          entry.verbColor === "danger"
                            ? "text-danger"
                            : "text-success"
                        }`}
                      >
                        {entry.verb}
                      </span>{" "}
                      {entry.suffix}
                    </p>
                    <div className="h-[0.3px] bg-strokegray  my-14 " />
                    <div className="grid grid-cols-3 gap-10 mx-16">
                      <div>
                        <p className="text-12 text-gray">{baseLabel}(₹)</p>
                        <p className="text-13 font-medium text-gray mt-4">
                          {formatAmount(entry.existingIncentive)}
                        </p>
                      </div>
                      <div>
                        <p className="text-11 text-gray">Adjustment(₹)</p>
                        <p
                          className={`text-13 font-medium mt-4 ${adjustment.colorClass}`}
                        >
                          {adjustment.text}
                        </p>
                      </div>
                      <div>
                        <p className="text-11 text-gray">Final Incentive(₹)</p>
                        <p className="text-13 font-medium text-secondary mt-4">
                          {formatAmount(entry.finalIncentive)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-14 mx-16">
                      <p className="text-12 font-medium text-darkgray">
                        Remarks
                      </p>
                      <p className="text-13 text-gray mt-4">
                        {entry.remarks || "--"}
                      </p>
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
