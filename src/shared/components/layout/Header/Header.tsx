import { useEffect, useRef, useState } from "react";
import PageLayOut from "../../../../assets/json/pageLayout/pageLayout.json";
import CustomInput from "../../forms/FormInput/CustomTextInput";
import IconRenderer from "../../ui/IconRender/IconRenderer";
import CustomButton from "../../ui/Button/CustomButton";
import CustomAvatar from "../../ui/Avatar/Avatar";
import {
  useAuthStore,
  type SessionData,
} from "../../../../app/store/useAuthStore";
import type { UIRole } from "../../../../app/store/useAuthStore";
import { handleUpdateRole } from "../../../../query/api";
import { useMutation } from "@tanstack/react-query";
import { getSession, setSession } from "../../../utils/sessionStorage";
import { useClientSessionStore } from "../../../../app/store/useClientSessionStore";
import ProfileIcon from "../../../../assets/icons/header/ProfileIcon.svg";

export default function Header({
  onClientContractClick,
}: {
  onClientContractClick: () => void;
}) {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const previousRoleCodeRef = useRef<string>("");
  const sessionData = useAuthStore((s) => s.sessionData);
  const clientContractName = useClientSessionStore((s) => s.clientContractName);
  const uiRoles = (sessionData?.UIRoles ?? []) as UIRole[];
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(
    sessionData?.UIRoles?.[0]?.Role?.Code ?? "",
  );

  useEffect(() => {
    if (sessionData?.HierarchyRole?.RoleCode && !selectedRoleCode) {
      setSelectedRoleCode(sessionData.HierarchyRole.RoleCode);
    }
  }, [sessionData?.HierarchyRole?.RoleCode, selectedRoleCode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRoleName =
    uiRoles.find((r) => r.Role.Code === selectedRoleCode)?.Role.Name ??
    selectedRoleCode;
  const contractButtonTitle = clientContractName || "Client Contract";

  const { isPending: updateRoleLoading, mutate: updateRoleInSession } =
    useMutation({
      mutationFn: (variables: { payload: string; token: string }) =>
        handleUpdateRole(variables.payload, variables.token),
      onSuccess: (response) => {
        if (response?.data?.Status) {
          const selectedRole = uiRoles.find(
            (r) => r.Role.Code === selectedRoleCode,
          );
          setSession(
            JSON.stringify({
              ...sessionData,
              UIRoles: [
                selectedRole,
                ...sessionData?.UIRoles?.filter(
                  (uiRole) => uiRole.Role.Code !== selectedRoleCode,
                ),
              ],
            }),
          );
          const existing = getSession<SessionData>();
          useAuthStore.setState({
            sessionData: existing as SessionData,
            isAuthenticated: true,
          });
        }
      },
      onError: (error) => {
        console.log("Role change error:", error);
        setSelectedRoleCode(previousRoleCodeRef.current);
      },
    });

  const handleRoleSelect = (role: UIRole) => {
    setIsRoleDropdownOpen(false);
    if (role.Role.Code === selectedRoleCode) return;
    previousRoleCodeRef.current = selectedRoleCode;
    setSelectedRoleCode(role.Role.Code);
    const params = {
      data: JSON.stringify({
        IsCompanyHierarchy: false,
        RoleCode: role.Role.Code,
        RoleId: role.Role.Id,
      }),
    };
    updateRoleInSession({
      payload: params,
      token: sessionData?.Token ?? "",
    });
  };

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
          title={contractButtonTitle}
          textColor="text-darkgray"
          iconPosition="right"
          backgroundColor="bg-white"
          height="h-32"
          padding="px-0"
          icon={<IconRenderer icon="IoMdArrowDropdown" size={16} />}
          gap="gap-[6px]"
          fontWeight="font-normal"
          onClick={onClientContractClick}
          className="truncate"
        />
        <div className="relative" ref={roleDropdownRef}>
          <CustomButton
            title={updateRoleLoading ? "Switching..." : selectedRoleName}
            textColor="text-gray"
            iconPosition="right"
            backgroundColor="bg-[#DADADA59]"
            height="h-32"
            width="w-auto"
            icon={<IconRenderer imageUrl={ProfileIcon} />}
            gap="gap-[10px]"
            onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
            disabled={updateRoleLoading}
          />
          {isRoleDropdownOpen && (
            <ul className="absolute right-0 z-50 mt-2 min-w-[180px] max-h-[240px] overflow-auto rounded-8 border border-gray-100 bg-white py-1 shadow-card-xl">
              {uiRoles.map((role) => (
                <li
                  key={role.Role.Id}
                  onClick={() => handleRoleSelect(role)}
                  className={`cursor-pointer px-12 py-6 text-13 hover:bg-gray-50 ${
                    role.Role.Code === selectedRoleCode
                      ? "font-semibold text-darkgray"
                      : "text-gray"
                  }`}
                >
                  {role.Role.Name}
                </li>
              ))}
            </ul>
          )}
        </div>
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
