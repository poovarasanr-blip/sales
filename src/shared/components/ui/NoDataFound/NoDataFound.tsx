import React from "react";
import IconRenderer from "../IconRender/IconRenderer";
import NoDataFoundIcon from "../../../../assets/icons/NodataFound/NodataFoundIcon.svg";
import type { NodataFoundProps } from "../../../../modules/sales-incentive/types/salesIncentive.types";

export default function NoDataFound({
  description = "Let’s add product using the bulk upload option",
  title = "Looks like empty",
}: NodataFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <IconRenderer imageUrl={NoDataFoundIcon} />
      <div className="flex flex-col gap-2 items-center justify-center mt-3">
        <p className="p-bold text-darkgray">{title}</p>
        <p className="p-tiny text-gray">{description}</p>
      </div>
    </div>
  );
}
