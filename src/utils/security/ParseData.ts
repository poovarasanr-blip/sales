export const parseNestedJson = (value: any): any => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parseNestedJson(parsed);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    return value.map(parseNestedJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, parseNestedJson(val)]),
    );
  }
  return value;
};
