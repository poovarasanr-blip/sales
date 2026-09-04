import PageLayOut from "../../../../assets/json/pageLayout/pageLayout.json";
import PageValues from "../../../../assets/json/dashboardConfig.json";
import CustomButton from "../../../../shared/components/ui/Button/CustomButton";
import IconRenderer from "../../../../shared/components/ui/IconRender/IconRenderer";
import SalesOverview from "./SalesOverview";
import type { BarChartItem } from "../../types/salesIncentive.types";
import SalesSubmissions from "./SalesSubmissions";
import SalesDealer from "./SalesDealer";
import AchievedTeam from "./AchievedTeam";
import TeamSales from "./TeamSales";

export default function Dashboard() {
  const chartData: BarChartItem[] =
    PageValues?.SalesOverview?.Data?.Values?.map((item) => ({
      label: item.label,
      values: item.Values,
    })) ?? [];

  return (
    <div className="px-h pt-12 overflow-scroll scrollbar-hide bg-bgcolor">
      <div className="flex items-center justify-between">
        <p className="text-heading-6 text-darkgray">
          {PageLayOut?.Dashboard?.PageTitle}
        </p>
        {PageLayOut?.Dashboard?.IsDateRequired && (
          <CustomButton
            backgroundColor="bg-primary"
            height="h-34"
            width="w-[112px]"
            gap="gap-10"
            title="May 2025"
            borderRadius="rounded-6"
            icon={
              <IconRenderer
                icon="LuCalendar"
                size={18}
                className="text-white"
              />
            }
            iconPosition="right"
          />
        )}
      </div>
      <div className="flex justify-between mt-16 col-span-9">
        {PageLayOut?.Dashboard?.IsSalesOverviewRequired && (
          <SalesOverview
            data={chartData}
            labels={PageValues?.SalesOverview?.Labels}
            pageLayOutData={{
              DescriptionText: PageValues?.SalesOverview?.DescriptionText,
              Date: PageValues?.SalesOverview?.Date,
              Title: PageValues?.SalesOverview?.Title,
            }}
          />
        )}
        {PageLayOut?.Dashboard?.IsSalesSubmissionsRequired && (
          <SalesSubmissions
            pageLayOutData={{
              Date: PageValues?.SalesSubmissions?.Date,
              Title: PageValues?.SalesSubmissions?.Title,
              Icon: PageValues?.SalesSubmissions?.Icon,
            }}
            pageData={PageValues?.SalesSubmissions?.Data}
          />
        )}
      </div>
      <div className="flex my-16 justify-between">
        {PageLayOut?.Dashboard?.IsSalesDealerRequired && (
          <SalesDealer
            pageLayOutData={{
              Date: PageValues?.SalesDealer?.Date,
              Title: PageValues?.SalesDealer?.Title,
              DescriptionText: PageValues?.SalesDealer?.DescriptionText,
            }}
            labels={PageValues?.SalesDealer?.Labels}
            charData={PageValues?.SalesDealer?.ChartData}
          />
        )}
        {PageLayOut?.Dashboard?.IsTeamSalesRequired && (
          <TeamSales
            pageLayOutData={{
              Date: PageValues?.TeamSales?.Date,
              Title: PageValues?.TeamSales?.Title,
              DescriptionText: PageValues?.SalesDealer?.DescriptionText,
            }}
            labels={PageValues?.TeamSales?.Legend}
          />
        )}
        {PageLayOut?.Dashboard?.IsTopAchievedTeamRequired && (
          <AchievedTeam
            pageLayOutData={{
              Date: PageValues?.TopAchievedTeam?.Date,
              Title: PageValues?.TopAchievedTeam?.Title,
            }}
            data={PageValues?.TopAchievedTeam?.ChartData}
            TotalAchievement={PageValues?.TopAchievedTeam?.TotalAchievement}
            TotalEmployees={PageValues?.TopAchievedTeam?.TotalEmployees}
          />
        )}
      </div>
    </div>
  );
}
