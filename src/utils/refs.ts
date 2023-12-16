import _ from "lodash";
import { MutableRefObject } from "react";

const isMutableRefObject = <T>(thing: any): thing is MutableRefObject<T> =>
  _.isPlainObject(thing) && "current" in thing;

/**
 * Merge multiple refs into a single ref.
 * https://www.davedrinks.coffee/how-do-i-use-two-react-refs/
 *
 * @param ...refs Multiple refs to be merged.
 */
export const mergeRefs = <T>(...refs: React.Ref<T>[]) => {
  if (refs.length === 1) return refs[0];

  return (inst: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(inst);
      } else if (isMutableRefObject<T>(ref)) {
        ref.current = inst;
      }
    }
  };
};
