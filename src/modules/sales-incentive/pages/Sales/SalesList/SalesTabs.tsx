import IconRenderer from "../../../../../shared/components/ui/IconRender/IconRenderer";
import type { SalesTabIdLocal } from "../../../config/Salesconfig";

interface SalesTab {
  id: SalesTabIdLocal;
  label: string;
  icon: string;
}

interface SalesTabsProps {
  tabs: SalesTab[];
  active: SalesTabIdLocal;
  onChange: (tab: SalesTabIdLocal) => void;
  counts: Record<SalesTabIdLocal, number>;
}

/**
 * Sales-only tab strip (Pending/Approved/Rejected). Nothing like this exists
 * as a shared component yet, so it lives here rather than being bolted onto
 * a shared component that every other screen would then inherit.
 */
export default function SalesTabs({
  tabs,
  active,
  onChange,
  counts,
}: SalesTabsProps) {
  return (
    <div className="flex items-center gap-8">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-6 px-16 py-10 text-13 font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-gray hover:text-darkgray"
            }`}
          >
            <IconRenderer
              icon={tab.icon}
              size={16}
              className={isActive ? "text-primary" : "text-gray"}
            />
            {tab.label}
            <span
              className={`text-14${
                isActive ? "bg-white text-primary" : "bg-white text-gray"
              }`}
            >
              ({counts[tab.id]})
            </span>
          </button>
        );
      })}
    </div>
  );
}
