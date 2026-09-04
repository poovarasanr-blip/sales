import React from "react";
import type { SalesTopAchievedProps } from "../../types/salesIncentive.types";
import CustomPieChart from "../../../../shared/components/ui/ComparisonChart/CustomPieChart";
import { formatCurrency } from "../../../../shared/utils/currencyUtils";

export default function AchievedTeam({
  pageLayOutData,
  data = [],
  TotalAchievement = 0,
  TotalEmployees = 0,
}: SalesTopAchievedProps) {
  const chartData = data?.map((item) => ({
    label: item?.EmployeeName ?? "",
    value: item?.Amount ?? 0,
    color: item?.Color ?? "#8884d8",
  }));

  return (
    <div className="w-[33.24%] bg-white shadow-card-xl rounded-6 min-h-[441px] px-20 py-14">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-darkgray p-bold">{pageLayOutData?.Title}</p>
          <div className="w-4 h-4 rounded-full bg-litegray" />
          <p className="text-darkgray p-bold">{pageLayOutData?.Date}</p>
        </div>
      </div>
      <div className="flex justify-between items-center my-20">
        <CustomPieChart data={chartData} size={146} total={125383} />
        <div className="min-w-[45%] flex flex-col items-center justify-center mx-auto text-center">
          <p className="text-darkgray text-18 font-semibold">
            {formatCurrency(TotalAchievement)}
          </p>
          <p className="text-gray text-11 font-normal">
            {TotalEmployees} employee(s) achieved
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-[12px] p-4">
        {data?.map((item) => (
          <div key={item.EmployeeId} className="flex items-center gap-2.5">
            <span
              className="mt-1 h-12 w-12 rounded-3"
              style={{ backgroundColor: item.Color }}
            />
            <div>
              <p className="p-tiny-bold font-medium text-darkgray">
                {item.EmployeeName}
              </p>
              <p className="text-11 font-normal text-gray">
                ₹{item?.Amount?.toLocaleString("en-IN")} – {item.Employees}{" "}
                employee(s)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
