import {alias} from '@ember/object/computed';

import Id from '../id';
import {Atom} from '../atom';
import PersistedArray from '../persisted-atom-array';

export type LWWAtom<Content> = Atom<Content, 'write', Id|null>

export default class LWW<Content>{
  id: string;
  defaultValue: Content;
  atoms: PersistedArray<LWWAtom<Content>>;
  store: any;

  constructor(
      id: string,
      defaultValue: Content,
      atoms: PersistedArray<LWWAtom<Content>>,
      store: any,
  ) {
    this.id = id;
    this.defaultValue = defaultValue;
    this.atoms = atoms;
    this.store = store;
  }

  @alias('atoms.atoms') _atoms!: Array<LWWAtom<Content>>;

  get value(): Content {
    if (this._atoms.length) {
      return this._atoms[this._atoms.length-1].value;
    } else {
      return this.defaultValue;
    }
  }

  set value(val: Content) {
    if (val !== this.value) {
      let prev = this._atoms[this._atoms.length-1];
      let prevId = prev && prev.id || null;
      let a: LWWAtom<Content> = {
        id: this.store.nextId() as Id,
        collectionId: this.id,
        type: 'write',
        locator: prevId,
        value: val,
      };
      this.atoms.push(a);
    }
  }
};
