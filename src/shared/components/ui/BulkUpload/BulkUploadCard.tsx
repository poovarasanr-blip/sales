import React from "react";
import CustomButton from "../Button/CustomButton";
import IconRenderer from "../IconRender/IconRenderer";
import type {
  BulkUploadCardProps as BaseBulkUploadCardProps,
  UploadingFileState,
} from "../../../../modules/sales-incentive/types/salesIncentive.types";
// import { getFileExtensionLabel } from "../../../utils/BulkuploadUtils";
import xlsIcon from "../../../../assets/icons/NodataFound/xlsIcon.svg";

type BulkUploadCardProps = BaseBulkUploadCardProps & {
  uploadingFile?: UploadingFileState | null;
};

export default function BulkUploadCard({
  title = "Bulk Upload",
  description = "Download the sample file, fill in the required data, and upload it",
  sampleButtonTitle = "Sample Document",
  sampleButtonIcon = "LuDownload",
  dragDropText = "Drag & Drop or",
  browseText = "Browse",
  filesHereText = "your files here",
  uploadIcon = "LuFileUp",
  uploadIconSize = 27,
  uploadIconColor = "#A8A8AD",
  onSampleDownload,
  onBrowseClick,
  onDrop,
  className = "",
  uploadingFile = null,
}: BulkUploadCardProps) {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onDrop && e.dataTransfer.files?.length) {
      onDrop(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      className={`bg-midbluebg w-[632px] ${uploadingFile ? "min-h-[138px]" : "min-h-[187px]"} rounded-6 p-14 mt-16 ${className}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="p-small-bold text-darkgray">{title}</p>
          <p className="p-tiny text-gray">{description}</p>
        </div>
        <CustomButton
          title={sampleButtonTitle}
          height="h-18"
          backgroundColor="bg-transparent"
          fontSize="text-13"
          fontWeight="font-normal"
          textColor="text-secondary"
          padding="px-0"
          clickEffect={false}
          gap="gap-[5px]"
          icon={
            <IconRenderer
              icon={sampleButtonIcon}
              size={15}
              className="text-secondary"
            />
          }
          iconPosition="right"
          onClick={onSampleDownload}
        />
      </div>
      {uploadingFile ? (
        <div className="flex h-[57px] bg-white border-1 border-strokegray mt-12 rounded-4 items-center px-16">
          <IconRenderer imageUrl={xlsIcon} />
          <div className="flex-1 min-w-0 ml-10">
            <p className="p-tiny text-darkgray truncate">
              {uploadingFile.name}
            </p>
            <div className="w-full h-4 bg-strokegray rounded-full mt-6 overflow-hidden max-w-[90%]">
              <div
                className="h-full bg-success rounded-full transition-all duration-150"
                style={{ width: `${uploadingFile.progress}%` }}
              />
            </div>
          </div>

          <span className="text-11 text-litegray font-normal ">
            {uploadingFile.progress >= 100 ? "processing..." : "uploading..."}
          </span>
        </div>
      ) : (
        <div
          className="flex flex-col h-[106px] bg-white border-1 border-dashed border-strokegray mt-12 rounded-4 items-center justify-center gap-3"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <IconRenderer
            icon={uploadIcon}
            size={uploadIconSize}
            color={uploadIconColor}
          />
          <div className="flex items-center gap-[5px]">
            <p className="p-tiny text-gray">{dragDropText}</p>
            <p
              className="p-tiny text-pretty underline-offset-1 underline cursor-pointer"
              onClick={onBrowseClick}
            >
              {browseText}
            </p>
            <p className="p-tiny text-gray">{filesHereText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
