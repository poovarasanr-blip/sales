import React from "react";
import type { SalesSubmissionsProps } from "../../types/salesIncentive.types";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";

export default function SalesSubmissions({
  pageLayOutData,
  pageData,
}: SalesSubmissionsProps) {
  return (
    <div className="w-[27%] bg-white shadow-card-xl rounded-6 h-[347px] px-20 py-14">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-darkgray p-bold">{pageLayOutData?.Title}</p>
          <p className="text-litegray p-tiny-bold">{pageLayOutData?.Date}</p>
        </div>
        <IconRenderer
          icon={pageLayOutData?.Icon}
          size={20}
          className="text-gray"
        />
      </div>
      <div>
        {pageData?.map((item) => (
          <div
            className="h-[57px] w-full rounded-6 px-12 py-10 flex justify-between items-center mt-12"
            style={{ backgroundColor: item?.BackgroundColor }}
          >
            <div>
              <p
                className="text-18 font-semibold"
                style={{ color: item?.TextColor }}
              >
                {item?.Value}
              </p>
              <p className="p-tiny" style={{ color: item?.TextColor }}>
                {item?.Name}
              </p>
            </div>
            <IconRenderer icon={item?.Icon} size={24} color={item?.TextColor} />
          </div>
        ))}
      </div>
    </div>
  );
}
