import React from "react";

interface CustomButtonProps {
  title?: string;
  // Colors
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  // Size
  width?: string;
  height?: string;
  padding?: string;
  borderRadius?: string;
  // Icon
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  // Events
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  // Effects
  hoverEffect?: boolean;
  clickEffect?: boolean;
  // Tailwind custom classes
  className?: string;
  items?: string;
  fontWeight?: string;
  justifyContent?: string;
  gap?: string;
  fontSize?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title = "Button",
  backgroundColor = "bg-pink-500",
  textColor = "text-white",
  borderColor = "border-transparent",
  width = "w-auto",
  height = "h-40",
  padding = "px-3",
  borderRadius = "rounded-6",
  icon,
  iconPosition = "left",
  onClick,
  type = "button",
  disabled = false,
  hoverEffect = true,
  clickEffect = true,
  className = "",
  items = "items-center",
  fontWeight = "font-medium",
  justifyContent = "justify-center",
  gap = "gap-2",
  fontSize = "text-13",
}) => {
  const buttonClasses = [
    "inline-flex",
    "transition-all",
    "duration-150",
    fontSize,
    gap,
    justifyContent,
    fontWeight,
    items,
    backgroundColor,
    textColor,
    borderColor,
    width,
    height,
    padding,
    borderRadius,
    hoverEffect && !disabled ? "hover:brightness-95 " : "", //hover:shadow-md
    clickEffect && !disabled ? "active:scale-97" : "",
    disabled ? "cursor-not-allowed" : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {icon && iconPosition === "left" && (
        <span className="flex items-center">{icon}</span>
      )}

      {title && <span>{title}</span>}

      {icon && iconPosition === "right" && (
        <span className="flex items-center">{icon}</span>
      )}
    </button>
  );
};

export default CustomButton;
