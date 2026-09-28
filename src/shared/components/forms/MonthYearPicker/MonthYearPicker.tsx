import { forwardRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import IconRenderer from "../../ui/IconRender/IconRenderer";

interface MonthYearPickerProps {
  onDateChange?: (month: number, year: number) => void;
  backgroundColor?: string;
  textColor?: string;
  height?: string;
  width?: string;
  borderRadius?: string;
  gap?: string;
  icon?: string;
  iconSize?: number;
  iconClassName?: string;
}

interface TriggerProps {
  value?: string;
  onClick?: () => void;
  backgroundColor: string;
  textColor: string;
  height: string;
  width: string;
  borderRadius: string;
  gap: string;
  icon: string;
  iconSize: number;
  iconClassName: string;
}

const PickerTrigger = forwardRef<HTMLButtonElement, TriggerProps>(
  (props, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={props.onClick}
      className={`inline-flex items-center justify-center transition-all duration-150 text-13 font-medium cursor-pointer hover:brightness-95 active:scale-97 px-3 ${props.backgroundColor} ${props.textColor} ${props.height} ${props.width} ${props.borderRadius} ${props.gap}`}
    >
      <span>{props.value}</span>
      <span className="flex items-center">
        <IconRenderer
          icon={props.icon}
          size={props.iconSize}
          className={props.iconClassName}
        />
      </span>
    </button>
  ),
);

PickerTrigger.displayName = "PickerTrigger";

export default function MonthYearPicker({
  onDateChange,
  backgroundColor = "bg-primary",
  textColor = "text-white",
  height = "h-34",
  width = "w-[112px]",
  borderRadius = "rounded-6",
  gap = "gap-10",
  icon = "LuCalendar",
  iconSize = 18,
  iconClassName = "text-white",
}: MonthYearPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleChange = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    onDateChange?.(date.getMonth() + 1, date.getFullYear());
  };

  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        showMonthYearPicker
        dateFormat="MMM yyyy"
        customInput={
          <PickerTrigger
            backgroundColor={backgroundColor}
            textColor={textColor}
            height={height}
            width={width}
            borderRadius={borderRadius}
            gap={gap}
            icon={icon}
            iconSize={iconSize}
            iconClassName={iconClassName}
          />
        }
        popperPlacement="bottom-end"
        popperProps={{ strategy: "fixed" }}
        calendarClassName="!rounded-xl !border !border-[#E6E6EB] !shadow-lg"
      />
    </div>
  );
}
