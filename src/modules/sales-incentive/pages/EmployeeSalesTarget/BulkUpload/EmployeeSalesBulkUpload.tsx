// src/modules/sales-incentive/pages/EmployeeSalesTarget/EmployeeSalesTargetBulkUpload.tsx

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { RowValidationResult } from "../../../types/salesIncentive.types";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import {
  EMPLOYEE_TARGET_TABLE_COLUMNS,
  groupEmployeeTargetRows,
} from "../../../config/EmployeeSalesTargetBulkUpload";
import type { EmployeeSalesTargetUploadRow } from "../../../types/salesIncentive.types";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";

interface BulkUploadLocationState {
  validRows: RowValidationResult<EmployeeSalesTargetUploadRow>[];
  invalidRows: RowValidationResult<EmployeeSalesTargetUploadRow>[];
}

type TabKey = "valid" | "invalid";

export default function EmployeeSalesTargetBulkUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BulkUploadLocationState | undefined;

  const validRows = state?.validRows ?? [];
  const invalidRows = state?.invalidRows ?? [];

  const [activeTab, setActiveTab] = useState<TabKey>(
    validRows.length > 0 || invalidRows.length === 0 ? "valid" : "invalid",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validGroups = useMemo(
    () => groupEmployeeTargetRows(validRows.map((r) => r.data)),
    [validRows],
  );

  const handleCancel = () => navigate("/employeeSalesTarget");

  const handleAddRecords = async () => {
    setIsSubmitting(true);
    try {
      showToast({
        type: "success",
        title: "Success!",
        message: `${validRows.length} records has been added`,
        duration: 3000,
      });
      navigate("/employeeSales", {
        state: {
          bulkUploadSuccessCount: validRows.length,
          addedRows: validRows.map((r) => r.data),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!state) {
    return (
      <div className="px-h pt-v flex flex-col items-start gap-12">
        <p className="p-small text-gray">No file has been uploaded yet.</p>
        <CustomButton
          title="Back to Employee Sales Target"
          onClick={() => navigate("/employeeSalesTarget")}
        />
      </div>
    );
  }

  return (
    <div className="pt-12 flex flex-col h-full overflow-hidden bg-bgcolor">
      <div className="flex items-center gap-8 shrink-0 mx-24">
        <button
          onClick={handleCancel}
          className="flex items-center justify-center"
          aria-label="Back"
        >
          <IconRenderer icon="LuArrowLeft" size={18} />
        </button>
        <p className="p-small text-gray">
          Employee Sales Target /{" "}
          <span className="text-darkgray font-semibold">Bulk Upload</span>
        </p>
      </div>

      <div className="flex-1 min-h-0 mt-16 border-1 border-strokegray rounded-6 bg-white flex flex-col mx-24 mb-20">
        <div className="flex items-center gap-24 mt-16 border-b-1 border-strokegray px-[20px] shrink-0">
          <TabButton
            label={`Valid Records(${validRows.length})`}
            icon="FiCheckCircle"
            activeColor="text-primary"
            isActive={activeTab === "valid"}
            onClick={() => setActiveTab("valid")}
          />
          <TabButton
            label={`Invalid Records(${invalidRows.length})`}
            icon="FaRegTimesCircle"
            textColor="text-danger"
            inActiveColor="text-danger"
            activeColor="text-danger"
            isActive={activeTab === "invalid"}
            onClick={() => setActiveTab("invalid")}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[25px] pb-[25px] pt-[15px]">
          {activeTab === "valid" && (
            <GroupedIncentiveTable
              columns={EMPLOYEE_TARGET_TABLE_COLUMNS}
              data={validGroups}
              emptyMessage="No valid records."
            />
          )}
          {/* NOTE: mirror Product's invalid-rows table here if you render
              per-row error messages for invalid records elsewhere. */}
        </div>
      </div>

      <div className="flex items-center justify-end gap-12 h-[54px] shrink-0 border-t-1 border-strokegray bg-white px-h">
        <CustomButton
          title="Cancel"
          backgroundColor="bg-white"
          textColor="text-darkgray"
          borderColor="border-strokegray"
          borderWidth="border-1"
          gap="gap-[5px]"
          height="h-[34px]"
          onClick={handleCancel}
          icon={
            <IconRenderer
              icon="FaRegTimesCircle"
              size={16}
              className="text-litegray"
            />
          }
          iconPosition="left"
          disabled={isSubmitting}
        />
        <CustomButton
          title="Add Records"
          backgroundColor="bg-primary"
          textColor="text-white"
          gap="gap-[5px]"
          height="h-[34px]"
          borderRadius="rounded-6"
          icon={
            <IconRenderer
              icon="FiCheckCircle"
              size={16}
              className="text-white"
            />
          }
          iconPosition="left"
          onClick={handleAddRecords}
          disabled={validRows.length === 0 || isSubmitting}
        />
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  icon: string;
  activeColor: string;
  isActive: boolean;
  onClick: () => void;
  textColor?: string;
  inActiveColor?: string;
}

function TabButton({
  label,
  icon,
  activeColor,
  isActive,
  onClick,
  textColor = "text-primary",
  inActiveColor = "text-gray",
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-6 pb-10 text-13 font-normal ${
        isActive ? `${textColor} border-b-2` : `${inActiveColor}`
      }`}
      style={isActive ? { borderColor: activeColor } : undefined}
    >
      <IconRenderer
        icon={icon}
        size={17}
        className={`${isActive ? activeColor : inActiveColor}`}
      />
      {label}
    </button>
  );
}
