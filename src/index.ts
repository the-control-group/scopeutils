/*

import {
  Pattern,
  AnyMultiple,
  AnySingle,
  intersect,
  isEqual,
  isSuperset
} from "./pattern";

export function parse(scope: string): Pattern[] {
  return scope.split(
    ":".map(pattern =>
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
    )
  );
}

export function stringify(scope: Pattern[]): string {
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

export function normalize(scope: string): string {
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

export function validate(scope: string): boolean {
  const patterns = scope.split(":");
  return (
    patterns.length === 3 &&
    patterns.map(pattern =>
      /^(([a-zA-Z0-9_-]+|(\*(?!\*\*))+)\.)*([a-zA-Z0-9_-]+|(\*(?!\*\*))+)$/.test(
        pattern
      )
    )
  );
}

// according to the supplied rule, can the given subject be performed?
export function can(
  rule: string | string[],
  subject: string,
  strict: boolean = true
): boolean {
  if (Array.isArray(rule)) {
    return rule.some(r => can(r, subject, strict));
  }

  const a = parse(rule);
  const b = parse(subject);

  if (strict) {
    return isSuperset(a, b);
  }

  return !!intersect(rule, subject);
}

function simplify(winners: string[], candidate: string): string[] {
  if (can(winners, candidate)) return winners;
  return winners.concat(candidate);
}

// returns a de-duplicated array of scope rules
export function simplifyCollection(collection: string[]): string[] {
  return collection.reduce(simplify, []).reduceRight(simplify, []);
}

// calculates the intersection of scope rules or returns null
export function combineCollections(
  collectionA: string[],
  collectionB: string[]
): string[] {
  return simplifyCollection(
    // This is the desired logic, rewritten to support older versions of JS
    // collectionA
    //   .flatMap(a => collectionB.flatMap(b => combine(a, b)))
    //   .filter((x => typeof x == "string") as (x: null | string) => x is string)

    ([] as string[]).concat(
      ...collectionA.map(a =>
        ([] as string[]).concat(
          collectionB
            .map(b => combine(a, b))
            .filter((x => typeof x == "string") as (
              x: null | string
            ) => x is string)
        )
      )
    )
  );
}

*/
