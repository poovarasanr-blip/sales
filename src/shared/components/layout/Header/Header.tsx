import { useState } from "react";
import PageLayOut from "../../../../assets/json/pageLayout/pageLayout.json";
import CustomInput from "../../forms/FormInput/CustomTextInput";
import IconRenderer from "../../ui/IconRender/IconRenderer";
import CustomButton from "../../ui/Button/CustomButton";
import CustomAvatar from "../../ui/Avatar/Avatar";

export default function Header() {
  const [searchValue, setSearchValue] = useState<string>("");

  return (
    <div className="flex border-b-1 border-[#DADADA80] h-60 bg-white items-center px-12 justify-between">
      {PageLayOut?.Header?.IsSearchRequired && (
        <CustomInput
          value={searchValue}
          onChange={setSearchValue}
          leftIcon="FiSearch"
          size={22}
          leftIconStyle={"text-gray"}
          height={"h-42"}
          containerClassName={"w-[360px]"}
          borderWidth={"border-0"}
          placeholder="Search here..."
        />
      )}
      <div className="flex items-center gap-[12px]">
        {PageLayOut?.Header?.Icon && (
          <IconRenderer imageUrl={PageLayOut?.Header?.Icon} />
        )}
        <CustomButton
          title="Manager"
          textColor="text-gray"
          iconPosition="right"
          backgroundColor="bg-[#DADADA59]"
          height="h-32"
          width="w-[102px]"
          icon={<IconRenderer icon="FiUser" size={18} />}
          gap="gap-[10px]"
        />
        <CustomButton
          title=""
          backgroundColor="bg-white"
          hoverEffect={false}
          icon={<IconRenderer icon="GoBell" size={20} className="text-gray" />}
        />
        <CustomAvatar />
      </div>
    </div>
  );
}
