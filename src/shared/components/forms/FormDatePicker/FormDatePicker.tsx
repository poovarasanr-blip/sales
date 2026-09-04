import React, { forwardRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import IconRenderer from "../../ui/IconRender/IconRenderer";

interface CustomDatePickerProps {
  title?: string;
  placeholder?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  width?: string;
  height?: string;
  backgroundColor?: string;
  borderWidth?: string;
  borderRadious?: string;
  borderColor?: string;
  icon?: string;
  textSize?: string;
  textWeight?: string;
  textColor?: string;
  iconSize?: number;
}

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
  height?: string;
  backgroundColor?: string;
  borderWidth?: string;
  borderRadious?: string;
  borderColor?: string;
  icon?: string;
  textSize?: string;
  textWeight?: string;
  textColor?: string;
  iconSize?: number;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      value,
      onClick,
      placeholder,
      disabled,
      width,
      height,
      backgroundColor,
      borderWidth,
      borderRadious,
      borderColor,
      icon,
      textSize,
      textWeight,
      textColor,
      iconSize,
    },
    ref,
  ) => {
    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className={`
          flex
          px-[12px]
          ${height}
          ${width}
          items-center
          justify-between
          ${borderRadious}
          ${borderWidth}
          ${borderColor}
         ${backgroundColor}
          transition-all
          duration-200
          ${
            disabled
              ? "cursor-not-allowed bg-[#F7F7F8] opacity-60"
              : "cursor-pointer hover:border-[#D7D7DF] focus-within:border-[#68687A]"
          }
        `}
      >
        <input
          ref={ref}
          value={value || ""}
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          className={`
            h-full
            min-w-0
            flex-1
            cursor-pointer
            border-none
            bg-transparent
            ${textSize}
           ${textWeight}
            ${textColor}
            outline-none
            placeholder:text-[#353550]
            disabled:cursor-not-allowed
            `}
        />
        {icon && (
          <IconRenderer icon={icon} size={iconSize} className={"text-gray"} />
        )}
      </div>
    );
  },
);

CustomInput.displayName = "CustomInput";

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  title = "",
  placeholder = "Select date",
  value,
  onChange,
  minDate = new Date(),
  maxDate,
  disabled = false,
  width = "100%",
  height = "h-40",
  backgroundColor = "bg-white",
  borderWidth = "border-1",
  borderRadious = "rounded-6",
  borderColor = "border-gray",
  icon = "",
  textSize = "text-13",
  textWeight = "font-normal",
  textColor = "text-black",
  iconSize = 18,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(value ?? null);

  const handleChange = (date: Date | null) => {
    setStartDate(date);
    onChange?.(date);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Optional Label */}
      {title && (
        <label className="text-12 font-normal text-darkgray">{title}</label>
      )}

      <DatePicker
        selected={startDate}
        onChange={handleChange}
        disabled={disabled}
        customInput={
          <CustomInput
            backgroundColor={backgroundColor}
            icon={icon}
            height={height}
            borderRadious={borderRadious}
            borderWidth={borderWidth}
            borderColor={borderColor}
            placeholder={placeholder}
            disabled={disabled}
            width={width}
            textSize={textSize}
            textColor={textColor}
            textWeight={textWeight}
            iconSize={iconSize}
          />
        }
        dateFormat="dd/MM/yyyy"
        minDate={minDate}
        maxDate={maxDate}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        popperPlacement="bottom-start"
        wrapperClassName="w-full"
        calendarClassName="!rounded-xl !border !border-[#E6E6EB] !shadow-lg"
      />
    </div>
  );
};

export default CustomDatePicker;
