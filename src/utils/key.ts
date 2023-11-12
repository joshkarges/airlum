import { UUID } from "mongodb";

export const generateKey = () => {
  return new UUID().toString();
};