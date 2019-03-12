import { Pattern, AnySingle, AnyMultiple } from "./pattern";
import * as pattern from "./pattern";

export class InvalidScopeError extends Error {}

// Parse a scope string into a Pattern array
function parse(scope: string): Pattern[] {
  return scope.split(":").map(pattern =>
    pattern.split(".").map(segment => {
      switch (segment) {
        case "**":
          return AnyMultiple;
        case "*":
          return AnySingle;
        default:
          return segment;
      }
    })
  );
}

// Stringify a Pattern array
function stringify(scope: Pattern[]): string {
  return scope
    .map(pattern =>
      pattern
        .map(segment => {
          switch (segment) {
            case AnyMultiple:
              return "**";
            case AnySingle:
              return "*";
            default:
              return segment;
          }
        })
        .join(".")
    )
    .join(":");
}

function intersect(
  left: Pattern[],
  rightA: Pattern[],
  rightB: Pattern[]
): Pattern[][] {
  // INVARIENT: rightA.length === rightB.length
  // INVARIENT: rightA.length > 0
  // INVARIENT: rightB.length > 0
  const [a, ...restA] = rightA;
  const [b, ...restB] = rightB;

  if (!restA.length) {
    return pattern.getIntersection(a, b).map(pattern => [...left, pattern]);
  }

  return pattern
    .getIntersection(a, b)
    .map(pattern => intersect([...left, pattern], restA, restB))
    .reduce((x, y) => x.concat(y), []);
}

export function validate(scope: string): boolean {
  const patterns = scope.split(":");
  return (
    patterns.length === 3 &&
    patterns.every(pattern =>
      /^(([a-zA-Z0-9_-]+|(\*(?!\*\*))+)\.)*([a-zA-Z0-9_-]+|(\*(?!\*\*))+)$/.test(
        pattern
      )
    )
  );
}

export function normalize(scope: string): string {
  if (!validate(scope)) {
    throw new InvalidScopeError("The scope is invalid.");
  }

  return scope
    .split(":")
    .map(domain =>
      domain
        .split(".")
        .map((part, i, parts) => {
          if (part !== "**" || (parts[i + 1] !== "**" && parts[i + 1] !== "*"))
            return part;
          parts[i + 1] = "**";
          return "*";
        })
        .join(".")
    )
    .join(":");
}

function s(winners: string[], candidate: string): string[] {
  if (isSuperset(winners, candidate)) return winners;
  return winners.concat(normalize(candidate));
}

// returns a de-duplicated array of scope rules
export function simplify(collection: string[]): string[] {
  return collection
    .reduce(s, [])
    .reduceRight(s, [])
    .sort();
}

export function getIntersection(
  scopeOrCollectionA: string[] | string,
  scopeOrCollectionB: string[] | string
): string[] {
  const collectionA =
    typeof scopeOrCollectionA === "string"
      ? [scopeOrCollectionA]
      : scopeOrCollectionA;

  const collectionB =
    typeof scopeOrCollectionB === "string"
      ? [scopeOrCollectionB]
      : scopeOrCollectionB;

  if (!collectionA.every(validate)) {
    throw new InvalidScopeError(
      "One or more of the scopes in `collectionA` is invalid."
    );
  }

  if (!collectionB.every(validate)) {
    throw new InvalidScopeError(
      "One or more of the scopes in `collectionB` is invalid."
    );
  }

  const patternsA = collectionA.map(parse).filter(p => p.length > 0);
  const patternsB = collectionB.map(parse).filter(p => p.length > 0);

  return simplify(
    patternsA
      .map(a =>
        patternsB
          .map(b => intersect([], a, b))
          .reduce((x, y) => x.concat(y), [])
      )
      .reduce((x, y) => x.concat(y), [])
      .map(stringify)
  );
}

export function hasIntersection(
  scopeOrCollectionA: string[] | string,
  scopeOrCollectionB: string[] | string
): boolean {
  return getIntersection(scopeOrCollectionA, scopeOrCollectionB).length > 0;
}

export function isEqual(
  scopeOrCollectionA: string[] | string,
  scopeOrCollectionB: string[] | string
): boolean {
  const collectionA = simplify(
    typeof scopeOrCollectionA === "string"
      ? [scopeOrCollectionA]
      : scopeOrCollectionA
  );
  const collectionB = simplify(
    typeof scopeOrCollectionB === "string"
      ? [scopeOrCollectionB]
      : scopeOrCollectionB
  );

  return (
    collectionA.length === collectionB.length &&
    collectionA.every((a, i) => a === collectionB[i])
  );
}

export function isSuperset(
  scopeOrCollectionA: string[] | string,
  scopeOrCollectionB: string[] | string
): boolean {
  if (Array.isArray(scopeOrCollectionA)) {
    return simplify(scopeOrCollectionA).some(a =>
      isSuperset(a, scopeOrCollectionB)
    );
  }

  if (!validate(scopeOrCollectionA)) {
    throw new InvalidScopeError("A scope in `scopeOrCollectionA` is invalid.");
  }

  if (Array.isArray(scopeOrCollectionB)) {
    return simplify(scopeOrCollectionB).every(b =>
      isSuperset(scopeOrCollectionA, b)
    );
  }

  if (!validate(scopeOrCollectionB)) {
    throw new InvalidScopeError("A scope in `scopeOrCollectionB` is invalid.");
  }

  const a = parse(scopeOrCollectionA);
  const b = parse(scopeOrCollectionB);

  return (
    a.length === b.length &&
    a.every((patternA: Pattern, i: number) =>
      pattern.isSuperset(patternA, b[i])
    )
  );
}

export function isStrictSuperset(
  scopeOrCollectionA: string[] | string,
  scopeOrCollectionB: string[] | string
): boolean {
  return (
    !isEqual(scopeOrCollectionA, scopeOrCollectionB) &&
    isSuperset(scopeOrCollectionA, scopeOrCollectionB)
  );
}

export function isSubset(
  scopeOrCollectionA: string[],
  scopeOrCollectionB: string[]
): boolean {
  return isSubset(scopeOrCollectionB, scopeOrCollectionA);
}

export function isStrictSubset(
  scopeOrCollectionA: string[],
  scopeOrCollectionB: string[]
): boolean {
  return (
    !isEqual(scopeOrCollectionA, scopeOrCollectionB) &&
    isSubset(scopeOrCollectionA, scopeOrCollectionB)
  );
}

// DEPRECATED
// ----------
// The following methods are deprecated:

// according to the supplied rule, can the given subject be performed?
export function test(
  rule: string | string[],
  subject: string,
  strict: boolean = true
): boolean {
  // In strict mode, ensure that the subject is a subset or equal to at least
  // one of the rule scopes.
  if (strict) {
    return isSuperset(rule, subject);
  }

  // In weak mode, ensure that the subject and at least one of the rule scopes
  // have an intersection.
  return getIntersection(rule, subject).length > 0;
}

export const can = test;

export const limit = getIntersection;
