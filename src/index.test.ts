import t from "ava";

import { validate, normalize, test, limit, simplify } from ".";

t("validate - should return false for invalid scopes", t => {
  t.is(validate("client"), false);
  t.is(validate("client:"), false);
  t.is(validate("client:resource"), false);
  t.is(validate("client:resource:"), false);
  t.is(validate("client:resource:action:"), false);
  t.is(validate("a.%:resource:action"), false);
  t.is(validate("a*.b:resource:action"), false);
});

t("validate - should return true for valid scopes", t => {
  t.is(validate("client:resource:action"), true);
  t.is(validate("a.b.c:d.e.f:g.h.i"), true);
  t.is(validate("*.b.c:d.*.f:g.h.*"), true);
  t.is(validate("**.b.c:d.**.f:g.h.**"), true);
  t.is(validate("*:*:*"), true);
  t.is(validate("**:**:**"), true);
});

t("normalize - should leave simple scopes in tact", t => {
  t.is(normalize("client:resource:action:"), "client:resource:action:");
  t.is(normalize("a.b.c:resource:action:"), "a.b.c:resource:action:");
});
t("normalize - should leave single wildcards in their place", t => {
  t.is(normalize("*.*.c:resource:action:"), "*.*.c:resource:action:");
  t.is(normalize("*.b.*:resource:action:"), "*.b.*:resource:action:");
  t.is(normalize("a.*.*:resource:action:"), "a.*.*:resource:action:");
  t.is(normalize("*.*.*:resource:action:"), "*.*.*:resource:action:");
});
t("normalize - should move double wildcards to the end", t => {
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
});
t("normalize - should deduplicate consecutive double wildcards", t => {
  t.is(normalize("**.**.c:resource:action:"), "*.**.c:resource:action:");
  t.is(normalize("*.**.**:resource:action:"), "*.*.**:resource:action:");
  t.is(normalize("**.*.**:resource:action:"), "*.*.**:resource:action:");
  t.is(normalize("**.**.**:resource:action:"), "*.*.**:resource:action:");
});

t("can (strict) - should match simple scopes", t => {
  t.is(test("client:resource:action", "client:resource:action"), true);
  t.is(test("client:resource:action", "wrongclient:resource:action"), false);
  t.is(test("client:resource:action", "client:wrongresource:action"), false);
  t.is(test("client:resource:action", "client:resource:wrongaction"), false);
  t.is(test("client:resource:action", "client.a:resource.b:action.c"), false);
});
t("can (strict) - should match single-star globs", t => {
  t.is(test("client.*:resource:action", "client.a:resource:action"), true);
  t.is(test("client.*:resource:action", "client.*:resource:action"), true);
  t.is(test("client.*:resource:action", "client.**:resource:action"), false);
  t.is(test("client.a:resource:action", "client.*:resource:action"), false);
  t.is(test("client.*:resource:action", "client:resource:action"), false);
  t.is(test("client.*:resource:action", "client:resource.a:action"), false);
  t.is(test("client.*:resource:action", "client.a.b:resource:action"), false);
  t.is(
    test("client.*:resource:action", "client.a:wrongresource:action"),
    false
  );
  t.is(
    test("client.*:resource:action", "client.a:resource:wrongaction"),
    false
  );
});
t("can (strict) - should match multi-star globs", t => {
  t.is(test("client.**:resource:action", "client.a:resource:action"), true);
  t.is(test("client.**:resource:action", "client.a.b:resource:action"), true);
  t.is(test("client.a:resource:action", "client.**:resource:action"), false);
  t.is(test("client.a.b:resource:action", "client.**:resource:action"), false);
  t.is(test("client.**:resource:action", "client:resource:action"), false);
  t.is(test("client.**:resource:action", "client:resource.a:action"), false);
  t.is(test("client:resource:action", "client.**:resource:action"), false);
  t.is(test("client:resource:action", "client.**:resource.a:action"), false);
  t.is(
    test("client.**:resource:action", "client.a:wrongresource:action"),
    false
  );
  t.is(
    test("client.**:resource:action", "client.a:resource:wrongaction"),
    false
  );
});
t("can (strict) - should match an array of scope rules", t => {
  t.is(
    test(
      ["client.b:resource:action", "client.c:resource:action"],
      "client.a:resource:action"
    ),
    false
  );
  t.is(
    test(
      ["client.b:resource:action", "client.*:resource:action"],
      "client.a:resource:action"
    ),
    true
  );
  t.is(
    test(
      ["client.b:resource:action", "client.a:resource:action"],
      "client.*:resource:action"
    ),
    false
  );
  t.is(
    test(
      ["client.*:resource:action", "client.b:resource:action"],
      "client.a:resource:action"
    ),
    true
  );
});

