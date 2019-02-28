/*

import test from "ava";
import {
  validate,
  normalize,
  can,
  intersect,
  combineCollections,
  simplifyCollection
} from ".";

test("validate - should return false for invalid scopes", t => {
  t.is(validate("client"), false);
  t.is(validate("client:"), false);
  t.is(validate("client:resource"), false);
  t.is(validate("client:resource:"), false);
  t.is(validate("client:resource:action:"), false);
  t.is(validate("a.%:resource:action"), false);
  t.is(validate("a*.b:resource:action"), false);
  t.pass();
});

test("validate - should return true for valid scopes", t => {
  t.is(validate("client:resource:action"), true);
  t.is(validate("a.b.c:d.e.f:g.h.i"), true);
  t.is(validate("*.b.c:d.*.f:g.h.*"), true);
  t.is(validate("**.b.c:d.**.f:g.h.**"), true);
  t.is(validate("*:*:*"), true);
  t.is(validate("**:**:**"), true);
  t.pass();
});

test("normalize - should leave simple scopes in tact", t => {
  t.is(normalize("client:resource:action:"), "client:resource:action:");
  t.is(normalize("a.b.c:resource:action:"), "a.b.c:resource:action:");
  t.pass();
});
test("normalize - should leave single wildcards in their place", t => {
  t.is(normalize("*.*.c:resource:action:"), "*.*.c:resource:action:");
  t.is(normalize("*.b.*:resource:action:"), "*.b.*:resource:action:");
  t.is(normalize("a.*.*:resource:action:"), "a.*.*:resource:action:");
  t.is(normalize("*.*.*:resource:action:"), "*.*.*:resource:action:");
  t.pass();
});
test("normalize - should move double wildcards to the end", t => {
  t.is(normalize("*.**.c:resource:action:"), "*.**.c:resource:action:");
  t.is(normalize("**.*.c:resource:action:"), "*.**.c:resource:action:");
  t.is(normalize("**.b.*:resource:action:"), "**.b.*:resource:action:");
  t.is(normalize("*.b.**:resource:action:"), "*.b.**:resource:action:");
  t.is(normalize("**.b.**:resource:action:"), "**.b.**:resource:action:");
  t.is(normalize("a.**.*:resource:action:"), "a.*.**:resource:action:");
  t.is(normalize("a.*.**:resource:action:"), "a.*.**:resource:action:");
  t.is(normalize("**.*.*:resource:action:"), "*.*.**:resource:action:");
  t.is(normalize("*.**.*:resource:action:"), "*.*.**:resource:action:");
  t.is(normalize("*.*.**:resource:action:"), "*.*.**:resource:action:");
  t.pass();
});
test("normalize - should deduplicate consecutive double wildcards", t => {
  t.is(normalize("**.**.c:resource:action:"), "*.**.c:resource:action:");
  t.is(normalize("*.**.**:resource:action:"), "*.*.**:resource:action:");
  t.is(normalize("**.*.**:resource:action:"), "*.*.**:resource:action:");
  t.is(normalize("**.**.**:resource:action:"), "*.*.**:resource:action:");
  t.pass();
});

test("can (strict) - should match simple scopes", t => {
  t.is(can("client:resource:action", "client:resource:action"), true);
  t.is(can("client:resource:action", "wrongclient:resource:action"), false);
  t.is(can("client:resource:action", "client:wrongresource:action"), false);
  t.is(can("client:resource:action", "client:resource:wrongaction"), false);
  t.is(can("client:resource:action", "client.a:resource.b:action.c"), false);
  t.pass();
});
test("can (strict) - should match single-star globs", t => {
  t.is(can("client.*:resource:action", "client.a:resource:action"), true);
  t.is(can("client.*:resource:action", "client.*:resource:action"), true);
  t.is(can("client.*:resource:action", "client.**:resource:action"), false);
  t.is(can("client.a:resource:action", "client.*:resource:action"), false);
  t.is(can("client.*:resource:action", "client:resource:action"), false);
  t.is(can("client.*:resource:action", "client:resource.a:action"), false);
  t.is(can("client.*:resource:action", "client.a.b:resource:action"), false);
  t.is(can("client.*:resource:action", "client.a:wrongresource:action"), false);
  t.is(can("client.*:resource:action", "client.a:resource:wrongaction"), false);
  t.pass();
});
test("can (strict) - should match multi-star globs", t => {
  t.is(can("client.**:resource:action", "client.a:resource:action"), true);
  t.is(can("client.**:resource:action", "client.a.b:resource:action"), true);
  t.is(can("client.a:resource:action", "client.**:resource:action"), false);
  t.is(can("client.a.b:resource:action", "client.**:resource:action"), false);
  t.is(can("client.**:resource:action", "client:resource:action"), false);
  t.is(can("client.**:resource:action", "client:resource.a:action"), false);
  t.is(can("client:resource:action", "client.**:resource:action"), false);
  t.is(can("client:resource:action", "client.**:resource.a:action"), false);
  t.is(
    can("client.**:resource:action", "client.a:wrongresource:action"),
    false
  );
  t.is(
    can("client.**:resource:action", "client.a:resource:wrongaction"),
    false
  );
  t.pass();
});
test("can (strict) - should match an array of scope rules", t => {
  t.is(
    can(
      ["client.b:resource:action", "client.c:resource:action"],
      "client.a:resource:action"
    ),
    false
  );
  t.is(
    can(
      ["client.b:resource:action", "client.*:resource:action"],
      "client.a:resource:action"
    ),
    true
  );
  t.is(
    can(
      ["client.b:resource:action", "client.a:resource:action"],
      "client.*:resource:action"
    ),
    false
  );
  t.is(
    can(
      ["client.*:resource:action", "client.b:resource:action"],
      "client.a:resource:action"
    ),
    true
  );
  t.pass();
});

test("can (loose) - should match simple scopes", t => {
  t.is(can("client:resource:action", "client:resource:action", false), true);
  t.is(
    can("client:resource:action", "wrongclient:resource:action", false),
    false
  );
  t.is(
    can("client:resource:action", "client:wrongresource:action", false),
    false
  );
  t.is(
    can("client:resource:action", "client:resource:wrongaction", false),
    false
  );
  t.is(
    can("client:resource:action", "client.a:resource.b:action.c", false),
    false
  );
  t.pass();
});
test("can (loose) - should match single-star globs", t => {
  t.is(
    can("client.*:resource:action", "client.a:resource:action", false),
    true
  );
  t.is(
    can("client.*:resource:action", "client.*:resource:action", false),
    true
  );
  t.is(
    can("client.*:resource:action", "client.**:resource:action", false),
    true
  );
  t.is(
    can("client.a:resource:action", "client.*:resource:action", false),
    true
  );
  t.is(can("client.*:resource:action", "client:resource:action", false), false);
  t.is(
    can("client.*:resource:action", "client:resource.a:action", false),
    false
  );
  t.is(
    can("client.*:resource:action", "client.a.b:resource:action", false),
    false
  );
  t.is(
    can("client.*:resource:action", "client.a:wrongresource:action", false),
    false
  );
  t.is(
    can("client.*:resource:action", "client.a:resource:wrongaction", false),
    false
  );
  t.pass();
});
test("can (loose) - should match multi-star globs", t => {
  t.is(
    can("client.**:resource:action", "client.a:resource:action", false),
    true
  );
  t.is(
    can("client.**:resource:action", "client.a.b:resource:action", false),
    true
  );
  t.is(
    can("client.a:resource:action", "client.**:resource:action", false),
    true
  );
  t.is(
    can("client.a.b:resource:action", "client.**:resource:action", false),
    true
  );
  t.is(
    can("client.**:resource:action", "client:resource:action", false),
    false
  );
  t.is(
    can("client.**:resource:action", "client:resource.a:action", false),
    false
  );
  t.is(
    can("client:resource:action", "client.**:resource:action", false),
    false
  );
  t.is(
    can("client:resource:action", "client.**:resource.a:action", false),
    false
  );
  t.is(
    can("client.**:resource:action", "client.a:wrongresource:action", false),
    false
  );
  t.is(
    can("client.**:resource:action", "client.a:resource:wrongaction", false),
    false
  );
  t.pass();
});
test("can (loose) - should match an array of scope rules", t => {
  t.is(
    can(
      ["client.b:resource:action", "client.c:resource:action"],
      "client.a:resource:action",
      false
    ),
    false
  );
  t.is(
    can(
      ["client.b:resource:action", "client.*:resource:action"],
      "client.a:resource:action",
      false
    ),
    true
  );
  t.is(
    can(
      ["client.b:resource:action", "client.a:resource:action"],
      "client.*:resource:action",
      false
    ),
    true
  );
  t.is(
    can(
      ["client.*:resource:action", "client.b:resource:action"],
      "client.a:resource:action",
      false
    ),
    true
  );
  t.pass();
});

([
  // simple eg/gt/lt
  { args: ["a:b:c", "a:b:c"], results: "a:b:c" },
  { args: ["*:b:c", "a:b:c"], results: "a:b:c" },
  { args: ["*:b:c", "*:b:c"], results: "*:b:c" },
  { args: ["**:b:c", "**:b:c"], results: "**:b:c" },
  { args: ["*:b:c", "**:b:c"], results: "*:b:c" },
  { args: ["**:b:c", "foo.**:b:c"], results: "foo.**:b:c" },
  { args: ["**:b:c", "foo.*:b:c"], results: "foo.*:b:c" },

  // substitution
  { args: ["*.y:b:c", "x.*:b:c"], results: "x.y:b:c" },
  { args: ["*.y:b:c", "x.**:b:c"], results: "x.y:b:c" },
  { args: ["**.y:b:c", "x.**:b:c"], results: "x.y:b:c" },
  { args: ["*.**:b:c", "**.*:b:c"], results: "*.**:b:c" },
  { args: ["**.*:b:c", "*.**:b:c"], results: "*.**:b:c" },
  { args: ["**.**:b:c", "*.**:b:c"], results: "*.**:b:c" },
  { args: ["**.**:b:c", "*.*.*:b:c"], results: "*.*.*:b:c" },
  { args: ["*.*.*:b:c", "**.**:b:c"], results: "*.*.*:b:c" },
  { args: ["foo.*:b:c", "foo.*:b:c"], results: "foo.*:b:c" },
  { args: ["foo.**:b:c", "foo.*:b:c"], results: "foo.*:b:c" },
  { args: ["*.y:*:c", "x.*:b:*"], results: "x.y:b:c" },
  { args: ["*:**:c", "**:*:c"], results: "*:*:c" },

  // FIXME: https://github.com/the-control-group/scopeutils/issues/1
  // {args: ['*.*.c:y:z', 'a.**:y:z'], results: 'a.*.c:y:z'},
  { args: ["a.**:x:x", "**.b:x:x"], results: "a.**.b:x:x" },

  // mismatch
  { args: ["x:b:c", "a:b:c"], results: null },
  { args: ["x:*:c", "a:b:c"], results: null },
  { args: ["x:**:c", "a:b:c"], results: null }
] as { args: [string, string]; results: string }[]).forEach(row => {
  test("combine - (" + row.args.join(") • (") + ") => " + row.results, t => {
    t.is(combine(...row.args), row.results);
    t.pass();
  });
});

([
  { args: [["x:b:c"], ["a:b:c"]], results: [] },
  { args: [["a:b:c"], ["a:b:c"]], results: ["a:b:c"] },
  { args: [["*:b:c"], ["**:b:c"]], results: ["*:b:c"] },
  { args: [["**:b:c"], ["*:b:c"]], results: ["*:b:c"] },
  { args: [["**:b:c"], ["a:b:c"]], results: ["a:b:c"] },
  { args: [["**:b:c", "a:**:c"], ["a:b:c", "x:y:c"]], results: ["a:b:c"] }
] as { args: [string[], string[]]; results: string[] }[]).forEach(row => {
  test(
    "combineCollections - (" + row.args.join(") • (") + ") => " + row.results,
    t => {
      t.deepEqual(combineCollections(...row.args), row.results);
      t.pass();
    }
  );
});

([
  { args: [[]], results: [] },
  { args: [["x:b:c"]], results: ["x:b:c"] },
  { args: [["x:b:c", "a:b:c"]], results: ["x:b:c", "a:b:c"] },
  { args: [["a:b:c", "a:b:c"]], results: ["a:b:c"] },
  { args: [["*:b:c", "a:b:c"]], results: ["*:b:c"] },
  { args: [["*:b:c", "*:b:c"]], results: ["*:b:c"] },
  { args: [["**:b:c", "**:b:c"]], results: ["**:b:c"] },
  { args: [["*:b:c", "**:b:c"]], results: ["**:b:c"] },
  { args: [["**:b:c", "foo.**:b:c"]], results: ["**:b:c"] },
  { args: [["**:b:c", "foo.*:b:c"]], results: ["**:b:c"] },
  { args: [["*.y:b:c", "x.*:b:c"]], results: ["*.y:b:c", "x.*:b:c"] },
  { args: [["foo.*:b:c", "foo.*:b:c"]], results: ["foo.*:b:c"] },
  {
    args: [["foo.**:b:c", "foo.*:b:c", "foo.*:b:c"]],
    results: ["foo.**:b:c"]
  },
  {
    args: [["foo.**:b:c", "foo.*:b:c", "foo.*:b:c", "foo.a:b:c"]],
    results: ["foo.**:b:c"]
  },
  {
    args: [["foo.a:b:c", "foo.*:b:c", "foo.*:b:c", "foo.**:b:c"]],
    results: ["foo.**:b:c"]
  },
  {
    args: [
      [
        "AuthX:credential.incontact.me:read",
        "AuthX:credential.incontact.user:read",
        "AuthX:credential.*.me:*"
      ]
    ],
    results: ["AuthX:credential.*.me:*", "AuthX:credential.incontact.user:read"]
  }
] as { args: [string[]]; results: string[] }[]).forEach(row => {
  test(
    "simplifyCollection - (" + row.args.join(") • (") + ") => " + row.results,
    t => {
      t.deepEqual(simplifyCollection(...row.args).sort(), row.results.sort());
      t.pass();
    }
  );
});

*/
