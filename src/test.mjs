"use strict";

import t from "tap";
import {
  validate,
  normalize,
  can,
  combine,
  combineCollections,
  simplifyCollection
} from ".";

t.test("scopes", t => {
  t.test("validate", t => {
    t.test("should return false for invalid scopes", t => {
      t.equal(validate("client"), false);
      t.equal(validate("client:"), false);
      t.equal(validate("client:resource"), false);
      t.equal(validate("client:resource:"), false);
      t.equal(validate("client:resource:action:"), false);
      t.equal(validate("a.%:resource:action"), false);
      t.equal(validate("a*.b:resource:action"), false);
      t.end();
    });
    t.test("should return true for valid scopes", t => {
      t.equal(validate("client:resource:action"), true);
      t.equal(validate("a.b.c:d.e.f:g.h.i"), true);
      t.equal(validate("*.b.c:d.*.f:g.h.*"), true);
      t.equal(validate("**.b.c:d.**.f:g.h.**"), true);
      t.equal(validate("*:*:*"), true);
      t.equal(validate("**:**:**"), true);
      t.end();
    });

    t.end();
  });

  t.test("normalize", t => {
    t.test("should leave simple scopes in tact", t => {
      t.equal(normalize("client:resource:action:"), "client:resource:action:");
      t.equal(normalize("a.b.c:resource:action:"), "a.b.c:resource:action:");
      t.end();
    });
    t.test("should leave single wildcards in their place", t => {
      t.equal(normalize("*.*.c:resource:action:"), "*.*.c:resource:action:");
      t.equal(normalize("*.b.*:resource:action:"), "*.b.*:resource:action:");
      t.equal(normalize("a.*.*:resource:action:"), "a.*.*:resource:action:");
      t.equal(normalize("*.*.*:resource:action:"), "*.*.*:resource:action:");
      t.end();
    });
    t.test("should move double wildcards to the end", t => {
      t.equal(normalize("*.**.c:resource:action:"), "*.**.c:resource:action:");
      t.equal(normalize("**.*.c:resource:action:"), "*.**.c:resource:action:");
      t.equal(normalize("**.b.*:resource:action:"), "**.b.*:resource:action:");
      t.equal(normalize("*.b.**:resource:action:"), "*.b.**:resource:action:");
      t.equal(
        normalize("**.b.**:resource:action:"),
        "**.b.**:resource:action:"
      );
      t.equal(normalize("a.**.*:resource:action:"), "a.*.**:resource:action:");
      t.equal(normalize("a.*.**:resource:action:"), "a.*.**:resource:action:");
      t.equal(normalize("**.*.*:resource:action:"), "*.*.**:resource:action:");
      t.equal(normalize("*.**.*:resource:action:"), "*.*.**:resource:action:");
      t.equal(normalize("*.*.**:resource:action:"), "*.*.**:resource:action:");
      t.end();
    });
    t.test("should deduplicate consecutive double wildcards", t => {
      t.equal(normalize("**.**.c:resource:action:"), "*.**.c:resource:action:");
      t.equal(normalize("*.**.**:resource:action:"), "*.*.**:resource:action:");
      t.equal(normalize("**.*.**:resource:action:"), "*.*.**:resource:action:");
      t.equal(
        normalize("**.**.**:resource:action:"),
        "*.*.**:resource:action:"
      );
      t.end();
    });

    t.end();
  });

  t.test("can (strict)", t => {
    t.test("should match simple scopes", t => {
      t.equal(can("client:resource:action", "client:resource:action"), true);
      t.equal(
        can("client:resource:action", "wrongclient:resource:action"),
        false
      );
      t.equal(
        can("client:resource:action", "client:wrongresource:action"),
        false
      );
      t.equal(
        can("client:resource:action", "client:resource:wrongaction"),
        false
      );
      t.equal(
        can("client:resource:action", "client.a:resource.b:action.c"),
        false
      );
      t.end();
    });
    t.test("should match single-star globs", t => {
      t.equal(
        can("client.*:resource:action", "client.a:resource:action"),
        true
      );
      t.equal(
        can("client.*:resource:action", "client.*:resource:action"),
        true
      );
      t.equal(
        can("client.*:resource:action", "client.**:resource:action"),
        false
      );
      t.equal(
        can("client.a:resource:action", "client.*:resource:action"),
        false
      );
      t.equal(can("client.*:resource:action", "client:resource:action"), false);
      t.equal(
        can("client.*:resource:action", "client:resource.a:action"),
        false
      );
      t.equal(
        can("client.*:resource:action", "client.a.b:resource:action"),
        false
      );
      t.equal(
        can("client.*:resource:action", "client.a:wrongresource:action"),
        false
      );
      t.equal(
        can("client.*:resource:action", "client.a:resource:wrongaction"),
        false
      );
      t.end();
    });
    t.test("should match multi-star globs", t => {
      t.equal(
        can("client.**:resource:action", "client.a:resource:action"),
        true
      );
      t.equal(
        can("client.**:resource:action", "client.a.b:resource:action"),
        true
      );
      t.equal(
        can("client.a:resource:action", "client.**:resource:action"),
        false
      );
      t.equal(
        can("client.a.b:resource:action", "client.**:resource:action"),
        false
      );
      t.equal(
        can("client.**:resource:action", "client:resource:action"),
        false
      );
      t.equal(
        can("client.**:resource:action", "client:resource.a:action"),
        false
      );
      t.equal(
        can("client:resource:action", "client.**:resource:action"),
        false
      );
      t.equal(
        can("client:resource:action", "client.**:resource.a:action"),
        false
      );
      t.equal(
        can("client.**:resource:action", "client.a:wrongresource:action"),
        false
      );
      t.equal(
        can("client.**:resource:action", "client.a:resource:wrongaction"),
        false
      );
      t.end();
    });
    t.test("should match an array of scope rules", t => {
      t.equal(
        can(
          ["client.b:resource:action", "client.c:resource:action"],
          "client.a:resource:action"
        ),
        false
      );
      t.equal(
        can(
          ["client.b:resource:action", "client.*:resource:action"],
          "client.a:resource:action"
        ),
        true
      );
      t.equal(
        can(
          ["client.b:resource:action", "client.a:resource:action"],
          "client.*:resource:action"
        ),
        false
      );
      t.equal(
        can(
          ["client.*:resource:action", "client.b:resource:action"],
          "client.a:resource:action"
        ),
        true
      );
      t.end();
    });

    t.end();
  });

  t.test("can (loose)", t => {
    t.test("should match simple scopes", t => {
      t.equal(
        can("client:resource:action", "client:resource:action", false),
        true
      );
      t.equal(
        can("client:resource:action", "wrongclient:resource:action", false),
        false
      );
      t.equal(
        can("client:resource:action", "client:wrongresource:action", false),
        false
      );
      t.equal(
        can("client:resource:action", "client:resource:wrongaction", false),
        false
      );
      t.equal(
        can("client:resource:action", "client.a:resource.b:action.c", false),
        false
      );
      t.end();
    });
    t.test("should match single-star globs", t => {
      t.equal(
        can("client.*:resource:action", "client.a:resource:action", false),
        true
      );
      t.equal(
        can("client.*:resource:action", "client.*:resource:action", false),
        true
      );
      t.equal(
        can("client.*:resource:action", "client.**:resource:action", false),
        true
      );
      t.equal(
        can("client.a:resource:action", "client.*:resource:action", false),
        true
      );
      t.equal(
        can("client.*:resource:action", "client:resource:action", false),
        false
      );
      t.equal(
        can("client.*:resource:action", "client:resource.a:action", false),
        false
      );
      t.equal(
        can("client.*:resource:action", "client.a.b:resource:action", false),
        false
      );
      t.equal(
        can("client.*:resource:action", "client.a:wrongresource:action", false),
        false
      );
      t.equal(
        can("client.*:resource:action", "client.a:resource:wrongaction", false),
        false
      );
      t.end();
    });
    t.test("should match multi-star globs", t => {
      t.equal(
        can("client.**:resource:action", "client.a:resource:action", false),
        true
      );
      t.equal(
        can("client.**:resource:action", "client.a.b:resource:action", false),
        true
      );
      t.equal(
        can("client.a:resource:action", "client.**:resource:action", false),
        true
      );
      t.equal(
        can("client.a.b:resource:action", "client.**:resource:action", false),
        true
      );
      t.equal(
        can("client.**:resource:action", "client:resource:action", false),
        false
      );
      t.equal(
        can("client.**:resource:action", "client:resource.a:action", false),
        false
      );
      t.equal(
        can("client:resource:action", "client.**:resource:action", false),
        false
      );
      t.equal(
        can("client:resource:action", "client.**:resource.a:action", false),
        false
      );
      t.equal(
        can(
          "client.**:resource:action",
          "client.a:wrongresource:action",
          false
        ),
        false
      );
      t.equal(
        can(
          "client.**:resource:action",
          "client.a:resource:wrongaction",
          false
        ),
        false
      );
      t.end();
    });
    t.test("should match an array of scope rules", t => {
      t.equal(
        can(
          ["client.b:resource:action", "client.c:resource:action"],
          "client.a:resource:action",
          false
        ),
        false
      );
      t.equal(
        can(
          ["client.b:resource:action", "client.*:resource:action"],
          "client.a:resource:action",
          false
        ),
        true
      );
      t.equal(
        can(
          ["client.b:resource:action", "client.a:resource:action"],
          "client.*:resource:action",
          false
        ),
        true
      );
      t.equal(
        can(
          ["client.*:resource:action", "client.b:resource:action"],
          "client.a:resource:action",
          false
        ),
        true
      );
      t.end();
    });

    t.end();
  });

  t.test("combine", t => {
    [
      // simple eg/gt/lt
      { args: ["a:b:c", "a:b:c"], product: "a:b:c" },
      { args: ["*:b:c", "a:b:c"], product: "a:b:c" },
      { args: ["*:b:c", "*:b:c"], product: "*:b:c" },
      { args: ["**:b:c", "**:b:c"], product: "**:b:c" },
      { args: ["*:b:c", "**:b:c"], product: "*:b:c" },
      { args: ["**:b:c", "foo.**:b:c"], product: "foo.**:b:c" },
      { args: ["**:b:c", "foo.*:b:c"], product: "foo.*:b:c" },

      // substitution
      { args: ["*.y:b:c", "x.*:b:c"], product: "x.y:b:c" },
      { args: ["*.y:b:c", "x.**:b:c"], product: "x.y:b:c" },
      { args: ["**.y:b:c", "x.**:b:c"], product: "x.y:b:c" },
      { args: ["*.**:b:c", "**.*:b:c"], product: "*.**:b:c" },
      { args: ["**.*:b:c", "*.**:b:c"], product: "*.**:b:c" },
      { args: ["**.**:b:c", "*.**:b:c"], product: "*.**:b:c" },
      { args: ["**.**:b:c", "*.*.*:b:c"], product: "*.*.*:b:c" },
      { args: ["*.*.*:b:c", "**.**:b:c"], product: "*.*.*:b:c" },
      { args: ["foo.*:b:c", "foo.*:b:c"], product: "foo.*:b:c" },
      { args: ["foo.**:b:c", "foo.*:b:c"], product: "foo.*:b:c" },
      { args: ["*.y:*:c", "x.*:b:*"], product: "x.y:b:c" },
      { args: ["*:**:c", "**:*:c"], product: "*:*:c" },

      // FIXME: https://github.com/the-control-group/scopeutils/issues/1
      // {args: ['*.*.c:y:z', 'a.**:y:z'], product: 'a.*.c:y:z'},

      // mismatch
      { args: ["x:b:c", "a:b:c"], product: null },
      { args: ["x:*:c", "a:b:c"], product: null },
      { args: ["x:**:c", "a:b:c"], product: null }
    ].forEach(test => {
      t.test("(" + test.args.join(") • (") + ") => " + test.product, t => {
        t.equal(combine(...test.args), test.product);
        t.end();
      });
    });

    t.end();
  });

  t.test("combineCollections", t => {
    [
      { args: [["x:b:c"], ["a:b:c"]], results: [] },
      { args: [["a:b:c"], ["a:b:c"]], results: ["a:b:c"] },
      { args: [["*:b:c"], ["**:b:c"]], results: ["*:b:c"] },
      { args: [["**:b:c"], ["*:b:c"]], results: ["*:b:c"] },
      { args: [["**:b:c"], ["a:b:c"]], results: ["a:b:c"] },
      { args: [["**:b:c", "a:**:c"], ["a:b:c", "x:y:c"]], results: ["a:b:c"] }
    ].forEach(test => {
      t.test("(" + test.args.join(") • (") + ") => " + test.results, t => {
        t.deepEqual(combineCollections(...test.args), test.results);
        t.end();
      });
    });

    t.end();
  });

  t.test("simplifyCollection", t => {
    [
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
        results: [
          "AuthX:credential.*.me:*",
          "AuthX:credential.incontact.user:read"
        ]
      }
    ].forEach(test => {
      t.test("(" + test.args.join(") • (") + ") => " + test.results, t => {
        t.deepEqual(
          simplifyCollection(...test.args).sort(),
          test.results.sort()
        );
        t.end();
      });
    });
    t.end();
  });

  t.end();
});