t("can (loose) - should match simple scopes", t => {
  t.is(test("client:resource:action", "client:resource:action", false), true);
  t.is(
    test("client:resource:action", "wrongclient:resource:action", false),
    false
  );
  t.is(
    test("client:resource:action", "client:wrongresource:action", false),
    false
  );
  t.is(
    test("client:resource:action", "client:resource:wrongaction", false),
    false
  );
  t.is(
    test("client:resource:action", "client.a:resource.b:action.c", false),
    false
  );
});
t("can (loose) - should match single-star globs", t => {
  t.is(
    test("client.*:resource:action", "client.a:resource:action", false),
    true
  );
  t.is(
    test("client.*:resource:action", "client.*:resource:action", false),
    true
  );
  t.is(
    test("client.*:resource:action", "client.**:resource:action", false),
    true
  );
  t.is(
    test("client.a:resource:action", "client.*:resource:action", false),
    true
  );
  t.is(
    test("client.*:resource:action", "client:resource:action", false),
    false
  );
  t.is(
    test("client.*:resource:action", "client:resource.a:action", false),
    false
  );
  t.is(
    test("client.*:resource:action", "client.a.b:resource:action", false),
    false
  );
  t.is(
    test("client.*:resource:action", "client.a:wrongresource:action", false),
    false
  );
  t.is(
    test("client.*:resource:action", "client.a:resource:wrongaction", false),
    false
  );
});
t("can (loose) - should match multi-star globs", t => {
  t.is(
    test("client.**:resource:action", "client.a:resource:action", false),
    true
  );
  t.is(
    test("client.**:resource:action", "client.a.b:resource:action", false),
    true
  );
  t.is(
    test("client.a:resource:action", "client.**:resource:action", false),
    true
  );
  t.is(
    test("client.a.b:resource:action", "client.**:resource:action", false),
    true
  );
  t.is(
    test("client.**:resource:action", "client:resource:action", false),
    false
  );
  t.is(
    test("client.**:resource:action", "client:resource.a:action", false),
    false
  );
  t.is(
    test("client:resource:action", "client.**:resource:action", false),
    false
  );
  t.is(
    test("client:resource:action", "client.**:resource.a:action", false),
    false
  );
  t.is(
    test("client.**:resource:action", "client.a:wrongresource:action", false),
    false
  );
  t.is(
    test("client.**:resource:action", "client.a:resource:wrongaction", false),
    false
  );
});
t("can (loose) - should match an array of scope rules", t => {
  t.is(
    test(
      ["client.b:resource:action", "client.c:resource:action"],
      "client.a:resource:action",
      false
    ),
    false
  );
  t.is(
    test(
      ["client.b:resource:action", "client.*:resource:action"],
      "client.a:resource:action",
      false
    ),
    true
  );
  t.is(
    test(
      ["client.b:resource:action", "client.a:resource:action"],
      "client.*:resource:action",
      false
    ),
    true
  );
  t.is(
    test(
      ["client.*:resource:action", "client.b:resource:action"],
      "client.a:resource:action",
      false
    ),
    true
  );
});

([
  { args: [["a:b:c"], ["a:b:c"]], results: ["a:b:c"] },
  { args: [["*:b:c"], ["a:b:c"]], results: ["a:b:c"] },
  { args: [["*:b:c"], ["*:b:c"]], results: ["*:b:c"] },
  { args: [["**:b:c"], ["**:b:c"]], results: ["**:b:c"] },
  { args: [["*:b:c"], ["**:b:c"]], results: ["*:b:c"] },
  { args: [["**:b:c"], ["foo.**:b:c"]], results: ["foo.**:b:c"] },
  { args: [["**:b:c"], ["foo.*:b:c"]], results: ["foo.*:b:c"] },
  { args: [["*.y:b:c"], ["x.*:b:c"]], results: ["x.y:b:c"] },
  { args: [["*.y:b:c"], ["x.**:b:c"]], results: ["x.y:b:c"] },
  { args: [["**.y:b:c"], ["x.**:b:c"]], results: ["x.**.y:b:c", "x.y:b:c"] },
  { args: [["*.**:b:c"], ["**.*:b:c"]], results: ["*.**:b:c"] },
  { args: [["**.*:b:c"], ["*.**:b:c"]], results: ["*.**:b:c"] },
  { args: [["**.**:b:c"], ["*.**:b:c"]], results: ["*.**:b:c"] },
  { args: [["**.**:b:c"], ["*.*.*:b:c"]], results: ["*.*.*:b:c"] },
  { args: [["*.*.*:b:c"], ["**.**:b:c"]], results: ["*.*.*:b:c"] },
  { args: [["foo.*:b:c"], ["foo.*:b:c"]], results: ["foo.*:b:c"] },
  { args: [["foo.**:b:c"], ["foo.*:b:c"]], results: ["foo.*:b:c"] },
  { args: [["*.y:*:c"], ["x.*:b:*"]], results: ["x.y:b:c"] },
  { args: [["*:**:c"], ["**:*:c"]], results: ["*:*:c"] },
  { args: [["*.*.c:y:z"], ["a.**:y:z"]], results: ["a.*.c:y:z"] },
  { args: [["a.**:x:x"], ["**.b:x:x"]], results: ["a.**.b:x:x", "a.b:x:x"] },
  { args: [["x:b:c"], ["a:b:c"]], results: [] },
  { args: [["x:*:c"], ["a:b:c"]], results: [] },
  { args: [["x:**:c"], ["a:b:c"]], results: [] },
  { args: [["**:b:c", "a:**:c"], ["a:b:c", "x:y:c"]], results: ["a:b:c"] }
] as { args: [string[], string[]]; results: string[] }[]).forEach(row => {
  t("limit - (" + row.args.join(") ∩ (") + ") => " + row.results, t => {
    t.deepEqual(limit(...row.args), row.results);
  });
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
  t("simplify - (" + row.args.join(") • (") + ") => " + row.results, t => {
    t.deepEqual(simplify(...row.args).sort(), row.results.sort());
  });
});
