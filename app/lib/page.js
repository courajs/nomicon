import EmberObject, {computed} from '@ember/object';
import {not} from '@ember/object/computed';

import {promisifyTx} from 'nomicon/lib/idb_utils';
import Atom from './atom';

export default EmberObject.extend({
  store: null,

  // These are stored directly in IndexedDB
  id: '',
  home: false,
  homeCollectionId: '',
  titleCollectionId: '',
  bodyCollectionId: '',

  // These are assigned by the store in _buildIdentityMap,
  // as Link objects
  incoming: [],
  outgoing: [],

  // These are populated by the store in _buildIdentityMap
  homeAtoms: [],
  titleAtoms: [],
  bodyAtoms: [],

  init() {
    this._super(...arguments);
    this.incoming = [];
    this.outgoing = [];
    this.homeAtoms = [];
    this.titleAtoms = [];
    this.bodyAtoms = [];
  },

  home: computed('homeAtoms.[]', {
    get(key) {
      if (this.homeAtoms.length) {
        return this.homeAtoms[this.homeAtoms.length-1].value;
      }
      else return '';
    },
    set(key, val) {
      if (val !== this.home) {
        let a = new Atom({
          id: this.store.nextId(),
          collectionId: this.homeCollectionId,
          type: 'write',
          parentId: null,
          value: val,
        });
        this.homeAtoms.push(a);
        this.store.persistAtom(a);
      }
      return val;
    }
  }),

  title: computed('titleAtoms.[]', {
    get(key) {
      if (this.titleAtoms.length) {
        return this.titleAtoms[this.titleAtoms.length-1].value;
      }
      else return '';
    },
    set(key, val) {
      if (val !== this.title) {
        let a = new Atom({
          id: this.store.nextId(),
          collectionId: this.titleCollectionId,
          type: 'write',
          parentId: null,
          value: val,
        });
        this.titleAtoms.push(a);
        this.store.persistAtom(a);
      }
      return val;
    }
  }),

  body: computed('bodyAtoms.[]', {
    get(key) {
      if (this.bodyAtoms.length) {
        return this.bodyAtoms[this.bodyAtoms.length-1].value;
      }
      else return '';
    },
    set(key, val) {
      if (val !== this.body) {
        let a = new Atom({
          id: this.store.nextId(),
          collectionId: this.bodyCollectionId,
          type: 'write',
          parentId: null,
          value: val,
        });
        this.bodyAtoms.push(a);
        this.store.persistAtom(a);
      }
      return val;
    }
  }),

  serialize() {
    return this.getProperties(
        'id',
        'homeCollectionId', 
        'titleCollectionId',
        'bodyCollectionId',
      );
  },

  numPeers: computed('{incoming,outgoing}.[]', function() {
    return this.incoming.length + this.outgoing.length;
  }),
  stub: not('body'),

  async linkTo(otherId) {
    return this.store.insertLink(this.id, otherId);
  },
  async linkFrom(otherId) {
    return this.store.insertLink(otherId, this.id);
  },

  // When we remove a page from the graph, we remove all references to its links
  // on the other side, but leave them on the now-orphaned page. So then when the
  // page is later destroyed, it can also destroy all its dangling links.
  willDestroy() {
    this.incoming.forEach(l => l.destroy());
    this.outgoing.forEach(l => l.destroy());
    this._super(...arguments);
  },
});
