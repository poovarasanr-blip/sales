import React from "react";

interface CustomAvatarProps {
  title?: string;
  // Colors
  backgroundColor?: string;
  textColor?: string;
  width?: string;
  height?: string;
  borderRadious?: string;
  borderWidth?: string;
  borderColor?: string;
}

const CustomAvatar: React.FC<CustomAvatarProps> = ({
  title = "SJ",
  backgroundColor = "bg-primary",
  textColor = "text-white",
  width = "w-38",
  height = "h-38",
  borderRadious = "rounded-full",
  borderWidth = "border-0",
  borderColor = "border-white",
}) => {
  const avatarClass = [
    backgroundColor,
    width,
    height,
    borderRadious,
    borderColor,
    borderWidth,
    "flex",
    "items-center",
    "justify-center",
    "cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");
  const avatarTextClass = [textColor, "p"].filter(Boolean).join(" ");

  return (
    <div className={avatarClass}>
      <p className={avatarTextClass}>{title}</p>
    </div>
  );
};

export default CustomAvatar;
