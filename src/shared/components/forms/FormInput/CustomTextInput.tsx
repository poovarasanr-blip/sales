import React, { forwardRef } from "react";
import IconRenderer from "../../ui/IconRender/IconRenderer";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  backgroundColor?: string;
  borderWidth?: string;
  borderRadious?: string;
  lableFontSize?: string;
  lableFontWeight?: string;
  lableTextColor?: string;
  lableFontFamily?: string;
  leftIconStyle?: string;
  rightIconStyle?: string;
  placeholder?: string;
  inputTextSize?: string;
  inputTextWeight?: string;
  inputTextColor?: string;
  onClickLeftIcon?: () => void;
  onClickRightIcon?: () => void;
  borderColor?: string;
  onChange?: (value: string) => void;
}

const CustomInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label = "",
      error = "",
      helperText = "",
      leftIcon = "",
      rightIcon = "",
      required = false,
      containerClassName = "w-full",
      className = "",
      disabled = false,
      backgroundColor = "bg-white",
      borderWidth = "border-1",
      borderRadious = "rounded-6",
      borderColor = "border-strokegray",
      lableFontSize = "text-12",
      lableFontWeight = "font-normal",
      lableTextColor = "text-darkgray",
      lableFontFamily = "font-sans",
      leftIconStyle = "",
      rightIconStyle = "",
      placeholder = "",
      inputTextSize = "text-14",
      inputTextWeight = "font-normal",
      inputTextColor = "text-darkgray",
      onChange,
      onClickLeftIcon = () => {},
      onClickRightIcon = () => {},
      value = "",
      ...props
    },
    ref,
  ) => {
    const inputClass = [
      "h-full",
      "w-full",
      "outline-none",
      "placeholder:text-[#9898a6]",
      "disabled:cursor-not-allowed",
      "disabled:bg-gray-100",
      "disabled:text-[#9898a6]",
      "border-0",
      inputTextColor,
      inputTextWeight,
      inputTextSize,
      backgroundColor,
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
        : "border-gray-300",
      leftIcon ? "pl-10" : "",
      rightIcon ? "pr-10" : "",
      className,
      borderRadious,
    ]
      .filter(Boolean)
      .join(" ");
    const labelText = [
      lableFontSize,
      lableFontWeight,
      lableTextColor,
      lableFontFamily,
    ]
      .filter(Boolean)
      .join(" ");
    const inputContainerClass = [
      borderWidth,
      "flex",
      "items-center",
      "w-full",
      "h-40",
      borderWidth,
      borderRadious,
      backgroundColor,
      "px-10",
      borderColor,
      "focus-within:border-black",
      //   "focus-within:shadow-card-xl",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`${containerClassName}`}>
        {/* Label */}
        {label && (
          <label className={labelText}>
            {label}
            {required && <span className="ml-1 text-danger">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className={inputContainerClass}>
          {/* Left Icon */}
          {leftIcon && (
            <IconRenderer
              className={leftIconStyle}
              icon={leftIcon}
              onClick={onClickLeftIcon}
            />
          )}
          {/* Input */}
          <input
            ref={ref}
            disabled={disabled}
            className={inputClass}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange?.(e.target.value);
            }}
            {...props}
          />
          {/* Right Icon */}
          {rightIcon && (
            <IconRenderer
              className={rightIconStyle}
              icon={rightIcon}
              onClick={onClickRightIcon}
            />
          )}
        </div>
        {/* Error */}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {/* Helper Text */}
        {!error && helperText && (
          <p className="mt-1 text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  },
);

CustomInput.displayName = "Input";

export default CustomInput;
