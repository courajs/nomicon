import EmberObject, {computed} from '@ember/object';

import {promisifyReq} from 'nomicon/lib/idb_utils';
import Atom from '../atom';

export default EmberObject.extend({
  id: '',
  atoms: computed(()=>[]),
  defaultValue: null,

  store: null,

  value: computed('atoms.[]', {
    get() {
      if (this.atoms.length) {
        return this.atoms[this.atoms.length-1].value;
      } else {
        return this.defaultValue;
      }
    },
    set(key, val){
      if (val !== this.value) {
        let prev = this.atoms[this.atoms.length-1];
        let prevId = prev && prev.id || null;
        let a = new Atom({
          id: this.store.nextId(),
          collectionId: this.id,
          type: 'write',
          locator: prevId,
          value: val,
        });
        this.atoms.push(a);
        this.store.persistAtom(a);
      }
      return val;
    }
  }),

  async load(tx) {
    let atoms = tx.objectStore('atoms').index('collection');
    this.set('atoms', await promisifyReq(atoms.getAll(IDBKeyRange.only(this.id))));
    return this;
  }
});
