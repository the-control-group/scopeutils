'use strict';

import { assert } from 'chai';
import {
	validate,
	normalize,
	can,
	combine,
	combineCollections,
	simplifyCollection
} from '../src/index.js';

describe('scopes', () => {
	describe('validate', () => {
		it('should return false for invalid scopes', () => {
			assert.isFalse(validate('client'));
			assert.isFalse(validate('client:'));
			assert.isFalse(validate('client:resource'));
			assert.isFalse(validate('client:resource:'));
			assert.isFalse(validate('client:resource:action:'));
			assert.isFalse(validate('a.%:resource:action'));
			assert.isFalse(validate('a*.b:resource:action'));
		});
		it('should return true for valid scopes', () => {
			assert.isTrue(validate('client:resource:action'));
			assert.isTrue(validate('a.b.c:d.e.f:g.h.i'));
			assert.isTrue(validate('*.b.c:d.*.f:g.h.*'));
			assert.isTrue(validate('**.b.c:d.**.f:g.h.**'));
			assert.isTrue(validate('*:*:*'));
			assert.isTrue(validate('**:**:**'));
		});
	});

	describe('normalize', () => {
		it('should leave simple scopes in tact', () => {
			assert.equal(normalize('client:resource:action:'), 'client:resource:action:');
			assert.equal(normalize('a.b.c:resource:action:'), 'a.b.c:resource:action:');
		});
		it('should leave single wildcards in their place', () => {
			assert.equal(normalize('*.*.c:resource:action:'), '*.*.c:resource:action:');
			assert.equal(normalize('*.b.*:resource:action:'), '*.b.*:resource:action:');
			assert.equal(normalize('a.*.*:resource:action:'), 'a.*.*:resource:action:');
			assert.equal(normalize('*.*.*:resource:action:'), '*.*.*:resource:action:');
		});
		it('should move double wildcards to the end', () => {
			assert.equal(normalize('*.**.c:resource:action:'), '*.**.c:resource:action:');
			assert.equal(normalize('**.*.c:resource:action:'), '*.**.c:resource:action:');
			assert.equal(normalize('**.b.*:resource:action:'), '**.b.*:resource:action:');
			assert.equal(normalize('*.b.**:resource:action:'), '*.b.**:resource:action:');
			assert.equal(normalize('**.b.**:resource:action:'), '**.b.**:resource:action:');
			assert.equal(normalize('a.**.*:resource:action:'), 'a.*.**:resource:action:');
			assert.equal(normalize('a.*.**:resource:action:'), 'a.*.**:resource:action:');
			assert.equal(normalize('**.*.*:resource:action:'), '*.*.**:resource:action:');
			assert.equal(normalize('*.**.*:resource:action:'), '*.*.**:resource:action:');
			assert.equal(normalize('*.*.**:resource:action:'), '*.*.**:resource:action:');
		});
		it('should deduplicate consecutive double wildcards', () => {
			assert.equal(normalize('**.**.c:resource:action:'), '*.**.c:resource:action:');
			assert.equal(normalize('*.**.**:resource:action:'), '*.*.**:resource:action:');
			assert.equal(normalize('**.*.**:resource:action:'), '*.*.**:resource:action:');
			assert.equal(normalize('**.**.**:resource:action:'), '*.*.**:resource:action:');
		});
	});

	describe('can (strict)', () => {
		it('should match simple scopes', () => {
			assert.isTrue(can('client:resource:action', 'client:resource:action'));
			assert.isFalse(can('client:resource:action', 'wrongclient:resource:action'));
			assert.isFalse(can('client:resource:action', 'client:wrongresource:action'));
			assert.isFalse(can('client:resource:action', 'client:resource:wrongaction'));
			assert.isFalse(can('client:resource:action', 'client.a:resource.b:action.c'));
		});
		it('should match single-star globs', () => {
			assert.isTrue(can('client.*:resource:action', 'client.a:resource:action'));
			assert.isTrue(can('client.*:resource:action', 'client.*:resource:action'));
			assert.isFalse(can('client.*:resource:action', 'client.**:resource:action'));
			assert.isFalse(can('client.a:resource:action', 'client.*:resource:action'));
			assert.isFalse(can('client.*:resource:action', 'client:resource:action'));
			assert.isFalse(can('client.*:resource:action', 'client:resource.a:action'));
			assert.isFalse(can('client.*:resource:action', 'client.a.b:resource:action'));
			assert.isFalse(can('client.*:resource:action', 'client.a:wrongresource:action'));
			assert.isFalse(can('client.*:resource:action', 'client.a:resource:wrongaction'));
		});
		it('should match multi-star globs', () => {
			assert.isTrue(can('client.**:resource:action', 'client.a:resource:action'));
			assert.isTrue(can('client.**:resource:action', 'client.a.b:resource:action'));
			assert.isFalse(can('client.a:resource:action', 'client.**:resource:action'));
			assert.isFalse(can('client.a.b:resource:action', 'client.**:resource:action'));
			assert.isFalse(can('client.**:resource:action', 'client:resource:action'));
			assert.isFalse(can('client.**:resource:action', 'client:resource.a:action'));
			assert.isFalse(can('client:resource:action', 'client.**:resource:action'));
			assert.isFalse(can('client:resource:action', 'client.**:resource.a:action'));
			assert.isFalse(can('client.**:resource:action', 'client.a:wrongresource:action'));
			assert.isFalse(can('client.**:resource:action', 'client.a:resource:wrongaction'));
		});
		it('should match an array of scope rules', () => {
			assert.isFalse(can(['client.b:resource:action', 'client.c:resource:action'], 'client.a:resource:action'));
			assert.isTrue(can(['client.b:resource:action', 'client.*:resource:action'], 'client.a:resource:action'));
			assert.isFalse(can(['client.b:resource:action', 'client.a:resource:action'], 'client.*:resource:action'));
			assert.isTrue(can(['client.*:resource:action', 'client.b:resource:action'], 'client.a:resource:action'));
		});
	});

	describe('can (loose)', () => {
		it('should match simple scopes', () => {
			assert.isTrue(can('client:resource:action', 'client:resource:action', false));
			assert.isFalse(can('client:resource:action', 'wrongclient:resource:action', false));
			assert.isFalse(can('client:resource:action', 'client:wrongresource:action', false));
			assert.isFalse(can('client:resource:action', 'client:resource:wrongaction', false));
			assert.isFalse(can('client:resource:action', 'client.a:resource.b:action.c', false));
		});
		it('should match single-star globs', () => {
			assert.isTrue(can('client.*:resource:action', 'client.a:resource:action', false));
			assert.isTrue(can('client.*:resource:action', 'client.*:resource:action', false));
			assert.isTrue(can('client.*:resource:action', 'client.**:resource:action', false));
			assert.isTrue(can('client.a:resource:action', 'client.*:resource:action', false));
			assert.isFalse(can('client.*:resource:action', 'client:resource:action', false));
			assert.isFalse(can('client.*:resource:action', 'client:resource.a:action', false));
			assert.isFalse(can('client.*:resource:action', 'client.a.b:resource:action', false));
			assert.isFalse(can('client.*:resource:action', 'client.a:wrongresource:action', false));
			assert.isFalse(can('client.*:resource:action', 'client.a:resource:wrongaction', false));
		});
		it('should match multi-star globs', () => {
			assert.isTrue(can('client.**:resource:action', 'client.a:resource:action', false));
			assert.isTrue(can('client.**:resource:action', 'client.a.b:resource:action', false));
			assert.isTrue(can('client.a:resource:action', 'client.**:resource:action', false));
			assert.isTrue(can('client.a.b:resource:action', 'client.**:resource:action', false));
			assert.isFalse(can('client.**:resource:action', 'client:resource:action', false));
			assert.isFalse(can('client.**:resource:action', 'client:resource.a:action', false));
			assert.isFalse(can('client:resource:action', 'client.**:resource:action', false));
			assert.isFalse(can('client:resource:action', 'client.**:resource.a:action', false));
			assert.isFalse(can('client.**:resource:action', 'client.a:wrongresource:action', false));
			assert.isFalse(can('client.**:resource:action', 'client.a:resource:wrongaction', false));
		});
		it('should match an array of scope rules', () => {
			assert.isFalse(can(['client.b:resource:action', 'client.c:resource:action'], 'client.a:resource:action', false));
			assert.isTrue(can(['client.b:resource:action', 'client.*:resource:action'], 'client.a:resource:action', false));
			assert.isTrue(can(['client.b:resource:action', 'client.a:resource:action'], 'client.*:resource:action', false));
			assert.isTrue(can(['client.*:resource:action', 'client.b:resource:action'], 'client.a:resource:action', false));
		});
	});

	describe('combine', () => {
		[
			// simple eg/gt/lt
			{args: ['a:b:c', 'a:b:c'], product: 'a:b:c'},
			{args: ['*:b:c', 'a:b:c'], product: 'a:b:c'},
			{args: ['*:b:c', '*:b:c'], product: '*:b:c'},
			{args: ['**:b:c', '**:b:c'], product: '**:b:c'},
			{args: ['*:b:c', '**:b:c'], product: '*:b:c'},
			{args: ['**:b:c', 'foo.**:b:c'], product: 'foo.**:b:c'},
			{args: ['**:b:c', 'foo.*:b:c'], product: 'foo.*:b:c'},

			// substitution
			{args: ['*.y:b:c', 'x.*:b:c'], product: 'x.y:b:c'},
			{args: ['*.y:b:c', 'x.**:b:c'], product: 'x.y:b:c'},
			{args: ['**.y:b:c', 'x.**:b:c'], product: 'x.y:b:c'},
			{args: ['*.**:b:c', '**.*:b:c'], product: '*.**:b:c'},
			{args: ['**.*:b:c', '*.**:b:c'], product: '*.**:b:c'},
			{args: ['**.**:b:c', '*.**:b:c'], product: '*.**:b:c'},
			{args: ['**.**:b:c', '*.*.*:b:c'], product: '*.*.*:b:c'},
			{args: ['*.*.*:b:c', '**.**:b:c'], product: '*.*.*:b:c'},
			{args: ['foo.*:b:c', 'foo.*:b:c'], product: 'foo.*:b:c'},
			{args: ['foo.**:b:c', 'foo.*:b:c'], product: 'foo.*:b:c'},
			{args: ['*.y:*:c', 'x.*:b:*'], product: 'x.y:b:c'},
			{args: ['*:**:c', '**:*:c'], product: '*:*:c'},

			// FIXME: https://github.com/the-control-group/scopeutils/issues/1
			// {args: ['*.*.c:y:z', 'a.**:y:z'], product: 'a.*.c:y:z'},

			// mismatch
			{args: ['x:b:c', 'a:b:c'], product: null},
			{args: ['x:*:c', 'a:b:c'], product: null},
			{args: ['x:**:c', 'a:b:c'], product: null}

		].forEach((test) => {
			it('(' + test.args.join(') • (') + ') => ' + test.product, () => {
				assert.equal(combine(...test.args), test.product);
			});
		});
	});

	describe('combineCollections', () => {
		[
			{args: [['x:b:c'], ['a:b:c']], results: []},
			{args: [['a:b:c'], ['a:b:c']], results: ['a:b:c']},
			{args: [['*:b:c'], ['**:b:c']], results: ['*:b:c']},
			{args: [['**:b:c'], ['*:b:c']], results: ['*:b:c']},
			{args: [['**:b:c'], ['a:b:c']], results: ['a:b:c']},
			{args: [['**:b:c', 'a:**:c'], ['a:b:c', 'x:y:c']], results: ['a:b:c']}
		].forEach((test) => {
			it('(' + test.args.join(') • (') + ') => ' + test.results, () => {
				assert.deepEqual(combineCollections(...test.args), test.results);
			});
		});
	});

	describe('simplifyCollection', () => {
		[
			{args: [[]], results: []},
			{args: [['x:b:c']], results: ['x:b:c']},
			{args: [['x:b:c', 'a:b:c']], results: ['x:b:c', 'a:b:c']},
			{args: [['a:b:c', 'a:b:c']], results: ['a:b:c']},
			{args: [['*:b:c', 'a:b:c']], results: ['*:b:c']},
			{args: [['*:b:c', '*:b:c']], results: ['*:b:c']},
			{args: [['**:b:c', '**:b:c']], results: ['**:b:c']},
			{args: [['*:b:c', '**:b:c']], results: ['**:b:c']},
			{args: [['**:b:c', 'foo.**:b:c']], results: ['**:b:c']},
			{args: [['**:b:c', 'foo.*:b:c']], results: ['**:b:c']},
			{args: [['*.y:b:c', 'x.*:b:c']], results: ['*.y:b:c', 'x.*:b:c']},
			{args: [['foo.*:b:c', 'foo.*:b:c']], results: ['foo.*:b:c']},
			{args: [['foo.**:b:c', 'foo.*:b:c', 'foo.*:b:c']], results: ['foo.**:b:c']},
			{args: [['foo.**:b:c', 'foo.*:b:c', 'foo.*:b:c', 'foo.a:b:c']], results: ['foo.**:b:c']},
			{args: [['foo.a:b:c', 'foo.*:b:c', 'foo.*:b:c', 'foo.**:b:c']], results: ['foo.**:b:c']},
			{args: [['AuthX:credential.incontact.me:read', 'AuthX:credential.incontact.user:read', 'AuthX:credential.*.me:*']], results: ['AuthX:credential.*.me:*', 'AuthX:credential.incontact.user:read']}

		].forEach((test) => {
			it('(' + test.args.join(') • (') + ') => ' + test.results, () => {
				assert.deepEqual(simplifyCollection(...test.args).sort(), test.results.sort());
			});
		});
	});

});
