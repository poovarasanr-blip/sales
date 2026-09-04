import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";

interface SalesCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel?: string;
}

/**
 * Minimal checkbox used only for Sales row/bulk selection. No shared
 * Checkbox component exists yet in this codebase, so this stays scoped to
 * Sales rather than becoming a new shared primitive other screens inherit.
 */
export default function SalesCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: SalesCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`w-[16px] h-[16px] rounded-4 border-1 flex items-center justify-center shrink-0 ${
        checked || indeterminate
          ? "bg-primary border-primary"
          : "bg-white border-strokegray"
      }`}
    >
      {checked && !indeterminate && (
        <IconRenderer icon="MdOutlineCheck" size={12} className="text-white" />
      )}
      {indeterminate && <span className="w-[8px] h-[2px] bg-white block" />}
    </button>
  );
}
