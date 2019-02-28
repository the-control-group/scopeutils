export const AnySingle: unique symbol = Symbol("*");
export const AnyMultiple: unique symbol = Symbol("**");

export type Segment = string | Symbol; // typeof AnySingle | typeof AnyMultiple;
export type Pattern = Segment[];

export function intersect(
  left: Pattern,
  rightA: Pattern,
  rightB: Pattern
): Pattern[] {
  const [a, ...restA] = rightA;
  const [b, ...restB] = rightB;

  // One or both segments have variable cardinality.
  if (a === AnyMultiple || b === AnyMultiple) {
    return [
      ...(a === AnyMultiple
        ? restB.length // CONTINUE
          ? ([
              ...intersect([...left, b], [a, ...restA], restB),
              ...(restA.length ? intersect([...left, b], restA, restB) : [])
            ] as Pattern[])
          : !restA.length || b === AnyMultiple // DONE
          ? [[...left, b, ...restA]]
          : []
        : []),

      ...(b === AnyMultiple
        ? restA.length // CONTINUE
          ? ([
              ...intersect([...left, a], restA, [b, ...restB]),
              ...(restB.length ? intersect([...left, a], restA, restB) : [])
            ] as Pattern[])
          : !restB.length || a === AnyMultiple // DONE
          ? [[...left, a, ...restB]]
          : []
        : [])
    ] as Pattern[];
  }

  const match =
    a === AnySingle || b === AnySingle
      ? [...left, a == AnySingle ? b : a]
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

export function normalize(pattern: Pattern): Pattern {
  return pattern.map((segment, i, segments) => {
    if (
      segment !== AnyMultiple ||
      (segments[i + 1] !== AnyMultiple && segments[i + 1] !== AnySingle)
    ) {
      return segment;
    }

    segments[i + 1] = AnyMultiple;
    return AnySingle;
  });
}

export function isEqual(a: Pattern, b: Pattern) {
  a = normalize(a);
  b = normalize(b);
  return a.length === b.length && a.every((segment, i) => segment === b[i]);
}

export function isSubset(a: Pattern, b: Pattern) {
  const intersection = simplify(intersect([], a, b));
  if (intersection.length !== 1) {
    return false;
  }

  return isEqual(a, intersection[0]);
}

export function isStrictSubset(a: Pattern, b: Pattern) {
  if (isEqual(a, b)) {
    return false;
  }

  return isSubset(a, b);
}

export function isSuperset(a: Pattern, b: Pattern) {
  return isSubset(b, a);
}

export function isStrictSuperset(a: Pattern, b: Pattern) {
  return isStrictSubset(b, a);
}

function s(winners: Pattern[], candidate: Pattern): Pattern[] {
  if (winners.some(pattern => isSuperset(pattern, candidate))) return winners;
  return [...winners, candidate];
}

// returns a de-duplicated array of scope rules
export function simplify(collection: Pattern[]): Pattern[] {
  return collection.reduce(s, []).reduceRight(s, []);
}
