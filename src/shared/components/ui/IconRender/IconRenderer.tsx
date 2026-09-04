import * as AiIcons from "react-icons/ai";
import * as BiIcons from "react-icons/bi";
import * as CiIcons from "react-icons/ci";
import * as FaIcons from "react-icons/fa";
import * as FiIcons from "react-icons/fi";
import * as GoIcons from "react-icons/go";
import * as IoIcons from "react-icons/io";
import * as LuIcons from "react-icons/lu";
import * as MdIcons from "react-icons/md";
import * as RiIcons from "react-icons/ri";
import * as RxIcons from "react-icons/rx";
import * as TbIcons from "react-icons/tb";
import * as WiIcons from "react-icons/wi";
import * as Fa6Icons from "react-icons/fa6";

interface IconRendererProps {
  icon?: string;
  alt?: string;
  className?: string;
  size?: number | string;
  imageUrl?: string;
  onClick?: () => void;
  color?: string;
}

export default function IconRenderer({
  icon = "",
  alt = "icon",
  className = "",
  size = 18,
  imageUrl = "",
  color = "",
  onClick = () => {},
}: IconRendererProps) {
  console.log(imageUrl, "icon");
  // React Icon component

  if (icon) {
    const iconLibraries = {
      ...AiIcons,
      ...BiIcons,
      ...CiIcons,
      ...FaIcons,
      ...FiIcons,
      ...GoIcons,
      ...IoIcons,
      ...LuIcons,
      ...MdIcons,
      ...RiIcons,
      ...RxIcons,
      ...TbIcons,
      ...WiIcons,
      ...Fa6Icons,
    };
    const Icons = iconLibraries[icon as keyof typeof iconLibraries];
    return (
      <Icons
        className={className}
        size={size}
        onClick={onClick}
        color={color}
      />
    );
  }

  // SVG / image path
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={alt} className={className} onClick={onClick} />
    );
  }
}
