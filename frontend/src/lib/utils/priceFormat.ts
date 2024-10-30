export const convertToCents = (price: number | undefined): number => {
  return Math.round((price || 0) * 100);
};

export const convertToDecimal = (value: string): string => {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return "";
  return (numericValue / 100).toFixed(2);
};
