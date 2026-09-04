import { useState } from "react";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import InfoIcon from "../../../../../assets/icons/Sales/ApproveAllertInfoIcon.svg";

interface SalesConfirmModalProps {
  isOpen: boolean;
  type: "approve" | "reject";
  employeeName: string;
  month: string;
  onConfirm: (remarks: string) => void;
  onCancel: () => void;
}

export default function SalesConfirmModal({
  isOpen,
  type,
  employeeName,
  month,
  onConfirm,
  onCancel,
}: SalesConfirmModalProps) {
  const [remarks, setRemarks] = useState("");

  if (!isOpen) return null;

  const isApprove = type === "approve";
  const actionLabel = isApprove ? "Approve" : "Reject";
  const remarksPlaceholder = isApprove
    ? "Approval Remarks"
    : "Rejection Remarks";

  const handleConfirm = () => {
    onConfirm(remarks);
    setRemarks("");
  };

  const handleCancel = () => {
    setRemarks("");
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: "#1018288C" }}
    >
      <div className="bg-white rounded-10 w-[420px] max-w-[420px] h-[364px] shadow-card-xl py-[15px]">
        <div className="justify-end flex px-[10px]">
          <IconRenderer
            icon="MdOutlineClose"
            size={20}
            className="text-[#A8A8AD]"
            onClick={handleCancel}
          />
        </div>
        <div className="flex flex-col items-center px-[15px] justify-center">
          <div className="mt-[5px]">
            <IconRenderer imageUrl={InfoIcon} />
          </div>

          <p className="text-heading-6 text-darkgray my-[12px]">
            Are you sure?
          </p>
          <p className="text-13 text-gray text-center">Do you want to {type}</p>
          <p className="text-13 text-gray text-center">
            {" "}
            <span className="font-semibold text-darkgray">
              {employeeName}&apos;s
            </span>{" "}
            {month} sales
          </p>

          <textarea
            className="w-full mt-12 border border-strokegray rounded-6 p-12 text-13 text-darkgray resize-none outline-none focus:border-primary"
            rows={4}
            placeholder={remarksPlaceholder}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-center gap-12 px-30 mt-[16px]">
          <CustomButton
            title="Cancel"
            backgroundColor="bg-strokegray"
            textColor="text-gray"
            height="h-[34px]"
            width="w-[120px]"
            gap="gap-[6px]"
            icon={
              <IconRenderer
                icon="FiMinusCircle"
                size={16}
                className="text-gray"
              />
            }
            iconPosition="left"
            onClick={handleCancel}
          />
          <CustomButton
            title={actionLabel}
            backgroundColor={isApprove ? "bg-success" : "bg-danger"}
            textColor="text-white"
            height="h-[34px]"
            width="w-[120px]"
            gap="gap-[6px]"
            icon={
              <IconRenderer
                icon={isApprove ? "LuCircleCheckBig" : "FaRegTimesCircle"}
                size={14}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
}
