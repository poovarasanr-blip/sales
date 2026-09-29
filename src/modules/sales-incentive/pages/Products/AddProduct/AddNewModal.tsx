import { useState } from "react";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";

interface AddNewModalProps {
  title: string;
  label: string;
  placeholder: string;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function AddNewModal({
  title,
  label,
  placeholder,
  onSave,
  onCancel,
  isSaving,
}: AddNewModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[12px] w-[400px] shadow-xl">
        {/* Header */}
        <div className="flex justify-between mx-[16px] border-b border-strokegray py-[16px]">
          <h3 className="text-16 font-medium text-darkgray">{title}</h3>
          <IconRenderer
            icon="RiCloseLargeFill"
            size={16}
            color="#A8A8AD"
            onClick={onCancel}
          />
        </div>

        {/* Body */}
        <div className="px-[16px] py-[16px]">
          <label className="text-13 font-medium text-darkgray mb-[8px] block">
            {label}
          </label>
          <input
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="w-full h-[42px] px-[14px] border border-[#E5E7EB] rounded-[8px] bg-white text-14 text-darkgray outline-none placeholder:text-[#9CA3AF] focus:border-[#707AFD]"
          />
          <label className="text-13 font-medium text-darkgray mb-[8px] mt-[16px] block">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter Description"
            className="w-full min-h-[84px] px-[14px] py-[10px] border border-[#E5E7EB] rounded-[8px] bg-white text-14 text-darkgray outline-none placeholder:text-[#9CA3AF] focus:border-[#707AFD] resize-y"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[10px] px-[24px] pb-[24px] pt-[8px]">
          <div
            onClick={onCancel}
            className="h-[34px] w-[89px] rounded-[6px]  cursor-pointer bg-[#ECECEC] flex items-center gap-3 justify-center"
          >
            <IconRenderer
              icon="IoIosCloseCircleOutline"
              size={16}
              color="#59596C"
            />
            <p className="text-13 font-medium text-gray">Cancel</p>
          </div>
          {/* <button
            type="button"
            onClick={() => {
              const trimmed = inputValue.trim();
              if (trimmed) onSave(trimmed);
            }}
            className="h-[34px] w-[76px]  rounded-[6px] bg-[#5C67FD] text-13 font-medium text-white cursor-pointer hover:bg-[#4B55E0]"
          >
            Save
          </button> */}
          <div
            onClick={() => {
              if (isSaving) return;
              onSave(inputValue.trim(), description.trim());
            }}
            className={`h-[34px] w-[76px] rounded-[6px] cursor-pointer bg-primary flex items-center gap-4 justify-center ${isSaving ? "opacity-60" : ""}`}
          >
            <IconRenderer icon="FiCheckCircle" size={16} color="#FFFFFF" />
            <p className="text-13 font-medium text-white">Save</p>
          </div>
        </div>
      </div>
    </div>
  );
}
