import _ from "lodash";

/**
 * Returns the number of matching consecutive characters between t and p, and
 * the length of the shortest matching consecutive character sequence.
 * @param t string
 * @param p string
 * @returns [
 *   number of matching consecutive characters,
 *   length of shortest matching consecutive character sequence
 * ]
 */
export const matchingConsecutiveCharacters = (t: string, p: string) => {
  if (!t || !p) return [0, 0];
  const M = Array.from(Array(t.length), () =>
    Array.from(Array(p.length), () => 0)
  );

  // M[r][c] is the number of matching consecutive characters between t[0:r] and p[0:c]
  // e.g. t='adc', p='acd', M[2][2] = 2 means that t[0:2] and p[0:2] have 2 matching consecutive characters.
  // ad->a_d and a_c->ac are the matching consecutive character sequences, each with 2 characters.
  for (let r = 0; r < t.length; r++) {
    for (let c = 0; c < p.length; c++) {
      M[r][c] = Math.max(_.get(M, [r - 1, c], 0), _.get(M, [r, c - 1], 0));
      if (t[r] === p[c]) {
        M[r][c] = Math.max(M[r][c], _.get(M, [r - 1, c - 1], 0) + 1);
      }
    }
  }

  const maxNumMatchingChars = M[t.length - 1][p.length - 1];

  // If there's only one matching character, there's only one character in the path. Same for zero.
  if (maxNumMatchingChars <= 1)
    return [maxNumMatchingChars, maxNumMatchingChars];

  /**
   * Find the shortest length of all the consecutive matching character
   * sequences with the maximum number of matches. e.g. t='acd' and p='adac'.
   * There are 2 consecutive matching character sequences with 2 matches:
   * ad->a_d, a__c->ac, and ac->ac The sequence with the shortest length in both
   * t and p is ac->ac with a length of 2.
   *
   * Let's walk through the example
   * The matrix of matching characters (B) would be
   *   a d a c
   * a 1 0 1 0 <- The ac->ac sequence follows these two 1s
   * c 0 0 0 1 <-
   * d 0 1 0 0
   *
   * The matrix of matching consecutive characters (M) would be
   *   a d a c
   * a 1 1 1 1
   * c 1 1 1 2
   * d 1 2 2 2
   *
   * To find the shortest sequence we'll start at all the 'end' nodes where M is
   * 2 (the maximum number of matches), and B is 1 (a matching character). We'll
   * put them in a queue so we can iterate through them and any future children
   * in a breadth-first manner. We'll also start keeping track of the bounding
   * boxes of the sequences we've found so far.  The length of the sequence is
   * the biggest dimension of the bounding box.
   * 1. Open the first node in the queue.
   * 2. Determine which child nodes to explore a. If B is 1 and M is 1, we've
   *    found the beginning of a sequence and we don't need to explore any
   *    children. b. If B is 1, your only child is at the coordinate diagonally
   *    up-left.  The sequence could only have come from when neither p or t had
   *    this character yet. c. If B is 0, your children are [up, left] where the
   *    children have the same M.  The sequence could have come from either t or
   *    p not having this character yet.
   * 3. If we haven't seen this node before or if the biggest dimension of the
   *    bounding box is smaller than the current box's biggest dimension, store
   *    this new box and add the child node to the queue.
   * 4. Go back to 1 and repeat until the queue is empty.
   */

  // Boxes is a map of [r,c] -> [rowWidth, columnHeignt] which is the width and
  // height of the box containing [r,c] and the closest 'end' node.
  const Boxes = new Map<string, [number, number]>();

  const childQ = M.reduce((acc1, row, r) => {
    return row.reduce((acc2, numMatchingChars, c) => {
      if (t[r] === p[c] && numMatchingChars === maxNumMatchingChars) {
        const key = `${r},${c}`;
        Boxes.set(key, [1, 1]);
        acc2.add(key);
      }
      return acc2;
    }, acc1);
  }, new Set<string>());

  while (childQ.size) {
    const openKey = childQ.values().next().value as string;
    childQ.delete(openKey);
    const [openR, openC] = openKey.split(",").map(Number);
    const openM = M[openR][openC];
    const [openBoxR, openBoxC] = Boxes.get(openKey)!;
    const isAtMatchedChar = t[openR] === p[openC];

    // If we've reached the starting character of a sequence, there's no need to go further.
    if (openM === 1 && isAtMatchedChar) continue;
    // If we're at a matched character, the only child is the one diagonally up-left.
    // Otherwise, the children are up and left as long as they have the same M value as our open one.
    const childDirs = isAtMatchedChar
      ? [[-1, -1]]
      : [
          [-1, 0],
          [0, -1],
        ];
    for (const [dr, dc] of childDirs) {
      const childRC = [openR + dr, openC + dc];
      const childM = _.get(M, childRC);
      if (!_.isUndefined(childM) && (isAtMatchedChar || childM === openM)) {
        const childKey = childRC.toString();
        const box = [openBoxR - dr, openBoxC - dc] as [number, number];
        const oldBox = Boxes.get(childKey);
        // If we haven't seen this child before, or if the box is smaller than the one we've seen before, update the box and add the child to the queue.
        if (!oldBox || Math.max(...box) < Math.max(...oldBox)) {
          childQ.add(childKey);
          Boxes.set(childKey, box);
        }
      }
    }
  }

  // Find the shortest sequence length by looking at all the boxes from 'start' nodes (M=1, B=1)
  const shortestSequenceLength = M.reduce((acc1, row, r) => {
    return row.reduce((acc2, numMatchingChars, c) => {
      if (t[r] === p[c] && numMatchingChars === 1) {
        const box = Boxes.get(`${r},${c}`);
        if (!box) return acc2;
        const maxBoxDim = Math.max(...box);
        if (maxBoxDim < acc2) return maxBoxDim;
      }
      return acc2;
    }, acc1);
  }, Infinity);

  // Return the number of matching consecutive characters and the number of characters from when we had our first matching character until the last.
  return [maxNumMatchingChars, shortestSequenceLength];
};

