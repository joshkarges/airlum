export const oxfordCommaList = <T,>(arr: T[]): string => {
  let result = arr.slice(0, -1).join(', ');
  if (arr.length > 2) result += ',';
  if (arr.length > 1) result += ' and ';
  if (arr.length > 0) result += arr[arr.length - 1];
  return result;
};