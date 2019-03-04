[![Build Status](https://travis-ci.org/the-control-group/scopeutils.svg?branch=master)](https://travis-ci.org/the-control-group/scopeutils) [![Current version](https://badgen.net/npm/v/scopeutils)](https://www.npmjs.com/package/scopeutils) [![Supported Node.js versions](https://badgen.net/npm/node/scopeutils)](https://github.com/nodejs/Release)

# Scope Utils

This is a small collection of utility functions for [AuthX](https://github.com/the-control-group/authx) scopes. These scopes are human-readable, fully OAuth2-compatible, and support both pattern matching and set algebra. Please visit [the AuthX repo](https://github.com/the-control-group/authx) to see it in action.

## Anatomy of a scope

Scopes are composed of 3 domains, separated by the `:` character:

```
AuthX:role.abc:read
|___| |______| |__|
  |      |       |
realm  resource  action

```

Each domain can contain segments, separated by the `.` character. Domain segments can be `/[a-zA-Z0-9_]*/` strings or glob pattern identifiers `*` or `**`:

```
role.abc
role.*
**
```

## Installation

Install with `npm install --save scopeutils`

## Usage

Please see [the tests](src/index.test.ts) for complete examples.

### `validate(scope: string): boolean`

Validate that a scope is correctly formatted.

```js
import { validate } from "scopeutils";

validate("realm:resource.identifier:action");
// => true

validate("realm:resource.***:action");
// => false
```

### `normalize(scope: string): string`

- **_throws `InvalidScopeError` if the scope is invalid._**

Normalize a scope into its simplest representation.

```js
import { normalize } from "scopeutils";

normalize("realm:**.**:action");
// => 'realm:*.**:action'
```

### `test(rule: string | string[], subject: string, strict: boolean = true): boolean`

- **_throws `InvalidScopeError` if any `rule` or `subject` scope is invalid._**

Check that the scope or scopes in `rule` permit the scope `subject`.

- If strict is set to `true` or left `undefined`, the function returns `true` only if `rule` is a superset of or equal to `subject`. This is appropriate for most use cases, such as checking if a user can perform the action represented in `subject`.
- If strict is set to `false`, the function returns `true` if `rule` and `subject` intersect at all. This is useful when checking if a user can perform any subset of the actions represented by the `subject` scope.

```js
import { test } from "scopeutils";

// strict mode (default)

test(["realm:**:action"], "realm:resource.identifier:action");
// => true

test(["realm:resource.*:**"], "realm:**:action");
// => false

// loose mode

test(["realm:resource.*:**"], "realm:**:action", false);
// => true

test(["realm:resource.*:**"], "realm2:**:action", false);
// => false
```

### `simplify(collection: string[]): string[]`

- **_throws `InvalidScopeError` if any scopes in `collection` are invalid._**

Simplify the collection of scopes in `collection` by omiting any scopes that are a made redundant by another scope in the collection. All scopes in the returned collection are normalized.

```js
import { simplifyCollection } from "scopeutils";

simplifyCollection(["realm:resource.*:action", "realm:**:action"]);
// => ['realm:**:action']
```

### `limit(scopesA: string[], scopesB: string[]): string[]`

- **_throws `InvalidScopeError` if any scopes in `scopesA` or `scopesB` are invalid._**

Limit the collection of scopes in `collectionA` by the collection of scopes in `collectionB`, returning a collection of scopes that represent all intersections, or every ability common to both inputs.

```js
import { limit } from "scopeutils";

limit(["realm:resource.*:action.*"], ["realm:**:action.read"]);
// => ['realm:resource.*:action.read']
```
