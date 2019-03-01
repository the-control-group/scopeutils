import {
  Pattern,
  AnyMultiple,
  AnySingle,
  getIntersection,
  isSuperset
} from "./pattern";

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
    return getIntersection(a, b).map(pattern => [...left, pattern]);
  }

  return getIntersection(a, b).flatMap(pattern =>
    intersect([...left, pattern], restA, restB)
  );
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

// according to the supplied rule, can the given subject be performed?
export function test(
  rule: string | string[],
  subject: string,
  strict: boolean = true
): boolean {
  if (!validate(subject)) {
    throw new InvalidScopeError("The `subject` scope is invalid.");
  }

  if (Array.isArray(rule)) {
    return rule.some(r => test(r, subject, strict));
  }

  if (!validate(rule)) {
    throw new InvalidScopeError("A `rule` scope is invalid.");
  }

  const a = parse(rule);
  const b = parse(subject);

  // In strict mode, ensure that the subject is a subset or equal to at least
  // one of the rule scopes.
  if (strict) {
    return (
      a.length === b.length &&
      a.every((patternA: Pattern, i: number) => isSuperset(patternA, b[i]))
    );
  }

  // In weak mode, ensure that the subject and at least one of the rule scopes
  // have an intersection.
  return (
    a.length === b.length &&
    a.every(
      (patternA: Pattern, i: number) =>
        getIntersection(patternA, b[i]).length > 0
    )
  );
}

function s(winners: string[], candidate: string): string[] {
  if (test(winners, candidate)) return winners;
  return winners.concat(normalize(candidate));
}

// returns a de-duplicated array of scope rules
export function simplify(collection: string[]): string[] {
  return collection.reduce(s, []).reduceRight(s, []);
}

export function limit(collectionA: string[], collectionB: string[]): string[] {
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
      .flatMap(a => patternsB.flatMap(b => intersect([], a, b)))
      .map(stringify)
  );
}