type FuzzyFilterOptions<D> = {
  // The maximum number of options to return.
  maxOutput?: number;
  // If true, if there is an exact match, only return that match.
  soloExactMatch?: boolean;
  // Get the string representation of an option to match against.
  getOptionString?: (option: D) => string;
  // The ratio of characters of the input that have matching consecutive characters in an option.
  // For example, if the input is 'abcd' and the option is 'ab___d', 3 of the 4 input characters match.
  // The closer to 1, the stricter the filter. 1 means that 100% of the input characters need to be a matching character.
  inputMatchingRatioThreshold?: number;
  // The ratio of characters in a matching consecutive sequence out of the total length of that sequence.
  // For example, if the input is 'abcd' and the option is 'ab___d', the matching sequence has 3 matching characters and is 6 characters long.
  // The closer to 1, the stricter the filter. 1 means that 100% of the matching sequence needs to be a matching character.
  sequenceMatchingRatioThreshold?: number;
  // The number of options to show if none of the options fit the filters to match the input.
  numBackupOptions?: number;
  // A secondary sort comparison function to use if the options are tied.
  tieBreakerCompareFn?: (
    input: string,
    optionA: D,
    optionB: D,
    aStr: string,
    bStr: string
  ) => number;
  // The character to split the input into words to match individually.
  wordDelimiter?: string | RegExp;
};
/**
 * To put the thresholds in context, consider the following example:
 * Input:
 * abcd
 *
 * Options:
 *  1. _abc____d_
 *  2. _ab_d_____
 *
 * Option 1 has more matching characters with the input 'abcd' (4 out of 4) compared to option 2 (3 out of 4).
 * Option 1 has fewer matching characters in the sequence 'abc____d' (4 out of 8) compared to 3 out of 4 matching characters in the sequence 'ab_d' in option 2.
 */

const similarLengthTieBreakerFn = <D>(
  input: string,
  optionA: D,
  optionB: D,
  aStr: string,
  bStr: string
) => {
  const aDist = Math.abs(input.length - aStr.length);
  const bDist = Math.abs(input.length - bStr.length);
  return aDist - bDist;
};

/**
 * Filter options based on how many matching characters they have with the
 * input, and how close those characters are to each other.
 * @param input string
 * @param options D[]
 * @param param2 config
 * @returns filtered options
 */
export const fuzzyFilter = <D>(
  input: string,
  options: D[],
  {
    numBackupOptions = 0,
    maxOutput = options.length,
    soloExactMatch = false,
    getOptionString = (option: D) => `${option}`,
    inputMatchingRatioThreshold = 0,
    sequenceMatchingRatioThreshold = 0,
    tieBreakerCompareFn = similarLengthTieBreakerFn,
    wordDelimiter = " ",
  }: FuzzyFilterOptions<D>
): D[] => {
  // If the input is empty, show all the options.
  if (!input) return options;

  const lowercaseInput = input.toLowerCase().trim();

  if (soloExactMatch) {
    // If there's an exact match, only show that one match.
    const exactMatch = options.find((option) => {
      return getOptionString(option).trim() === lowercaseInput;
    });
    if (exactMatch) {
      return [exactMatch];
    }
  }

  const inputWords = lowercaseInput.split(wordDelimiter);
  const distances = options.map((option) => {
    return inputWords.map((word) => {
      const optionString = getOptionString(option).trim().toLowerCase();
      return matchingConsecutiveCharacters(word, optionString);
    }, [] as number[][]);
  });

  const sortCriteria = distances.map((wordDistances, i) => {
    const sumDistances = wordDistances.reduce(
      (acc, [numMatchingChars, shortestSequence], i) => {
        return [
          // Total number of matching characters in the input.
          acc[0] + numMatchingChars,
          // Total length of all the words' matching sequences.
          acc[1] + shortestSequence,
        ];
      },
      [0, 0] as [number, number]
    );
    return [
      sumDistances[0] / lowercaseInput.length,
      sumDistances[1] > 0 ? sumDistances[0] / sumDistances[1] : 0,
    ];
  });
  const indices = sortCriteria.map((x, i) => i);
  // Sort by any tie breaker to start, then by the filter criteria.
  indices.sort((a: number, b: number) => {
    return tieBreakerCompareFn(
      input,
      options[a],
      options[b],
      getOptionString(options[a]),
      getOptionString(options[b])
    );
  });
  const sortedIndices = _.sortBy(
    indices,
    // Sort descending from best to worst.
    (i) => -sortCriteria[i][0],
    (i) => -sortCriteria[i][1]
  );
  const filteredIndices = sortedIndices.filter(
    (sortedIdx, i) =>
      // Filter out results that were below the threshold.
      sortCriteria[sortedIdx][0] > inputMatchingRatioThreshold &&
      sortCriteria[sortedIdx][1] > sequenceMatchingRatioThreshold
  );
  return (
    filteredIndices.length
      ? filteredIndices
      : // Include at least numBackupOptions results,
        sortedIndices.slice(0, numBackupOptions)
  )
    .slice(0, maxOutput)
    .map((i) => options[i]);
};
