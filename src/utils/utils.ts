export const oxfordCommaList = <T>(arr: T[]): string => {
  let result = arr.slice(0, -1).join(", ");
  if (arr.length > 2) result += ",";
  if (arr.length > 1) result += " and ";
  if (arr.length > 0) result += arr[arr.length - 1];
  return result;
};

export const validateEmail = (email: string) => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email
  );
};
