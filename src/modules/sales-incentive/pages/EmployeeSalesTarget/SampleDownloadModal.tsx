import { useCallback, useMemo, useRef, useState } from "react";
import CustomDropdown from "../../../../shared/components/forms/FormSelect/CustomDropdown";
import CustomButton from "../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import {
  handleGetProductBulkTemplate,
  handleGetExcelTemplate,
} from "../../../../query/api";
import encrypt from "../../../../utils/security/encrypt";
import decrypt from "../../../../utils/security/decrypt";
import { parseNestedJson } from "../../../../utils/security/ParseData";
import { ClientId, ClientContractId } from "../../../../config/env";
import { downloadExcelFromBase64 } from "../../../../shared/utils/downloadExcel";
import type { SessionData } from "../../../../app/store/useAuthStore";

export interface SearchField {
  DisplayName: string;
  FieldName: string;
  InputControlType: number;
  Value: any;
  DefaultValue: any;
  DataSource: {
    Type: number;
    Name: string;
    EntityType: number;
    IsCoreEntity: boolean;
  };
  ForeignKeyColumnNameInDataset: string;
  DisplayFieldInDataset: string;
  ParentFields: string[] | null;
  ReadOnly: boolean;
  IsFieldMandatory: boolean;
  IsIncludedInDefaultSearch: boolean;
  SendElementToGridDataSource: boolean;
}

interface DropdownOption {
  label: string;
  value: string;
}

interface SampleDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchFields: SearchField[];
  sessionData: SessionData | null;
  employeeTemplate: any;
  onUserSelect: (users: Record<string, any>[]) => void;
  searchDataSourceName?: string;
  downloadFileName?: string;
}

const ENV_FIELD_VALUES: Record<string, number> = {
  "@clientId": ClientId, // 304,
  "@clientcontractId": ClientContractId, // 73 ,
};

