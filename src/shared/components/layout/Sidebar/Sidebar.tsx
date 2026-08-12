import { useState } from "react";
import SideBarIcon from "../../../../assets/icons/SideBar/SideBarIcon.svg";
import IconRenderer from "../../ui/IconRender/IconRenderer";
import PageLayOut from "../../../../assets/json/pageLayout/pageLayout.json";
import { useNavigate } from "react-router-dom";
import type { RouteNavigation } from "../../../../modules/sales-incentive/types/salesIncentive.types";
import CustomButton from "../../ui/Button/CustomButton";

export default function Sidebar() {
  const navigate = useNavigate();
  const [activeSideBar, setActiveSideBar] = useState<string | undefined>(
    PageLayOut?.SideBar?.sideBarData[0]?.name,
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  //Handle Navigation
  const handleNavigation = (item: RouteNavigation) => {
    setActiveSideBar(item?.name);

    if (item?.route) {
      navigate(item.route);
    }
  };

  return (
    <div
      className={`
        relative z-10
        h-screen bg-white flex flex-col items-center pt-[30px]
        shadow-card-xl transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-[65px]" : "w-228"}
      `}
    >
      {/* Logo */}
      {!isCollapsed && (
        <div className="transition-opacity duration-200">
          <IconRenderer
            imageUrl={SideBarIcon}
            alt="SideBarIcon"
            className="pb-[15%]"
          />
        </div>
      )}

      {/* Sidebar Items */}
      <div className="flex w-full flex-col items-center">
        {PageLayOut?.SideBar?.sideBarData?.map((item) => (
          <div
            key={item?.name}
            onClick={() => handleNavigation(item)}
            className={`
              cursor-pointer
              h-38
              rounded-6
              flex items-center
              mb-[10px]
              transition-all duration-300
              ${
                isCollapsed
                  ? "w-[40px] justify-center px-0"
                  : "w-200 px-[12px] gap-[9px]"
              }
              ${activeSideBar === item?.name ? "bg-primary" : "bg-white"}
            `}
          >
            {/* Icon */}
            <IconRenderer
              imageUrl={
                activeSideBar === item?.name ? item?.activeIcon : item?.icon
              }
              alt={item?.name}
            />
            {/* Name */}
            {!isCollapsed && (
              <p
                className={`
                  p-small
                  whitespace-nowrap
                  ${
                    activeSideBar === item?.name
                      ? "text-white"
                      : "text-darkgray"
                  }
                `}
              >
                {item?.name}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Support */}
      <div
        className={`
          mt-auto
          border-t-1
          w-full
          h-48
          border-strokegray
          flex
          items-center
          transition-all
          duration-300
          ${isCollapsed ? "justify-center px-0" : "justify-between px-12"}
        `}
      >
        {/* Support */}
        {!isCollapsed && (
          <div className="flex items-center gap-[6px]">
            <IconRenderer
              icon="AiOutlineQuestionCircle"
              size={20}
              className="text-gray"
            />

            <p className="p-tiny text-gray">Support</p>
          </div>
        )}
        <CustomButton
          onClick={() => setIsCollapsed((prev) => !prev)}
          backgroundColor="bg-white"
          className={`
            flex items-center justify-center
            cursor-pointer
            transition-transform
            duration-300
            ${isCollapsed ? "rotate-180" : ""}
          `}
          title=""
          hoverEffect={false}
          icon={
            <IconRenderer
              icon="FaAnglesRight"
              size={19}
              className="text-gray"
            />
          }
          iconPosition="left"
        />
      </div>
    </div>
  );
}
