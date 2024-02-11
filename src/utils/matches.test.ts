import _ from "lodash";
import {
  find,
  generateBidrectionalMatches,
  generateLoopMatches,
  generateMatches,
  union,
} from "./matches";

const debug = false;

const oldConsoleLog = console.log;
console.log = (...args: any[]) => {
  if (debug) {
    oldConsoleLog(...args);
  }
};

const areValidMatches = (matches: number[]) => {
  const zeroToN = _.range(matches.length);
  const uniqueMatches = _.uniq(matches);
  // All elements should be numeric, unique, and contain all integers starting from 0.
  const isNumeric = uniqueMatches.every((val) => !isNaN(val));
  const isUniqueAndContinuous = _.isEqual(uniqueMatches.sort(), zeroToN);
  // The indices should be continuous starting at 0.
  const indicesAreContinuous = _.isEqual(_.keys(matches).map(Number), zeroToN);
  // No element should be equal to its index.
  const noSelfMatches = matches.every((val, index) => val !== index);
  return (
    isNumeric && isUniqueAndContinuous && indicesAreContinuous && noSelfMatches
  );
};

const noSelfOrTwoWayMatches = (matches: number[], twoWaysAllowed = false) => {
  if (!areValidMatches(matches)) {
    return false;
  }
  if (twoWaysAllowed) return true;
  // Make sure that no element matches[i] is equal to i
  const parents = _.invert(matches);
  for (let i = 0; i < matches.length; i++) {
    if (matches[i] === +parents[i]) {
      return false;
    }
  }
  return true;
};

const repeatTest = (
  testName: string,
  numRepeat: number,
  fn: () => any,
  assertFn: (result: any) => void
) => {
  for (let i = 0; i < numRepeat; i++) {
    let result;
    try {
      result = fn();
      assertFn(result);
    } catch (e) {
      console.log(testName, e, result);
      throw e;
    }
  }
};

describe("generateMatches", () => {
  it("should fail to generate matches for 1 or 2 participants.", () => {
    // Test case 1
    const result1 = generateMatches(1);
    console.log("test1", result1);
    const areValid1 = noSelfOrTwoWayMatches(result1);
    expect(areValid1).toBe(false);

    // Test case 2
    const result2 = generateMatches(2);
    console.log("test2", result2);
    const areValid2 = noSelfOrTwoWayMatches(result2);
    expect(areValid2).toBe(false);
  });

  it("should return an array of matches where there are no bidrectional matches and no self-matches", () => {
    repeatTest(
      "test3",
      10,
      () => {
        const result = generateMatches(3);
        return noSelfOrTwoWayMatches(result);
      },
      (result) => expect(result).toBe(true)
    );

    // Test case 2
    repeatTest(
      "test4",
      10,
      () => {
        const result4 = generateMatches(5);
        return noSelfOrTwoWayMatches(result4);
      },
      (result) => expect(result).toBe(true)
    );

    // Test case 3
    repeatTest(
      "test5",
      10,
      () => {
        const result5 = generateMatches(10);
        return noSelfOrTwoWayMatches(result5);
      },
      (result) => expect(result).toBe(true)
    );
  });

  it("should return an array of matches where there are no self-matches, but bidirectional matches are allowed", () => {
    repeatTest(
      "test6",
      10,
      () => {
        const result = generateMatches(2, true);
        return noSelfOrTwoWayMatches(result, true);
      },
      (result) => expect(result).toBe(true)
    );

    repeatTest(
      "test7",
      10,
      () => {
        const result = generateMatches(3, true);
        return noSelfOrTwoWayMatches(result, true);
      },
      (result) => expect(result).toBe(true)
    );

    repeatTest(
      "test8",
      10,
      () => {
        const result = generateMatches(5, true);
        return noSelfOrTwoWayMatches(result, true);
      },
      (result) => expect(result).toBe(true)
    );

    repeatTest(
      "test9",
      10,
      () => {
        const result = generateMatches(10, true);
        return noSelfOrTwoWayMatches(result, true);
      },
      (result) => expect(result).toBe(true)
    );
  });
});