export default function SampleDownloadModal({
  isOpen,
  onClose,
  searchFields,
  sessionData,
  employeeTemplate,
  onUserSelect,
  searchDataSourceName = "GetEmployeeDetailsForSalesIncentiveTargetsImport",
  downloadFileName = "EmployeeSalesTargetTemplate.xlsx",
}: SampleDownloadModalProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldOptions, setFieldOptions] = useState<
    Record<string, DropdownOption[]>
  >({});
  const [users, setUsers] = useState<Record<string, any>[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>(
    {},
  );
  const fetchedFieldsRef = useRef<Set<string>>(new Set());
  const prevIsOpenRef = useRef(false);

  const visibleFields = useMemo(
    () => searchFields.filter((f) => !(f.FieldName in ENV_FIELD_VALUES)),
    [searchFields],
  );
  if (isOpen && !prevIsOpenRef.current) {
    setFieldValues({});
    setFieldOptions({});
    setUsers([]);
    setSelectedUserIds(new Set());
    fetchedFieldsRef.current = new Set();
  }
  prevIsOpenRef.current = isOpen;

  const fetchFieldOptions = useCallback(
    async (field: SearchField) => {
      if (!sessionData?.Key || !sessionData?.Vector || !sessionData?.Token)
        return;
      if (fetchedFieldsRef.current.has(field.FieldName)) return;

      fetchedFieldsRef.current.add(field.FieldName);
      setLoadingFields((prev) => ({ ...prev, [field.FieldName]: true }));

      const payload = {
        SearchElementList: [] as any[],
        DataSource: field.DataSource,
      };

      try {
        const enc = encrypt(
          JSON.stringify(payload),
          sessionData.Key,
          sessionData.Vector,
        );
        const stdBase64 = enc.replace(/\*/g, "+").replace(/-/g, "/");
        const response = await handleGetProductBulkTemplate(
          stdBase64,
          sessionData.Token,
        );

        if (response?.status === 200) {
          const decrypted = decrypt(
            response.data,
            sessionData.Key,
            sessionData.Vector,
          );
          const parsed = parseNestedJson(JSON.parse(decrypted));
          const items = parsed?.dynamicObject ?? [];
          const options: DropdownOption[] = items.map((item: any) => ({
            label: String(item[field.DisplayFieldInDataset] ?? ""),
            value: String(item[field.ForeignKeyColumnNameInDataset] ?? ""),
          }));
          setFieldOptions((prev) => ({
            ...prev,
            [field.FieldName]: options,
          }));
        }
      } catch {
        fetchedFieldsRef.current.delete(field.FieldName);
      } finally {
        setLoadingFields((prev) => ({ ...prev, [field.FieldName]: false }));
      }
    },
    [sessionData],
  );

  const handleDropdownClick = useCallback(
    (field: SearchField) => {
      if (!fetchedFieldsRef.current.has(field.FieldName)) {
        fetchFieldOptions(field);
      }
    },
    [fetchFieldOptions],
  );

  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
    setUsers([]);
    setSelectedUserIds(new Set());
  }, []);

  const handleSearch = useCallback(async () => {
    if (!sessionData?.Key || !sessionData?.Vector || !sessionData?.Token)
      return;

    setIsSearching(true);
    setUsers([]);
    setSelectedUserIds(new Set());

    const searchElements = searchFields.map((field) => {
      let value: any;
      if (field.FieldName in ENV_FIELD_VALUES) {
        value = ENV_FIELD_VALUES[field.FieldName];
      } else {
        const raw = fieldValues[field.FieldName];
        if (raw != null && raw !== "") {
          const n = Number(raw);
          value = Number.isNaN(n) ? raw : n;
        } else {
          value = field.DefaultValue;
        }
      }
      return {
        FieldName: field.FieldName,
        Value: value,
        DefaultValue: String(field.DefaultValue ?? "0"),
      };
    });

    const payload = {
      SearchElementList: searchElements,
      DataSource: {
        Type: 0,
        Name: searchDataSourceName,
        EntityType: 0,
        IsCoreEntity: false,
      },
    };
    try {
      const enc = encrypt(
        JSON.stringify(payload),
        sessionData.Key,
        sessionData.Vector,
      );
      console.log(payload, "payload");
      const response = await handleGetProductBulkTemplate(
        enc,
        sessionData.Token,
      );

      if (response?.status === 200) {
        const decrypted = decrypt(
          response.data,
          sessionData.Key,
          sessionData.Vector,
        );
        const parsed = parseNestedJson(JSON.parse(decrypted));
        setUsers(parsed?.dynamicObject ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  }, [sessionData, searchFields, fieldValues, searchDataSourceName]);

  const toggleUserSelection = useCallback(
    (user: Record<string, any>, idx: number) => {
      const userId = String(user.Id ?? user.id ?? idx);
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    },
    [],
  );

  const selectedUsers = useMemo(
    () =>
      users?.filter((u, i) => selectedUserIds?.has(String(u.Id ?? u.id ?? i))),
    [users, selectedUserIds],
  );

  const prevSelectedCountRef = useRef(0);
  if (selectedUsers.length !== prevSelectedCountRef.current) {
    prevSelectedCountRef.current = selectedUsers.length;
    onUserSelect(selectedUsers);
  }

  const handleDownloadTemplate = useCallback(async () => {
    if (!sessionData?.Key || !sessionData?.Vector || !sessionData?.Token)
      return;
    if (selectedUserIds.size === 0) return;

    setIsDownloading(true);

    const param = {
      ImportLayout: employeeTemplate,
      FillWithData: selectedUsers,
      SearchElements: [],
      ExtraParameters: null,
    };

    try {
      const enc = encrypt(
        JSON.stringify(param),
        sessionData.Key,
        sessionData.Vector,
      );
      const stdBase64 = enc.replace(/\*/g, "+").replace(/-/g, "/");
      const response = await handleGetExcelTemplate(
        stdBase64,
        sessionData.Token,
      );

      if (response?.status === 200) {
        const decrypted = decrypt(
          response.data,
          sessionData.Key,
          sessionData.Vector,
        );
        const parsed = parseNestedJson(JSON.parse(decrypted));
        const base64 = parsed?.dynamicObject;
        if (base64) {
          downloadExcelFromBase64(base64, downloadFileName);
          onClose();
        }
      }
    } catch {
      // silently fail
    } finally {
      setIsDownloading(false);
    }
  }, [
    sessionData,
    employeeTemplate,
    selectedUsers,
    selectedUserIds,
    downloadFileName,
    onClose,
  ]);

  const canSearch = visibleFields
    .filter((f) => f.IsFieldMandatory)
    .every((f) => fieldValues[f.FieldName]);

  const userDisplayKeys =
    users.length > 0
      ? Object.keys(users[0]).filter(
          (k) =>
            !["Id", "id", "ID"].includes(k) && typeof users[0][k] !== "object",
        )
      : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-[12px] w-[60%] h-[80%] shadow-xl flex flex-col">
        <div className="flex items-center justify-between mx-[16px] border-b border-strokegray py-[16px]">
          <p className="text-16 font-medium text-darkgray">Sample Download</p>
          <IconRenderer
            icon="RiCloseLargeFill"
            size={16}
            color="#A8A8AD"
            onClick={onClose}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px]">
          <div className="flex items-end gap-12 flex-wrap">
            {visibleFields.map((field) => {
              const isLoading = !!loadingFields[field.FieldName];

              return (
                <div
                  key={field.FieldName}
                  className="flex-1 min-w-[140px]"
                  onClick={() => handleDropdownClick(field)}
                >
                  <CustomDropdown
                    label={field.DisplayName}
                    options={fieldOptions[field.FieldName] ?? []}
                    value={fieldValues[field.FieldName] ?? ""}
                    onChange={(v) => handleFieldChange(field.FieldName, v)}
                    disabled={isLoading}
                    placeholder={
                      isLoading ? "Loading..." : `Select ${field.DisplayName}`
                    }
                    borderColor="border-strokegray"
                    borderRadius="rounded-4"
                    borderWidth="border-1"
                    titleTextColor="text-darkgray"
                  />
                </div>
              );
            })}

            <CustomButton
              title="Search"
              backgroundColor="bg-primary"
              textColor="text-white"
              height="h-[37px]"
              borderRadius="rounded-6"
              icon={
                <IconRenderer
                  icon="FiSearch"
                  size={14}
                  className="text-white"
                />
              }
              iconPosition="left"
              gap="gap-[6px]"
              onClick={handleSearch}
              disabled={!canSearch || isSearching}
            />
          </div>

          {(users.length > 0 || isSearching) && (
            <div className="mt-16 border border-strokegray rounded-6 overflow-hidden">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#F8F8F8]">
                      <th className="text-left px-12 py-8 text-12 font-semibold text-darkgray w-[50px]">
                        Select
                      </th>
                      {userDisplayKeys.map((key) => (
                        <th
                          key={key}
                          className="text-left px-12 py-8 text-12 font-semibold text-darkgray"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isSearching ? (
                      <tr>
                        <td
                          colSpan={userDisplayKeys.length + 1 || 2}
                          className="text-center py-20 text-gray text-13"
                        >
                          <div className="flex items-center justify-center gap-8">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Searching...
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user, idx) => {
                        const userId = String(user.Id ?? user.id ?? idx);
                        const isSelected = selectedUserIds.has(userId);
                        return (
                          <tr
                            key={userId}
                            className={`border-t border-strokegray cursor-pointer hover:bg-[#f9f9ff] ${
                              isSelected ? "bg-[#F5F7FF]" : ""
                            }`}
                            onClick={() => toggleUserSelection(user, idx)}
                          >
                            <td className="px-12 py-8">
                              <IconRenderer
                                icon="FaCheck"
                                size={16}
                                color={isSelected ? "#25B480" : "#59596C"}
                              />
                            </td>
                            {userDisplayKeys.map((key) => (
                              <td
                                key={key}
                                className="px-12 py-8 text-13 text-[#59596C]"
                              >
                                {String(user[key] ?? "")}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-[16px] py-[12px] border-t border-strokegray shrink-0">
          <p className="text-13 text-gray">
            {selectedUserIds.size > 0
              ? `${selectedUserIds.size} user(s) selected`
              : "No users selected"}
          </p>
          <CustomButton
            title={isDownloading ? "Downloading..." : "Download Template"}
            backgroundColor={
              selectedUserIds.size === 0 || isDownloading
                ? "bg-strokegray"
                : "bg-primary"
            }
            textColor={
              selectedUserIds.size === 0 || isDownloading
                ? "text-gray"
                : "text-white"
            }
            height="h-[37px]"
            borderRadius="rounded-6"
            icon={
              <IconRenderer
                icon="LuDownload"
                size={14}
                className={
                  selectedUserIds.size === 0 || isDownloading
                    ? "text-gray"
                    : "text-white"
                }
              />
            }
            iconPosition="left"
            gap="gap-[6px]"
            onClick={handleDownloadTemplate}
            disabled={selectedUserIds.size === 0 || isDownloading}
          />
        </div>
      </div>
    </div>
  );
}
