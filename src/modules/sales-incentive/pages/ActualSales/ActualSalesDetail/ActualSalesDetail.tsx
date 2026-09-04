import CustomAvatar from "../../../../../shared/components/ui/Avatar/Avatar";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomModal from "../../../../../shared/components/ui/Modal/CustomModal";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import { ACTUAL_SALES_DETAIL_COLUMNS } from "../../../config/ActualSalesBulkUpload";
import type { ActualSalesEmployeeDetail } from "../../../types/salesIncentive.types";

interface ActualSalesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: ActualSalesEmployeeDetail | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ActualSalesDetailModal({
  isOpen,
  onClose,
  detail,
}: ActualSalesDetailModalProps) {
  return (
    <CustomModal isOpen={isOpen}>
      <div className="w-[850px] bg-white h-full flex flex-col">
        {/* Header — unchanged design, driven by real data */}
        <div className="bg-primary h-[140px] rounded-br-[20px] rounded-bl-[20px] px-[25px] shrink-0">
          <div className="flex justify-between py-10 border-b border-gray">
            <p className="text-white text-heading-6">
              Actual Sales Details{detail ? ` - ${detail.month}` : ""}
            </p>
            <IconRenderer
              icon="IoMdClose"
              color="#A8A8AD"
              size={20}
              onClick={onClose}
              className="cursor-pointer"
            />
          </div>
          {detail && (
            <div className="flex items-center mt-[23px] gap-x-14">
              <CustomAvatar
                backgroundColor="bg-[#FFFFFF2E]"
                height="h-[42px]"
                width="w-[42px]"
                title={initials(detail.employeeName)}
                borderWidth="border-1"
              />
              <div className="gap-[5px] flex flex-col">
                <div className="flex items-center gap-[5px]">
                  <p className="text-white font-semibold text-16">
                    {detail.employeeName}
                  </p>
                  <p className="text-white font-normal text-12">
                    ({detail.employeeCode})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {detail.role && (
                    <>
                      <p className="text-12 font-normal text-strokegray">
                        {detail.role}
                      </p>
                      <div className="w-4 h-4 rounded-full bg-strokegray" />
                    </>
                  )}
                  <p className="text-12 font-normal text-strokegray">
                    {detail.company} - {detail.location}
                  </p>
                  <div className="w-4 h-4 rounded-full bg-strokegray" />
                  <p className="text-12 font-normal text-strokegray">
                    Manager: {detail.managerName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 px-[25px] py-20">
          {!detail ? (
            <p className="text-13 text-gray text-center py-40">
              No details available.
            </p>
          ) : (
            <GroupedIncentiveTable
              columns={ACTUAL_SALES_DETAIL_COLUMNS}
              data={detail.groups ?? []}
              emptyMessage="No records found."
              showVerticalLines={true}
            />
          )}
        </div>
      </div>
    </CustomModal>
  );
}
