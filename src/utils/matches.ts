import _ from "lodash";

type Node = {
  root: number;
  rank: number;
  size: number;
};

export const find = (i: number, elementMap: Node[]) => {
  if (elementMap[i].root !== i) {
    elementMap[i].root = find(elementMap[i].root, elementMap);
  }
  return elementMap[i].root;
};

export const union = (i: number, j: number, elementMap: Node[]) => {
  const iRoot = find(i, elementMap);
  const jRoot = find(j, elementMap);
  if (iRoot === jRoot) {
    return;
  }
  if (elementMap[iRoot].rank < elementMap[jRoot].rank) {
    elementMap[iRoot].root = jRoot;
    elementMap[jRoot].size += elementMap[iRoot].size;
  } else if (elementMap[iRoot].rank > elementMap[jRoot].rank) {
    elementMap[jRoot].root = iRoot;
    elementMap[iRoot].size += elementMap[jRoot].size;
  } else {
    elementMap[jRoot].root = iRoot;
    elementMap[iRoot].rank++;
    elementMap[iRoot].size += elementMap[jRoot].size;
  }
};

// Generate matches so that no one is matched with themselves
export const generateMatches = (
  numParticipants: number,
  twoWaysAllowed = false
): number[] => {
  if (numParticipants === 0) {
    return [];
  }
  if (numParticipants === 1) {
    return [0];
  }
  if (numParticipants === 2) {
    return [1, 0];
  }
  const bowlOfIndices = _.range(numParticipants);
  const matches = bowlOfIndices.map(() => -1);
  const parents = bowlOfIndices.map(() => -1);
  const elementMap = bowlOfIndices.map((_, i) => ({
    root: i,
    rank: 1,
    size: 1,
  }));
  let bowlSize = bowlOfIndices.length;
  const bowlWithoutSelf = [] as number[];
  for (let i = 0; i < bowlOfIndices.length; i++) {
    // The choices for participant i are all participants except for i that haven't been taken yet
    const parentIndex = parents[i];
    bowlWithoutSelf.length = 0;
    for (let b = 0; b < bowlSize; b++) {
      const participant = bowlOfIndices[b];
      if (
        participant !== i &&
        (twoWaysAllowed || participant !== parentIndex)
      ) {
        bowlWithoutSelf.push(participant);
      }
    }
    if (bowlWithoutSelf.length === 0) {
      // We could have gotten here if there are only two participants left and they are each other's only choice
      // Or if there's just 1 participant left.
      // In either case, we need to insert the participants into the other disjoint sets.
      // Find the smallest disjoint set.  At this point, all of the disjoint sets should be complete.
      let smallestSet = Infinity;
      let smallestSetIndex = -1;
      const minimumSetSize = twoWaysAllowed ? 2 : 3;
      for (let j = 0; j < elementMap.length; j++) {
        if (
          elementMap[j].root === j &&
          elementMap[j].size < smallestSet &&
          elementMap[j].size >= minimumSetSize
        ) {
          smallestSet = elementMap[j].size;
          smallestSetIndex = j;
          if (smallestSet === minimumSetSize) {
            break;
          }
        }
      }

      if (
        parents[smallestSetIndex] === -1 ||
        _.isUndefined(parents[smallestSetIndex])
      ) {
        console.log(
          "Error: smallestSetIndex has no parent",
          elementMap,
          i,
          smallestSetIndex,
          matches,
          parents
        );
      }

      matches[i] = smallestSetIndex;

      matches[parents[smallestSetIndex]] = parents[i] !== -1 ? parents[i] : i;
      if (_.uniq(matches).length !== i + 1) {
        console.log(`${_.uniq(matches)}.length !== ${i + 1}`);
        console.log(
          "Error: matches is not unique",
          matches,
          i,
          parents[smallestSetIndex],
          bowlWithoutSelf,
          bowlOfIndices,
          parents,
          elementMap,
          bowlSize,
          numParticipants
        );
      }
      break;
    }
    const j = Math.floor(Math.random() * bowlWithoutSelf.length);

    union(i, bowlWithoutSelf[j], elementMap);

    matches[i] = bowlWithoutSelf[j];
    if (_.uniq(matches).length !== Math.min(matches.length, i + 2)) {
      console.log(
        "Error: matches is not unique",
        matches,
        i,
        j,
        bowlWithoutSelf,
        bowlOfIndices,
        parents,
        elementMap,
        bowlSize,
        numParticipants
      );
    }
    parents[bowlWithoutSelf[j]] = i;
    for (let b = 0; b < bowlSize; b++) {
      if (bowlOfIndices[b] === bowlWithoutSelf[j]) {
        bowlOfIndices[b] = bowlOfIndices[bowlSize - 1];
        bowlOfIndices[bowlSize - 1] = bowlWithoutSelf[j];
        break;
      }
    }
    bowlSize--;
  }
  return matches;
};

export const generateLoopMatches = (numParticipants: number): number[] => {
  const loop = _.shuffle(_.range(numParticipants));
  return loop.reduce((acc, match, i) => {
    acc[match] = loop[(i + 1) % loop.length];
    return acc;
  }, _.range(numParticipants));
};

export const generateBidrectionalMatches = (
  numParticipants: number
): number[] => {
  const shuffled = _.shuffle(_.range(numParticipants));
  const backHalf = shuffled.slice(numParticipants / 2);
  const result = shuffled.slice();
  for (let i = 0; i < Math.floor(numParticipants / 2); i++) {
    result[shuffled[i]] = backHalf.pop()!;
    result[result[shuffled[i]]] = shuffled[i];
  }
  if (backHalf.length > 0) {
    const oldFirstMatch = result[shuffled[0]];
    result[shuffled[0]] = backHalf[0];
    result[backHalf[0]] = oldFirstMatch;
  }
  return result;
};
