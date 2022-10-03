import _, { ListIterateeCustom, ObjectIterateeCustom } from "lodash";

type ICount = {
  <T>(arr: T[] | null | undefined, countIf: ListIterateeCustom<T, boolean>): number;
  <T extends object>(obj: T | null | undefined, countIf: ObjectIterateeCustom<T, boolean>): number;
};

export const count: ICount = (coll: any, countIf: any) => {
  return _.reduce(coll, (agg, value, keyIndex, c) => {
    return countIf(value, keyIndex, c) ? agg + 1 : agg;
  }, 0);
};
