import React, { useState } from "react";
import Select from "react-dropdown-select";

interface Option {
  id: number;
  name: string;
}

interface CustomDropdownProps {
  value?: string;
}

const CustomDatePicker: React.FC<CustomDropdownProps> = ({ value }) => {
  const options: Option[] = [
    {
      id: 1,
      name: "Leanne Graham",
    },
    {
      id: 2,
      name: "Ervin Howell",
    },
  ];

  const [selectedValues, setSelectedValues] = useState<Option[]>([]);

  return (
    <div className="flex flex-col gap-2">
      {/* <Select
        options={options}
        labelField="name"
        valueField="id"
        values={selectedValues}
        onChange={(values) => setSelectedValues(values as Option[])}
      /> */}
    </div>
  );
};

export default CustomDatePicker;
