import { module, test } from 'qunit';
import Id from 'nomicon/lib/id';
import {Atom} from 'nomicon/lib/atom';

import {resolve, mergeAtoms} from 'nomicon/lib/functional-ordts/lww';

type StringAtom = Atom<string, 'write', null>;

function makeAtom(id: Id, value: string = ''): StringAtom {
  return {
    id,
    collectionId: 'q',
    type: 'write',
    locator: null,
    value,
  };
}
let a1 = new Id('a', 1, 1);
let a2 = new Id('a', 2, 2);
let b1 = new Id('b', 1, 1);
let b2 = new Id('b', 2, 2);

module('Unit | ORDTS | Last Write Wins', function(hooks) {
  test('it defaults to null', function(assert) {
    let emptystr: Array<StringAtom> = [];
    assert.deepEqual(resolve(emptystr), null);
  });

  test('it resolves to the value of the latest atom', function(assert) {
    let ary: Array<StringAtom> = [
      makeAtom(a1),
      makeAtom(a2, 'yes'),
    ];

    assert.deepEqual(resolve(ary), 'yes');
  });

  test('It orders new atoms based on their lamport', function(assert) {
    let a = makeAtom(a1);
    let b = makeAtom(a2);

    assert.deepEqual(mergeAtoms([], [a]), [a]);
    assert.deepEqual(mergeAtoms([b], [a]), [a, b]);
  });

  test('It orders tied lamports based on their site id', function(assert) {
    let a = makeAtom(a1);
    let b = makeAtom(b1);

    assert.deepEqual(mergeAtoms([], [b, a]), [a, b]);
  });

  // Make sure we don't break because of new atom ordering
  test('It orders all new atoms correctly', function(assert) {
    let a = makeAtom(a1);
    let b = makeAtom(a2);
    assert.deepEqual(mergeAtoms([], [a, b]), mergeAtoms([], [b, a]));
  });

  test('It makes a new atom pointing to end of list', function(assert) {
    
    // Still have to figure out how we're handling ids here.
  });
});
