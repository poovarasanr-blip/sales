import CustomAvatar from "../../../../../shared/components/ui/Avatar/Avatar";
import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import CustomButton from "../../../../../shared/components/ui/Button/CustomButton";
import GroupedIncentiveTable from "../../../../../shared/components/ui/DataTable/CustomTable";
import {
  SALES_MONTHLY_DETAIL_COLUMNS,
  SALES_REGULARIZED_DETAIL_COLUMNS,
  achievementBadgeClass,
} from "../../../config/Salesconfig";
import UsersIcon from "../../../../../assets/icons/Sales/UsersIcon.svg";
import IncentiveIcon from "../../../../../assets/icons/Sales/IncentiveIcon.svg";
import type {
  CategoryGroup,
  SalesAttachment,
  SalesDetailRemarks,
  SalesRecord,
  SalesStatus,
} from "../../../types/salesIncentive.types";

interface SalesRegularizedRowGroup extends CategoryGroup {
  salesCategory: string;
  salesActual: (number | null)[];
  salesRegularized: (number | null)[];
  salesRemarks: SalesDetailRemarks;
  salesOverall: number;
  salesIncentive: number | null;
}

interface SalesMonthlyRowGroup extends CategoryGroup {
  monthlyDate: string;
  monthlyCategory: string;
  monthlyProduct: string;
  monthlyQuantity: number;
  monthlyAttachment: SalesAttachment;
  monthlySubmitted: string;
}

