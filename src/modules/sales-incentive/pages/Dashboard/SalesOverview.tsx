import React from "react";
import type { SalesOverviewProps } from "../../types/salesIncentive.types";
import CustomBarChart from "../../../../shared/components/ui/ComparisonChart/CustomBarChart";

export default function SalesOverview({
  pageLayOutData,
  labels,
  data,
}: SalesOverviewProps) {
  return (
    <div className="w-[71%] bg-white shadow-card-xl rounded-6 h-[347px] px-20 py-14">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <p className="text-darkgray p-bold">{pageLayOutData?.Title}</p>
            <div className="w-4 h-4 rounded-full bg-litegray" />
            <p className="text-darkgray p-bold">{pageLayOutData?.Date}</p>
          </div>
          <p className="p-small text-litegray mt-2">
            {pageLayOutData?.DescriptionText}
          </p>
        </div>
        <div className="flex gap-[15px]">
          {labels?.map((item) => (
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-1"
                style={{ backgroundColor: item?.color }}
              />
              <p className="p-tiny-bold text-gray ml-[5px]">{item?.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full mt-14">
        <CustomBarChart showXAxis={true} data={data} height={265} />
      </div>
    </div>
  );
}
