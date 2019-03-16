import {computed} from '@ember-decorators/object';
import {alias} from '@ember-decorators/object/computed';

import Id from '../id';
import {Atom} from '../atom';
import PersistedArray from '../persisted-atom-array';

type A<Content> = Atom<Content, 'write', Id|null>

export default class LWW<Content>{
  constructor(
      public id: string,
      public defaultValue: Content,
      private atoms: PersistedArray<A<Content>>,
      private store: any,
  ) {}

  @alias('atoms.atoms') _atoms!: Array<A<Content>>;

  @computed('_atoms.[]')
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
      let a: A<Content> = {
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
