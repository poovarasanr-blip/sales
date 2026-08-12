import CustomBarChart from "../../../../shared/components/ui/ComparisonBarChart/CustomChart";

export default function Dashboard() {
  return (
    <div className="w-[785px] p-10">
      <CustomBarChart showXAxis={true} />
    </div>
  );
}
