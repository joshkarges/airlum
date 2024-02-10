import _ from "lodash";

type DLNode = {
  val: number;
  next: DLNode | null;
  prev: DLNode | null;
};

type Loop = {
  size: number;
  root: DLNode;
  tail: DLNode;
};

export const find = (
  i: number,
  elementMap: { root: number; rank: number }[]
) => {
  if (elementMap[i].root !== i) {
    elementMap[i].root = find(elementMap[i].root, elementMap);
  }
  return elementMap[i].root;
};

export const union = (
  i: number,
  j: number,
  elementMap: { root: number; rank: number }[]
) => {
  const iRoot = find(i, elementMap);
  const jRoot = find(j, elementMap);
  if (iRoot === jRoot) {
    return;
  }
  if (elementMap[iRoot].rank < elementMap[jRoot].rank) {
    elementMap[iRoot].root = jRoot;
  } else if (elementMap[iRoot].rank > elementMap[jRoot].rank) {
    elementMap[jRoot].root = iRoot;
  } else {
    elementMap[jRoot].root = iRoot;
    elementMap[iRoot].rank++;
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
  const participants = _.range(numParticipants);
  const matches = participants.map(() => -1);
  const parents = participants.map(() => -1);
  const elementMap = participants.map((_, i) => ({ root: i, rank: 1 }));
  const bowlOfIndices = new Set(participants);
  for (let i = 0; i < participants.length; i++) {
    // The choices for participant i are all participants except for i that haven't been taken yet
    const secretSantaIndex = parents[i];
    const bowlWithoutSelf = Array.from(bowlOfIndices).filter(
      (index) => index !== i && (twoWaysAllowed || index !== secretSantaIndex)
    );
    if (bowlWithoutSelf.length === 0) {
      // We could have gotten here if there are only two participants left and they are each other's only choice
      // Or if there's just 1 participant left.
      // In either case, we need to insert the participants into the other disjoint sets.
      // Find the smallest disjoint set.  At this point, all of the disjoint sets should be complete.
      let smallestSet = Infinity;
      let smallestSetIndex = -1;
      for (let j = 0; j < elementMap.length; j++) {
        if (
          elementMap[j].root === j &&
          elementMap[j].rank < smallestSet &&
          elementMap[j].rank > 1
        ) {
          smallestSet = elementMap[j].rank;
          smallestSetIndex = j;
          if (smallestSet === 2) {
            break;
          }
        }
      }
      matches[i] = smallestSetIndex;

      matches[parents[smallestSetIndex]] = parents[i] !== -1 ? parents[i] : i;
      break;
    }
    const j = Math.floor(Math.random() * bowlWithoutSelf.length);

    union(i, bowlWithoutSelf[j], elementMap);

    matches[i] = bowlWithoutSelf[j];
    parents[bowlWithoutSelf[j]] = i;
    bowlOfIndices.delete(bowlWithoutSelf[j]);
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
