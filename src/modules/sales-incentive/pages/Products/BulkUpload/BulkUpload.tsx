import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { RowValidationResult } from "../../../types/salesIncentive.types";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import {
  groupProductRows,
  PRODUCT_TABLE_COLUMNS,
  type ProductUploadRow,
} from "../../../config/Productbulkupload";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import InvalidRecordsTable, {
  type InvalidRow,
} from "../../../../../shared/components/ui/DataTable/InvalidRecordsTable";
import { PRODUCT_UPLOAD_COLUMNS } from "../../../config/Productbulkupload";

interface BulkUploadLocationState {
  validRows: RowValidationResult<ProductUploadRow>[];
  invalidRows: RowValidationResult<ProductUploadRow>[];
}

type TabKey = "valid" | "invalid";

export default function BulkUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BulkUploadLocationState | undefined;

  const [validRows, setValidRows] = useState(() =>
    (state?.validRows ?? []).map((r, i) => ({ ...r, __id: `val-${i}` })),
  );
  const [invalidRows, setInvalidRows] = useState<
    InvalidRow<ProductUploadRow>[]
  >(() =>
    (state?.invalidRows ?? []).map((r, i) => ({
      __id: `inv-${i}`,
      data: r.data,
    })),
  );

  const [activeTab, setActiveTab] = useState<TabKey>(
    validRows.length > 0 || invalidRows.length === 0 ? "valid" : "invalid",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validGroups = useMemo(
    () => groupProductRows(validRows.map((r) => r.data)),
    [validRows],
  );
  const handleRemoveInvalid = (ids: string[]) =>
    setInvalidRows((prev) => prev.filter((r) => !ids.includes(r.__id)));

  const handleRowValidated = (row: ProductUploadRow, id: string) => {
    setInvalidRows((prev) => prev.filter((r) => r.__id !== id));
    setValidRows((prev) => [
      ...prev,
      { data: row, __id: `val-${Date.now()}`, rowNumber: prev.length + 1, errors: [] },
    ]);
  };
  const handleCancel = () => navigate("/product");

  const handleAddProducts = async () => {
    setIsSubmitting(true);
    try {
      showToast({
        type: "success",
        title: "Success!",
        message: `${validRows.length} products has been added`,
        duration: 3000,
      });
      navigate("/product", {
        state: {
          bulkUploadSuccessCount: validRows.length,
          addedProducts: validRows.map((r) => r.data),
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
          title="Back to Products"
          onClick={() => navigate("/product")}
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
          Products /{" "}
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
              columns={PRODUCT_TABLE_COLUMNS}
              data={validGroups}
              emptyMessage="No valid records."
            />
          )}
          {activeTab === "invalid" && (
            <InvalidRecordsTable
              columns={PRODUCT_UPLOAD_COLUMNS}
              rows={invalidRows}
              onRemove={handleRemoveInvalid}
              onValidated={handleRowValidated}
              emptyMessage="No invalid records."
            />
          )}
        </div>
      </div>

      {activeTab === "valid" && (
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
            title="Add Products"
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
            onClick={handleAddProducts}
            disabled={validRows.length === 0 || isSubmitting}
          />
        </div>
      )}
      {activeTab === "invalid" && (
        <div className="flex items-center justify-end gap-12 h-[54px] shrink-0 border-t-1 border-strokegray bg-white px-h">
          <CustomButton
            title="Remove"
            backgroundColor="bg-white"
            textColor="text-danger"
            borderColor="border-danger"
            borderWidth="border-1"
            gap="gap-[5px]"
            width="w-[95px]"
            height="h-[34px]"
            onClick={handleCancel}
            icon={
              <IconRenderer
                icon="FaRegTimesCircle"
                size={16}
                className="text-danger"
              />
            }
            iconPosition="left"
            disabled={isSubmitting}
          />
          <CustomButton
            title="Update"
            backgroundColor="bg-primary"
            textColor="text-white"
            gap="gap-[5px]"
            height="h-[34px]"
            borderRadius="rounded-6"
            width="w-[125px]"
            icon={
              <IconRenderer
                icon="FiCheckCircle"
                size={16}
                className="text-white"
              />
            }
            iconPosition="left"
            onClick={handleAddProducts}
            disabled={validRows.length === 0 || isSubmitting}
          />
        </div>
      )}
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
