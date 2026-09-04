export const formatCurrency = (value: number | string): string => {
  return `₹${Number(value).toLocaleString("en-US")}`;
};
