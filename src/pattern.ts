export function normalize(pattern: string[]): string[] {
  return pattern.map((segment, i, segments) => {
    if (
      segment !== "**" ||
      (segments[i + 1] !== "**" && segments[i + 1] !== "*")
    ) {
      return segment;
    }

    segments[i + 1] = "**";
    return "*";
  });
}

export function simplify(patterns: string[][]) {
  const set = new Set();
  return patterns.filter(pattern => {
    const key = pattern.join(".");
    if (set.has(key)) {
      return false;
    }

    set.add(key);
    return true;
  });
}

export function intersect(
  left: string[],
  rightA: string[],
  rightB: string[]
): string[][] {
  const [a, ...restA] = rightA;
  const [b, ...restB] = rightB;

  // One or both segments have variable cardinality.
  if (a === "**" || b === "**") {
    return [
      ...(a === "**"
        ? restB.length // CONTINUE
          ? ([
              ...intersect([...left, b], [a, ...restA], restB),
              ...(restA.length ? intersect([...left, b], restA, restB) : [])
            ] as string[][])
          : !restA.length || b === "**" // DONE
          ? [[...left, b, ...restA]]
          : []
        : []),

      ...(b === "**"
        ? restA.length // CONTINUE
          ? ([
              ...intersect([...left, a], restA, [b, ...restB]),
              ...(restB.length ? intersect([...left, a], restA, restB) : [])
            ] as string[][])
          : !restB.length || a === "**" // DONE
          ? [[...left, a, ...restB]]
          : []
        : [])
    ] as string[][];
  }

  const match =
    a === "*" || b === "*"
      ? [...left, a == "*" ? b : a]
      : a == b
      ? [...left, a]
      : null;

  // DONE: The segments do not match
  if (!match) {
    return [];
  }

  // DONE: Both patterns are finished.
  if (!restA.length && !restB.length) {
    return [match];
  }

  // DONE: The patterns have different cardinality.
  if (!restA.length || !restB.length) {
    return [];
  }

  // CONTINUE
  return intersect(match, restA, restB);
}

console.log(simplify(intersect([], ["**", "b"], ["a", "**"])));
console.log(simplify(intersect([], ["**", "b", "**"], ["**", "a", "**"])));