const isValidLoop = (loop: number[]) => {
  if (!areValidMatches(loop)) {
    return false;
  }
  const elementMap = loop.map((val, index) => ({
    root: index,
    rank: 1,
    size: 1,
  }));
  for (let i = 0; i < loop.length; i++) {
    union(i, loop[i], elementMap);
  }
  for (let i = 1; i < loop.length; i++) {
    if (find(i, elementMap) !== find(0, elementMap)) {
      return false;
    }
  }
  return true;
};

describe("generateLoopMatches", () => {
  it("should return an array of matches where there is only 1 loop", () => {
    const result1 = generateLoopMatches(1);
    console.log("test11", result1);
    const isValid1 = isValidLoop(result1);
    expect(isValid1).toBe(false);

    const result2 = generateLoopMatches(2);
    console.log("test12", result2);
    const isValid2 = isValidLoop(result2);
    expect(isValid2).toBe(true);

    repeatTest(
      "test13",
      10,
      () => {
        const result = generateLoopMatches(3);
        return isValidLoop(result);
      },
      (result) => expect(result).toBe(true)
    );

    repeatTest(
      "test14",
      10,
      () => {
        const result = generateLoopMatches(5);
        return isValidLoop(result);
      },
      (result) => expect(result).toBe(true)
    );

    repeatTest(
      "test15",
      10,
      () => {
        const result = generateLoopMatches(10);
        return isValidLoop(result);
      },
      (result) => expect(result).toBe(true)
    );
  });
});

const areValidBidirectionalMatches = (matches: number[]) => {
  if (!areValidMatches(matches)) {
    return false;
  }
  const elementMap = matches.map((val, index) => ({
    root: index,
    rank: 1,
    size: 1,
  }));
  for (let i = 0; i < matches.length; i++) {
    union(i, matches[i], elementMap);
  }
  const rootCounts = {} as Record<number, number>;
  let hasATriplet = false;
  for (let i = 0; i < matches.length; i++) {
    const root = find(i, elementMap);
    const rootCount = (rootCounts[root] || 0) + 1;
    rootCounts[root] = rootCount;
    if (rootCount > 2) {
      if (hasATriplet) {
        console.log("Triplet found", root, matches, rootCounts, elementMap);
        return false;
      }
      hasATriplet = true;
    }
    if (root === i && elementMap[i].rank < 2) {
      console.log("Rank less than 2", root, matches, rootCounts, elementMap);
      return false;
    }
  }
  return true;
};

describe("generateBidrectionalMatches", () => {
  it("should validate the bidirectional validation function", () => {
    const result1 = areValidBidirectionalMatches([1, 0]);
    expect(result1).toBe(true);

    const result2 = areValidBidirectionalMatches([1, 0, 2]);
    expect(result2).toBe(false);

    const result3 = areValidBidirectionalMatches([1, 2, 0]);
    expect(result3).toBe(true);

    const result4 = areValidBidirectionalMatches([1, 0, 3, 2]);
    expect(result4).toBe(true);
  });

  it("should return an array of matches where every match is a bidirectional match", () => {
    repeatTest(
      "test16",
      10,
      () => {
        const result = generateBidrectionalMatches(3);
        return areValidBidirectionalMatches(result);
      },
      (result) => expect(result).toBe(true)
    );

    repeatTest(
      "test17",
      10,
      () => {
        const result = generateBidrectionalMatches(5);
        return areValidBidirectionalMatches(result);
      },
      (result) => expect(result).toBe(true)
    );

    repeatTest(
      "test18",
      10,
      () => {
        const result = generateBidrectionalMatches(10);
        return areValidBidirectionalMatches(result);
      },
      (result) => expect(result).toBe(true)
    );
  });
});
