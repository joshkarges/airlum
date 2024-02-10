import _ from "lodash";
import {
  find,
  generateBidrectionalMatches,
  generateLoopMatches,
  generateMatches,
  union,
} from "./matches";

const areValidMatches = (matches: number[], twoWaysAllowed = false) => {
  // Make sure that no element matches[i] is equal to i
  const parents = _.invert(matches);
  for (let i = 0; i < matches.length; i++) {
    if (matches[i] === i || (!twoWaysAllowed && matches[i] === +parents[i])) {
      return false;
    }
  }
  return true;
};

describe("generateMatches", () => {
  it("should fail to generate matches for 1 or 2 participants.", () => {
    // Test case 3
    const result1 = generateMatches(1);
    console.log(result1);
    const areValid1 = areValidMatches(result1);
    expect(areValid1).toBe(false);

    // Test case 4
    const result2 = generateMatches(2);
    console.log(result2);
    const areValid2 = areValidMatches(result2);
    expect(areValid2).toBe(false);
  });

  it("should return an array of matches where there are no bidrectional matches and no self-matches", () => {
    // Test case 1
    const result3 = generateMatches(3);
    console.log(result3);
    const areValid3 = areValidMatches(result3);
    expect(areValid3).toBe(true);

    // Test case 2
    const result4 = generateMatches(5);
    console.log(result4);
    const areValid4 = areValidMatches(result4);
    expect(areValid4).toBe(true);

    // Test case 3
    const result5 = generateMatches(10);
    console.log(result5);
    const areValid5 = areValidMatches(result5);
    expect(areValid5).toBe(true);
  });

  it("should return an array of matches where there are no self-matches, but bidirectional matches are allowed", () => {
    // Test case 1
    const result1 = generateMatches(2, true);
    console.log(result1);
    const areValid1 = areValidMatches(result1, true);
    expect(areValid1).toBe(true);

    // Test case 2
    const result2 = generateMatches(3, true);
    console.log(result2);
    const areValid2 = areValidMatches(result2, true);
    expect(areValid2).toBe(true);

    // Test case 3
    const result3 = generateMatches(5, true);
    console.log(result3);
    const areValid3 = areValidMatches(result3, true);
    expect(areValid3).toBe(true);

    // Test case 4
    const result4 = generateMatches(10, true);
    console.log(result4);
    const areValid4 = areValidMatches(result4, true);
    expect(areValid4).toBe(true);
  });
});

const isValidLoop = (loop: number[]) => {
  const elementMap = loop.map((val, index) => ({ root: index, rank: 1 }));
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
    // Test case 1
    const result1 = generateLoopMatches(1);
    console.log(result1);
    const isValid1 = isValidLoop(result1);
    expect(isValid1).toBe(true);

    // Test case 2
    const result2 = generateLoopMatches(3);
    console.log(result2);
    const isValid2 = isValidLoop(result2);
    expect(isValid2).toBe(true);

    // Test case 3
    const result3 = generateLoopMatches(5);
    console.log(result3);
    const isValid3 = isValidLoop(result3);
    expect(isValid3).toBe(true);

    // Test case 4
    const result4 = generateLoopMatches(10);
    console.log(result4);
    const isValid4 = isValidLoop(result4);
    expect(isValid4).toBe(true);
  });
});

// const areValidBidirectionalMatches = (matches: number[]) => {};

// describe("generateBidrectionalMatches", () => {
//   it("should return an array of matches where every match is a bidirectional match", () => {
//     // Test case 1
//     const result1 = generateBidrectionalMatches(3);
//     console.log(result1);
//     const areValid1 = areValidBidirectionalMatches(result1, true);
//     expect(areValid1).toBe(true);

//     // Test case 2
//     const result2 = generateBidrectionalMatches(5);
//     console.log(result2);
//     const areValid2 = areValidBidirectionalMatches(result2, true);
//     expect(areValid2).toBe(true);

//     // Test case 3
//     const result3 = generateBidrectionalMatches(10);
//     console.log(result3);
//     const areValid3 = areValidBidirectionalMatches(result3, true);
//     expect(areValid3).toBe(true);
//   });
// });
