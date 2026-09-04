import React from "react";
import type {
  CategoryGroup,
  GroupedTableColumn,
  TeamSalesProps,
} from "../../types/salesIncentive.types";
import CustomDropdown from "../../../../shared/components/forms/FormSelect/CustomDropdown";
import GroupedIncentiveTable from "../../../../shared/components/ui/DataTable/CustomTable";

export default function TeamSales({ pageLayOutData, labels }: TeamSalesProps) {
  const columns: GroupedTableColumn[] = [
    {
      key: "category",
      label: "Category ",
      width: "60%",
      testSize: 13,
      fontWeight: 500,
      color: "#31314D",
    },
    {
      key: "subCategory",
      label: "Target",
      filterable: "text",
      width: "18%",
      alineItem: "center",
      align: "center",
    },
    {
      key: "product",
      label: "Achieved",
      filterable: "text",
      width: "24%",
      alineItem: "center",
      align: "center",
    },
    {
      key: "effectiveDate",
      label: "Actual",
      filterable: "date",
      width: "14%",
      alineItem: "center",
      align: "center",
    },
  ];
  const data: CategoryGroup[] = [
    {
      category: "Mixer Grinders",
      targetQuantity: 200,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Microwave Ovens",
      targetQuantity: 400,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
    {
      category: "Rice Cookers",
      targetQuantity: 19,
      eligibleIncentive: 600,
      subCategories: [
        {
          subCategory: "45",
          products: [{ product: "38", effectiveDate: "38" }],
        },
      ],
    },
  ];

  return (
    <div className="w-[40.29%] bg-white shadow-card-xl rounded-6 min-h-[441px] px-20 py-14">
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
        <div>
          <CustomDropdown
            iconSize={18}
            upArrow="IoMdArrowDropup"
            downArrow="IoMdArrowDropdown"
            borderWidth="border-0"
            // className="my-2"
            options={[]}
            onChange={function (value: string): void {
              throw new Error("Function not implemented.");
            }}
          />
        </div>
      </div>
      <div className="h-[359px]">
        <GroupedIncentiveTable
          columns={columns}
          data={data}
          showVerticalLines={true}
        />
      </div>
      <div className="flex items-center justify-center gap-5 mt-3">
        {labels?.map((item) => {
          return (
            <div className="flex gap-2 items-center">
              <div
                className="w-10 h-10 rounded-2"
                style={{ backgroundColor: item?.color }}
              />
              <p className="text-11 font-normal text-gray">{item?.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
