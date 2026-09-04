import { useEffect, useRef, useState } from "react";
import IconRenderer from "../../ui/IconRender/IconRenderer";

interface DropdownOption {
  label: string;
  value: string;
}
interface CustomDropdownProps {
  placeholder?: string;
  label?: string;
  value?: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  upArrow?: string;
  downArrow?: string;
  iconSize?: number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  placeholder = "Select an option",
  label = "",
  value = "",
  options = [],
  onChange = () => {},
  disabled = false,
  className = "",
  borderColor = "border-strokegray",
  borderRadius = "rounded-4",
  borderWidth = "border-1",
  upArrow = "FaAngleUp",
  downArrow = "FaAngleDown",
  iconSize = 14,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <div className="mb-1">
          <p className="text-xs font-medium text-gray-500">{label}</p>
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${borderWidth} h-[37px] flex w-full items-center justify-between gap-[10px] ${borderRadius}  ${borderColor} bg-white px-10 transition-colors
          ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-gray-300"}
          ${isOpen ? "border-gray-400" : ""}`}
      >
        <span
          className={`p-small ${
            selectedLabel ? "text-darkgray" : "text-gray-400"
          }`}
        >
          {selectedLabel ?? placeholder}
        </span>
        <IconRenderer
          icon={isOpen ? upArrow : downArrow}
          size={iconSize}
          color="#59596C"
        />
      </button>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-card-xl">
          {options.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-400">No options</li>
          )}
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-50 ${
                opt.value === value
                  ? "font-semibold text-slate-900"
                  : "text-slate-700"
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