interface SalesDetailProps {
  record: SalesRecord;
  status: SalesStatus;
  onBack: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onAdjustmentChange?: (value: string) => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function SalesDetail({
  record,
  status,
  onBack,
  onApprove,
  onReject,
  onAdjustmentChange,
}: SalesDetailProps) {
  const regularized = record.Details?.RegularizedSales;
  const monthly = record.Details?.MonthlySales;
  const month = formatMonth(record.Manager.SubmittedDate);

  const regularizedGroups: SalesRegularizedRowGroup[] =
    regularized?.Rows.map(
      (row): SalesRegularizedRowGroup => ({
        category: `reg-${row.Id}`,
        employeeCode: record.Employee.EmployeeId,
        employeeName: record.Employee.EmployeeName,
        targetQuantity: row.SalesTarget,
        eligibleIncentive: row.IncentiveAmount ?? 0,
        subCategories: [
          {
            subCategory: "",
            products: row.Products.map((p) => ({
              product: p,
              effectiveDate: "",
            })),
          },
        ],
        salesCategory: row.SalesProductName,
        salesActual: row.ActualSales,
        salesRegularized: row.RegularizedSales,
        salesRemarks: row.Remarks,
        salesOverall: row.OverallRegularizedSales,
        salesIncentive: row.IncentiveAmount,
      }),
    ) ?? [];

  const monthlyGroups: SalesMonthlyRowGroup[] =
    monthly?.Rows.map(
      (row): SalesMonthlyRowGroup => ({
        category: `month-${row.Id}`,
        employeeCode: record.Employee.EmployeeId,
        employeeName: record.Employee.EmployeeName,
        targetQuantity: 0,
        eligibleIncentive: 0,
        subCategories: [
          { subCategory: "", products: [{ product: "", effectiveDate: "" }] },
        ],
        monthlyDate: row.SalesDate,
        monthlyCategory: row.SalesCategoryName,
        monthlyProduct: row.SalesProductName,
        monthlyQuantity: row.SalesQuantity,
        monthlyAttachment: row.Attachment,
        monthlySubmitted: row.SubmittedDate,
      }),
    ) ?? [];

  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isPending = status === "pending";

  const statusDate = record.RejectedDate
    ? record.RejectedDate
    : formatDate(record.Manager.SubmittedDate);

  const remarksText = isApproved
    ? "Approval Remarks: Incentive amount revised based on performance."
    : isRejected
      ? "Rejection Remarks: Attachment not clear"
      : "";

  return (
    <>
      <div className="bg-bgcolor px-h pt-12 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center"
            >
              <IconRenderer
                icon="MdArrowBack"
                size={20}
                className="text-darkgray"
              />
            </button>
            <p className="text-heading-6 text-darkgray">
              Sales /{" "}
              <span className="font-normal">
                {record.Employee.EmployeeName} – {month}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-6 bg-primary text-white px-14 py-6 rounded-6">
            <IconRenderer icon="LuCalendar" size={14} className="text-white" />
            <span className="text-13 font-medium">{month}</span>
          </div>
        </div>
        <div className="border bg-white border-strokegray rounded-6 overflow-hidden">
          {/* Employee Info Card */}
          <div className="bg-white  px-16 py-12 border-b border-strokegray pb-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-14">
                <CustomAvatar
                  backgroundColor="bg-[#5356FF1F]"
                  height="h-[60px]"
                  width="w-[60px]"
                  title={initials(record.Employee.EmployeeName)}
                  textColor="text-primary"
                  borderWidth="border"
                  borderColor="border-[#5356FF66]"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-6">
                    <p className="text-16 font-normal text-darkgray">
                      {record.Employee.EmployeeName}
                    </p>
                    <span className="text-13 text-gray">
                      ({record.Employee.EmployeeId})
                    </span>
                  </div>
                  <p className="text-12 text-gray">
                    Sales Executive • {record.Employee.Dealer}
                  </p>
                  <div className="flex items-center gap-4">
                    <IconRenderer imageUrl={UsersIcon} className="text-gray" />
                    <p className="text-13 font-medium text-gray">
                      Manager: {record.Manager.ManagerName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div
                  className={`flex items-center gap-8 px-14 py-6 rounded-6 bg-mintgreen`}
                >
                  <IconRenderer imageUrl={IncentiveIcon} />
                  <span className={`text-14 font-medium text-darkgray`}>
                    Incentive ₹
                    {record.FinalIncentiveAmount.toLocaleString("en-IN")}
                  </span>
                  {isApproved && (
                    <IconRenderer
                      icon="MdHistory"
                      size={20}
                      className="text-gray"
                    />
                  )}
                </div>
                {isApproved && (
                  <p className="text-11 text-gray">
                    Actual Incentive: ₹
                    {record.ActualIncentiveAmount.toLocaleString("en-IN")} •
                    Adjustment: ₹ {record.AdjustmentAmount > 0 ? "+" : ""}
                    {record.AdjustmentAmount.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
            {!isPending && (
              <div
                className={`mt-14 flex items-center justify-between px-12 rounded-6 h-[40px] ${
                  isApproved ? "bg-[#EAFAF3]" : "bg-[#FFF0F0]"
                }`}
              >
                <p className="text-13 text-gray">{remarksText}</p>
                <div className="flex items-center gap-10">
                  <span className="text-13 text-gray">{statusDate}</span>
                  <div
                    className={`h-[23px] w-[82px] rounded-[4px] border ${!isApproved ? "border-[##FFB7B7]" : "border-[#92D5BD]"} flex items-center justify-center`}
                  >
                    <p
                      className={`text-11 font-normal ${isApproved ? "text-success" : "text-danger"}`}
                    >
                      {isApproved ? "APPROVED" : "REJECTED"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Regularized Sales Section */}
          {regularized && (
            <>
              <div className="flex items-center justify-between mb-10 px-[16px] mt-[12px] mb-[10px]">
                <p className="text-14 font-semibold text-darkgray">
                  {regularized.Title}
                </p>
                <div className="flex items-center gap-12">
                  <span className="text-12 text-gray">Achieved Sales:</span>
                  {regularized.AchievedLegend.map((l) => (
                    <div key={l.Label} className="flex items-center gap-4">
                      <span
                        className="w-[10px] h-[10px] rounded-2 inline-block"
                        style={{ backgroundColor: l.Color }}
                      />
                      <span className="text-11 text-gray">{l.Label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-6 shadow-card-xl mb-20 overflow-hidden mx-[15px]">
                {/* Adjustment Summary Row (Pending only) */}
                {isPending && (
                  <div className="flex items-center bg-midbluebg rounded-6 h-[59px] mx-[15px] px-14 mt-16 mb-[4px] justify-between">
                    <div className="flex items-center gap-8">
                      <span className="text-14 text-darkgray">
                        Actual Incentive
                      </span>
                      <span className="text-14 text-darkgray">
                        ₹{record.ActualIncentiveAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex gap-[12px] items-center">
                      <div className="flex items-center gap-8">
                        <span className="text-14 text-gray">Adjustment</span>
                        <div className="flex items-center border border-strokegray rounded-4 h-[39px] w-[152px] overflow-hidden bg-white">
                          <span className="text-13 text-gray pl-8 pr-2">₹</span>
                          <input
                            type="text"
                            value={String(record.AdjustmentAmount)}
                            onChange={(e) =>
                              onAdjustmentChange?.(e.target.value)
                            }
                            className="w-[60px] h-full text-13 text-darkgray outline-none border-none bg-transparent pr-8"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="text-16 text-secondary">
                          Final Incentive
                        </span>
                        <span className="text-16 font-medium text-secondary">
                          ₹{record.FinalIncentiveAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <GroupedIncentiveTable
                  columns={SALES_REGULARIZED_DETAIL_COLUMNS}
                  data={regularizedGroups}
                  emptyMessage="No regularized sales for this record."
                  showVerticalLines={true}
                  renderCustomCell={(column, category) => {
                    const cat = category as SalesRegularizedRowGroup;
                    switch (column.key) {
                      case "salesCategory":
                        return cat.salesCategory;
                      case "salesProducts":
                        return (
                          <div className="grouped-table__stack">
                            {cat.subCategories[0]?.products.map((p, i) => (
                              <div key={`${p.product}-${i}`}>{p.product}</div>
                            ))}
                          </div>
                        );
                      case "salesTarget":
                        return cat.targetQuantity;
                      case "salesActual":
                        return (
                          <div className="flex flex-col items-center">
                            {cat.salesActual.map((v, i) => (
                              <div key={i} className="text-13 leading-20">
                                {v == null ? "--" : v}
                              </div>
                            ))}
                          </div>
                        );
                      case "salesRegularized":
                        return (
                          <div className="flex flex-col items-center">
                            {cat.salesRegularized.map((v, i) => (
                              <div key={i} className="text-13 leading-20">
                                {v == null ? "--" : v}
                              </div>
                            ))}
                          </div>
                        );
                      case "salesRemarks":
                        return cat.salesRemarks?.HasAttachment ? (
                          <div className="flex items-center justify-center gap-14">
                            <IconRenderer
                              icon="LuPaperclip"
                              size={14}
                              className="text-gray"
                            />
                            {cat.salesRemarks.HasDocument && (
                              <IconRenderer
                                icon="FaRegFile"
                                size={14}
                                className="text-gray"
                              />
                            )}
                          </div>
                        ) : (
                          "--"
                        );
                      case "salesOverall": {
                        const target = Number(cat.targetQuantity);
                        const pct =
                          target > 0 ? (cat.salesOverall / target) * 100 : 0;
                        const badgeClass = achievementBadgeClass(pct);
                        return (
                          <div className="flex items-center justify-center">
                            <span
                              className={`inline-flex items-center justify-center w-[22px] h-[23px] px-6 rounded-2 text-12 ${
                                badgeClass || "text-gray"
                              }`}
                            >
                              {cat.salesOverall}
                            </span>
                          </div>
                        );
                      }
                      case "salesIncentive":
                        return cat.salesIncentive != null
                          ? `₹ ${cat.salesIncentive.toLocaleString("en-IN")}`
                          : "--";
                      default:
                        return undefined;
                    }
                  }}
                />
              </div>
            </>
          )}

          {/* Monthly Sales Section */}
          {monthly && (
            <>
              <p className="text-14 font-semibold text-darkgray mb-[2px] mx-[15px]">
                {monthly.Title}
              </p>
              <div className="bg-white mb-16  mx-[15px]">
                <GroupedIncentiveTable
                  columns={SALES_MONTHLY_DETAIL_COLUMNS}
                  data={monthlyGroups}
                  emptyMessage="No sales files for this record."
                  showVerticalLines={true}
                  pagination={monthlyGroups.length > 10}
                  pageSize={10}
                  renderCustomCell={(column, category) => {
                    const row = category as SalesMonthlyRowGroup;
                    switch (column.key) {
                      case "monthlyDate":
                        return formatDayMonth(row.monthlyDate);
                      case "monthlyCategory":
                        return row.monthlyCategory;
                      case "monthlyProduct":
                        return row.monthlyProduct;
                      case "monthlyQuantity":
                        return row.monthlyQuantity;
                      case "monthlyAttachment":
                        return row.monthlyAttachment?.IsAvailable ? (
                          <span className="text-gray text-13 flex items-center justify-center gap-4 cursor-pointer">
                            <IconRenderer icon="FaRegFile" size={14} />
                            {row.monthlyAttachment.Label}
                          </span>
                        ) : (
                          <span className="text-gray text-13">--</span>
                        );
                      case "monthlySubmitted":
                        return formatDate(row.monthlySubmitted);
                      default:
                        return undefined;
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {/* Bottom Action Bar (Pending only) */}
      {isPending && (
        <div className="sticky bottom-0 -mx-h mt-4 z-50">
          <div className="flex items-center justify-end gap-12 h-[54px] border-t border-strokegray bg-white px-h">
            <CustomButton
              title="Reject"
              backgroundColor="bg-white"
              textColor="text-danger"
              borderColor="border-danger"
              borderWidth="border-1"
              gap="gap-[8px]"
              height="h-[34px]"
              width="w-[85px]"
              icon={
                <IconRenderer
                  icon="FaRegTimesCircle"
                  size={14}
                  className="text-danger"
                />
              }
              iconPosition="left"
              onClick={onReject}
            />
            <CustomButton
              title="Approve"
              backgroundColor="bg-success"
              textColor="text-white"
              gap="gap-[8px]"
              height="h-[34px]"
              width="w-[125px]"
              icon={
                <IconRenderer
                  icon="LuCircleCheckBig"
                  size={14}
                  className="text-white"
                />
              }
              iconPosition="left"
              onClick={onApprove}
            />
          </div>
        </div>
      )}
    </>
  );
}
