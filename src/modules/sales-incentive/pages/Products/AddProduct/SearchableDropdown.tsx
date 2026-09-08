import { useEffect, useRef, useState } from "react";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import type { AddProductOption } from "../../../types/salesIncentive.types";

interface SearchableDropdownProps {
  options: AddProductOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  allowAdd?: boolean;
  addLabel?: string;
  disabled?: boolean;
  icon?: string;
  onAddNew?: () => void;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Choose",
  searchable = false,
  allowAdd = false,
  addLabel = "Add New",
  disabled = false,
  icon = "LuPlus",
  onAddNew,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        className={`w-full flex items-center justify-between  px-[12px] bg-transparent text-left ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span
          className={`text-14 truncate ${selected ? "text-darkgray" : "text-[#9CA3AF]"}`}
        >
          {selected?.label ?? placeholder}
        </span>
        <IconRenderer
          icon="IoMdArrowDropdown"
          size={18}
          className="text-[#6B7280] shrink-0"
        />
      </button>

      {isOpen && (
        <div className="absolute top-[44px] left-0 w-full bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg z-50 max-h-[260px] flex flex-col">
          {searchable && (
            <div className="px-[10px] pt-[10px] pb-[6px] shrink-0">
              <div className="flex items-center border border-[#E5E7EB] rounded-[6px] px-[10px] h-[34px]">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 text-13 border-none outline-none bg-transparent"
                />
                <IconRenderer
                  icon="FiSearch"
                  size={14}
                  className="text-[#9CA3AF] shrink-0"
                />
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-[10px]">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full text-left px-[14px] h-[31px] text-13 cursor-pointer hover:bg-[#F3F4F6] ${
                  opt.value === value
                    ? "bg-[#E7E7EC] text-primary rounded-6"
                    : "text-darkgray"
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-[14px] py-[10px] text-13 text-gray">
                No results found
              </p>
            )}
          </div>
          {allowAdd && (
            <div className="border-t border-[#E5E7EB] px-[14px] py-[8px] gap-2 flex justify-center ">
              <div className="mt-2">
                <IconRenderer icon={icon} size={16} color="#5C67FD" />
              </div>
              <button
                type="button"
                className="text-13 text-secondary cursor-pointer font-medium"
                onClick={() => {
                  setIsOpen(false);
                  setSearch("");
                  onAddNew?.();
                }}
              >
                {addLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
