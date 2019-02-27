function makeRegExp(scope: string): RegExp {
  var pattern = scope
    .split(":")
    .map(domain =>
      domain
        .split(".")
        .map(part => {
          if (part === "**") return "([^:]*)";
          if (part === "*") return "(\\*|[^\\.^:^*]*)";
          return part.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
        })
        .join("\\.")
    )
    .join(":");

  return new RegExp("^" + pattern + "$");
}

export function validate(scope: string): boolean {
  return /^(([a-zA-Z0-9_-]+|(\*(?!\*\*))+)\.)*([a-zA-Z0-9_-]+|(\*(?!\*\*))+):(([a-zA-Z0-9_-]+|(\*(?!\*\*))+)\.)*([a-zA-Z0-9_-]+|(\*(?!\*\*))+):(([a-zA-Z0-9_-]+|(\*(?!\*\*))+)\.)*([a-zA-Z0-9_-]+|(\*(?!\*\*))+)$/.test(
    scope
  );
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

// combines scopes `a` and `b`, returning the most permissive common scope or `null`
export function combine(a: string, b: string): null | string {
  a = normalize(a);
  b = normalize(b);

  // literal equal
  if (a == b) return a;

  const aX = makeRegExp(a);
  const bX = makeRegExp(b);

  const aB = aX.test(b);
  const bA = bX.test(a);

  // a supercedes b
  if (bA && !aB) return a;

  // b supercedes a
  if (aB && !bA) return b;

  // ...the scopes are thus mutually exclusive (because they cannot be mutually inclusive without being equal)

  // if there are no wildcard sequences, then there is no possibility of a combination
  if (!a.includes("*") || !b.includes("*")) return null;

  // ...substitute the wildcard matches from A into the the wildcards of B

  // loop through each domain
  const substitution: string[][] = [];
  const wildcardMap: { w: string; d: number; p: number }[] = [];
  const pattern =
    "^" +
    a
      .split(":")
      .map((domain, d) =>
        domain
          .split(".")
          .map((part, p) => {
            substitution[d] = substitution[d] || [];
            substitution[d][p] = part;

            if (part === "**") {
              wildcardMap.push({ w: "**", d, p });
              return "([^:]*)";
            }

            if (part === "*") {
              wildcardMap.push({ w: "*", d, p });
              return "([^\\.^:]*)";
            }

            return "[^:^.]*";
          })
          .join("\\.")
      )
      .join(":") +
    "$";

  const matches = b.match(pattern);

  // substitution failed, the scopes are incompatible
  if (!matches) return null;

  // make the substitutions, downgrade captured double wildcards
  wildcardMap.forEach((map, i) => {
    substitution[map.d][map.p] =
      map.w === "*" && matches[i + 1] === "**" ? "*" : matches[i + 1];
  });

  // the combined result
  var combined = substitution.map(d => d.join(".")).join(":");

  // test the substitution
  if (bX.test(combined)) return combined;

  return null;
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

  // if (strict) {
  //   const [aRealm, aSubject, aAction] = rule.split(":");
  //   const [bRealm, bSubject, bAction] = subject.split(":");
  //   return (
  //     supersetOfOrEqualTo(aRealm, bRealm) &&
  //     supersetOfOrEqualTo(aSubject, bSubject) &&
  //     supersetOfOrEqualTo(aAction, bAction)
  //   );
  // }

  return !!combine(rule, subject);
}

type Pattern = string[];

// export function ⊃(a: Pattern, b: Pattern) {
//   return superset(a, b);
// }
// export function ⊂(a: Pattern, b: Pattern) {
//   return superset(b, a);
// }
// export function ∩(a: Pattern, b: Pattern) {
//   return intersection(a, b);
// }
// export function ∪(a: Pattern, b: Pattern) {
//   return union(a, b);
// }
// export function ∁(a: Pattern, b: Pattern) {
//   return compliment(a, b);
// }

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
