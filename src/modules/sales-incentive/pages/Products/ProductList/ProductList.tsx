import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayOut from "../../../../../assets/json/pageLayout/pageLayout.json";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import NoDataFound from "../../../../../shared/components/ui/NoDataFound/NoDataFound";
import BulkUploadCard from "../../../../../shared/components/ui/BulkUpload/BulkUploadCard";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import {
  PRODUCT_SAMPLE_ROWS,
  PRODUCT_UPLOAD_COLUMNS,
  PRODUCT_TABLE_COLUMNS,
  groupProductRows,
  type ProductUploadRow,
} from "../../../config/Productbulkupload";
import { generateSampleFile } from "../../../../../shared/utils/BulkuploadUtils";
import { useBulkUpload } from "../../../hooks/Usebulkupload";
import { showToast } from "../../../../../shared/components/ui/CustomToast/UseToast";
import CustomInput from "../../../../../shared/components/forms/FormInput/CustomTextInput";

interface ProductListLocationState {
  bulkUploadSuccessCount?: number;
  addedProducts?: ProductUploadRow[];
}

const PRODUCT_LIST_COLUMNS = [
  ...PRODUCT_TABLE_COLUMNS,
  { key: "action", label: "Action", width: "122px" },
] as typeof PRODUCT_TABLE_COLUMNS;

export default function ProductList() {
  const navigate = useNavigate();
  const location = useLocation();

  const { uploadingFile, fileError, startUpload } =
    useBulkUpload<ProductUploadRow>(PRODUCT_UPLOAD_COLUMNS);

  const [products, setProducts] = useState<ProductUploadRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const state = location.state as ProductListLocationState | undefined;
    if (!state?.addedProducts?.length) return;
    setProducts((prev) => [...prev, ...state.addedProducts!]);
    showToast({
      type: "success",
      title: "Success!",
      message: `${state.bulkUploadSuccessCount ?? state.addedProducts.length} products has been added`,
      duration: 3000,
    });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.Category.toLowerCase().includes(q) ||
        p["Sub Category"].toLowerCase().includes(q) ||
        p.Product.toLowerCase().includes(q),
    );
  }, [products, searchTerm]);

  const productGroups = useMemo(
    () => groupProductRows(filteredProducts),
    [filteredProducts],
  );

  const handleSampleDownload = useCallback(() => {
    generateSampleFile(
      PRODUCT_UPLOAD_COLUMNS,
      PRODUCT_SAMPLE_ROWS,
      "Product_Bulk_Upload_Sample.xlsx",
      "Products",
    );
  }, []);

  const handleDownloadExcel = useCallback(() => {
    generateSampleFile(
      PRODUCT_UPLOAD_COLUMNS,
      filteredProducts,
      "Products.xlsx",
      "Products",
    );
  }, [filteredProducts]);

  const handleFilesReceived = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;

      const result = await startUpload(file);
      if (!result) return;

      navigate("/bulkUpload", {
        state: { validRows: result.validRows, invalidRows: result.invalidRows },
      });
    },
    [startUpload, navigate],
  );

  const handleBrowseClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) handleFilesReceived(target.files);
    };
    input.click();
  }, [handleFilesReceived]);

  const hasProducts = products.length > 0;
  return (
    <div className="px-h pt-12 overflow-scroll scrollbar-hide bg-bgcolor flex flex-col min-h-[100%] relative">
      <div className="flex items-center justify-between">
        <p className="text-heading-6 text-darkgray">
          {PageLayOut?.Products?.PageTitle}
        </p>
        {PageLayOut?.Products?.IsBulkUploadRequired && (
          <CustomButton
            backgroundColor="bg-white"
            height="h-37"
            width="w-[119px]"
            gap="gap-[7px]"
            title={PageLayOut?.Products?.CustomButtons?.UploadButton?.Name}
            borderRadius="rounded-6"
            borderColor={"border-primary"}
            textColor={"text-primary"}
            borderWidth="border-1"
            icon={
              <IconRenderer
                icon={PageLayOut?.Products?.CustomButtons?.UploadButton?.Icon}
                size={16}
                className="text-primary"
              />
            }
            iconPosition="left"
            onClick={handleBrowseClick}
          />
        )}
      </div>

      {hasProducts ? (
        <div className="flex-1 min-h-0 border-1 border-strokegray rounded-6 bg-white mt-14 mb-14 px-16 pb-14">
          <div className="flex items-center justify-between mt-14">
            <div className="w-[360px]">
              <CustomInput
                rightIcon="FiSearch"
                placeholder="Search..."
                height={"h-[42px]"}
                rightIconStyle="text-gray"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e)}
              />
            </div>
            <CustomButton
              title="Download Excel"
              backgroundColor="bg-primary"
              textColor="text-white"
              height="h-37"
              gap="gap-[10px]"
              icon={
                <IconRenderer
                  icon="LuDownload"
                  size={15}
                  className="text-white"
                />
              }
              iconPosition="left"
              onClick={handleDownloadExcel}
            />
          </div>

          <GroupedIncentiveTable
            columns={PRODUCT_LIST_COLUMNS}
            data={productGroups}
            emptyMessage="No products found."
            renderCustomCell={(column) => {
              if (column.key !== "action") return undefined;
              return (
                <div className="flex items-center justify-center gap-[15px]">
                  <button aria-label="Delete">
                    <IconRenderer
                      icon="FiTrash2"
                      size={16}
                      className="text-gray"
                    />
                  </button>
                  <button aria-label="History">
                    <IconRenderer
                      icon="FiRotateCcw"
                      size={16}
                      className="text-gray"
                    />
                  </button>
                  <button aria-label="Edit">
                    <IconRenderer
                      icon="FiEdit2"
                      size={16}
                      className="text-gray"
                    />
                  </button>
                </div>
              );
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col flex-1 border-1 border-strokegray rounded-6 bg-white my-14 items-center justify-center">
          <NoDataFound
            description={PageLayOut?.NoDataFound?.SubTitle}
            title={PageLayOut?.NoDataFound?.Title}
          />
          <BulkUploadCard
            title={PageLayOut?.BuldUploadcard?.CardTitle}
            description={PageLayOut?.BuldUploadcard?.CardSubTitle}
            browseText={PageLayOut?.BuldUploadcard?.UploadLabel2}
            dragDropText={PageLayOut?.BuldUploadcard?.UploadLabel1}
            sampleButtonTitle={PageLayOut?.BuldUploadcard?.DownloadButtonText}
            sampleButtonIcon={PageLayOut?.BuldUploadcard?.DownloadIcon}
            uploadIcon={PageLayOut?.BuldUploadcard?.UploadIcon}
            filesHereText={PageLayOut?.BuldUploadcard?.UploadLabel3}
            onSampleDownload={handleSampleDownload}
            onBrowseClick={handleBrowseClick}
            onDrop={handleFilesReceived}
            uploadingFile={uploadingFile}
          />

          {fileError && (
            <p className="p-tiny text-red-600 mt-8 max-w-[632px] text-center">
              {fileError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
