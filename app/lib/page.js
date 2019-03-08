import EmberObject, {computed} from '@ember/object';
import {alias, not} from '@ember/object/computed';

export default EmberObject.extend({
  store: null,
  atomId: null,

  // These are stored directly in IndexedDB
  id: '',
  homeCollectionId: '',
  titleCollectionId: '',
  bodyCollectionId: '',

  // These are assigned by the store in _buildIdentityMap,
  // as Link objects
  incoming: computed(()=>[]),
  outgoing: computed(()=>[]),

  // These are ORDTs assigned by the store in _buildIdentityMap
  _home: null,
  _title: null,
  _body: null,

  home: alias('_home.value'),
  title: alias('_title.value'),
  body: alias('_body.value'),

  serialize() {
    return {
      id: this.id,
      homeId: this._home.id,
      titleId: this._title.id,
      bodyId: this._body.id,
    };
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
