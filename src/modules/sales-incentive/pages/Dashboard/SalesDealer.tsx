import React from "react";
import type {
  chartValues,
  SalesDealerProps,
} from "../../types/salesIncentive.types";
import HorizontalGroupedBarChart from "../../../../shared/components/ui/ComparisonChart/Horizontalgroupedbarchart";
import CustomDropdown from "../../../../shared/components/forms/FormSelect/CustomDropdown";

export default function SalesDealer({
  pageLayOutData,
  labels,
  charData,
}: SalesDealerProps) {
  const filterChartData = charData?.Branches?.find(
    (branch: chartValues[]) => branch?.BranchName == "Vasanth & Co - Chennai",
  );

  const products = filterChartData?.Products;
  return (
    <div className="w-[24.46%] bg-white shadow-card-xl rounded-6 min-h-[441px] px-20 py-14">
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
      </div>
      <div className="flex gap-[15px] mt-[5px]">
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
      <CustomDropdown
        className="my-3"
        options={[]}
        onChange={function (value: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <HorizontalGroupedBarChart data={products} />
    </div>
  );
}
