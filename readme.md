[![Build Status](https://travis-ci.org/the-control-group/scopeutils.svg?branch=master)](https://travis-ci.org/the-control-group/scopeutils) [![Current version](https://badgen.net/npm/v/fs-capacitor)](https://www.npmjs.com/package/scopeutils) [![Supported Node.js versions](https://badgen.net/npm/node/fs-capacitor)](https://github.com/nodejs/Release)

# Scope Utils

This is a small collection of utility functions for creating, manipulating, and verifying (AuthX)[https://github.com/the-control-group/authx] scopes. These scopes are human-readable, pattern-matching, combinable, and fully OAuth2-compatible. Please see (the AuthX repo)[https://github.com/the-control-group/authx] for more details.

## Anatomy of a scope

Scopes are composed of 3 domains, separated by the `:` character:

```
AuthX:role.abc:read
|___| |______| |__|
  |      |       |
realm resource  action

```

Each domain can contain parts, separated by the `.` character. Domain parts can be `/[a-zA-Z0-9_]*/` strings or glob pattern identifiers `*` or `**`:

```
role.abc
role.*
**
```

## Installation

Install with `npm install --save scopeutils`

## Usage

**_Please see [the tests](src/test.mjs) for complete examples._**

#### validate(scope: string) -> boolean

Validate that a scope is correctly formatted.

```js
import { validate } from "scopeutils";
validate("realm:resource.identifier:action");
// => true
```

#### normalize(scope: string) -> string

Normalize a scope into its simplest representation.

```js
import { normalize } from "scopeutils";
normalize("realm:**.**:action");
// => 'realm:**:action'
```

#### can(rule: string | Array<string>, subject: string, strict?: bool = true)

Check that the scope or scopes in `rule` permit the scope `subject`.

- If strict is set to `true` or left `undefined`, the function returns `true` only if `rule` is a strict superset of `subject`. This is appropriate for most use cases, such as checking if a user can perform the action represented in `subject`.
- If strict is set to `false`, the function returns `true` if `rule` and `subject` intersect at all. This is useful when checking if a user can perform any subset of the actions represented by the `subject` scope.

```js
import { can } from "scopeutils";

// strict mode enabled (default)
can("realm:**:action", "realm:resource.identifier:action", true);
// => true

// strict mode disabled
can("realm:resource.*:action", "realm:resource.**:action", false);
// => true
```

#### combine(a: string, b: string) -> null | string

Find the intersection (the most permissive common scope) of scopes `a` and `b`.

```js
import { combine } from "scopeutils";
combine("realm:resource.*:action", "realm:**:action");
// => 'realm:resource.*:action'
```

#### combineCollections(collectionA: Array<string>, collectionB: Array<string>) -> Array<string>

Find all the intersections between the scopes in `collectionA` and the scopes in `collectionB`.

```js
import { combineCollections } from "scopeutils";
combineCollections(["realm:resource.*:action"], ["realm:**:action"]);
// => ['realm:resource.*:action']
```

### simplifyCollection(collection: Array<string>) -> Array<string>

Get an array of the most permissive scopes in `collection`, omiting any scopes that are a subset of another scope in the collection.

```js
import { simplifyCollection } from "scopeutils";
simplifyCollection(["realm:resource.*:action", "realm:**:action"]);
// => ['realm:**:action']
```
