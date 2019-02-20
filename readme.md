[![Build Status](https://travis-ci.org/the-control-group/scopeutils.svg?branch=master)](https://travis-ci.org/the-control-group/scopeutils)

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

## Usage

Install with `npm install --save scopeutils`

```js
import {
  validate,
  normalize,
  can,
  combine,
  combineCollections,
  simplifyCollection
} from "scopeutils";

validate("realm:resource.identifier:action");
// => true

normalize("realm:**.**:action");
// => 'realm:**:action'

// strict mode enabled (default)
can("realm:**:action", "realm:resource.identifier:action", true);
// => true

// strict mode disabled
can("realm:resource.*:action", "realm:resource.**:action", false);
// => true

combine("realm:resource.*:action", "realm:**:action");
// => 'realm:resource.*:action'

combineCollections(["realm:resource.*:action"], ["realm:**:action"]);
// => ['realm:resource.*:action']

simplifyCollection(["realm:resource.*:action", "realm:**:action"]);
// => ['realm:**:action']
```

Please see the tests for complete examples.
