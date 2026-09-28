import PageLayOut from "../../../../assets/json/pageLayout/pageLayout.json";
import PageValues from "../../../../assets/json/dashboardConfig.json";
import MonthYearPicker from "../../../../shared/components/forms/MonthYearPicker/MonthYearPicker";
import SalesOverview from "./SalesOverview";
import type { BarChartItem } from "../../types/salesIncentive.types";
import SalesSubmissions from "./SalesSubmissions";
import SalesDealer from "./SalesDealer";
import AchievedTeam from "./AchievedTeam";
import TeamSales from "./TeamSales";
import { useAuthStore } from "../../../../app/store/useAuthStore";
import { useCallback, useEffect, useRef } from "react";
import { handleGetDashboard } from "../../../../query/api";
import { parseNestedJson } from "../../../../utils/security/ParseData";
import decrypt from "../../../../utils/security/decrypt";
import { useMutation } from "@tanstack/react-query";
import encrypt from "../../../../utils/security/encrypt";
import { ClientContractId, ClientId } from "../../../../config/env";
import LoaderModal from "../../../../shared/components/ui/LoaderModal/LoaderModal";

export default function Dashboard() {
  const sessionData = useAuthStore((s) => s.sessionData);
  const { mutate: fetchDashboardData, isPending } = useMutation({
    mutationFn: (variables: { payload: any; token: string }) =>
      handleGetDashboard(variables.payload, variables.token),
    onSuccess: (response: any) => {
      if (response?.status === 200) {
        const decryptedData = decrypt(
          response?.data,
          sessionData?.Key,
          sessionData?.Vector,
        );
        const parsedData = parseNestedJson(JSON.parse(decryptedData));
        console.log(parsedData, "parsedData");
      } else {
        console.log("Dashboard Failed - Status:", response?.status, response);
      }
    },
    onError: (error: any) => {
      console.log("Dashboard Error:", error);
    },
  });
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(
    (month: number, year: number) => {
      const enc = (value: any) =>
        encrypt(
          JSON.stringify(value),
          sessionData.Key,
          sessionData.Vector,
        ).replace(/=/gi, "%3D");

      const queryProps = `?month=${enc(month)}&year=${enc(year)}&clientId=${enc(ClientId)}&clientContractId=${enc(ClientContractId)}`;
      fetchDashboardData({
        payload: { queryProps },
        token: sessionData.Token,
      });
    },
    [sessionData, fetchDashboardData],
  );

  useEffect(() => {
    if (initialLoadDone.current) return;
    if (!sessionData?.Key || !sessionData?.Vector || !sessionData?.Token) return;
    initialLoadDone.current = true;
    const now = new Date();
    fetchData(now.getMonth() + 1, now.getFullYear());
  }, [sessionData, fetchData]);

  const handleDateChange = (month: number, year: number) => {
    fetchData(month, year);
  };

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
          <MonthYearPicker onDateChange={handleDateChange} />
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
      <LoaderModal isOpen={isPending} message="Loading dashboard..." />
    </div>
  );
}
