import {set} from '@ember/object';
import {computed} from '@ember-decorators/object';

import {promisifyReq} from 'nomicon/lib/idb_utils';
import Id from '../id';
import {Atom} from '../atom';

export default class LWW<Content>{
  atoms: Array<Atom<Content, 'write', Id|null>> = [];
  constructor(
      public id: String,
      public store: any,
      public defaultValue: Content,
  ) {}

  @computed('atoms.[]')
  get value(): Content {
    if (this.atoms.length) {
      return this.atoms[this.atoms.length-1].value;
    } else {
      return this.defaultValue;
    }
  }

  set value(val: Content) {
    if (val !== this.value) {
      let prev = this.atoms[this.atoms.length-1];
      let prevId = prev && prev.id || null;
      let a = {
        id: this.store.nextId() as Id,
        collectionId: this.id,
        type: <'write'> 'write',
        locator: prevId,
        value: val,
      };
      this.atoms.push(a);
      this.store.persistAtom(a);
    }
  }

  async load(tx: IDBTransaction) {
    let atoms = tx.objectStore('atoms').index('collection');
    set(this, 'atoms', await promisifyReq(atoms.getAll(IDBKeyRange.only(this.id))));
  }
};
