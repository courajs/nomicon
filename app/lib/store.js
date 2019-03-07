import EmberObject from '@ember/object';

import uuid from 'uuid/v4';

import {promisifyReq, promisifyTx} from 'nomicon/lib/idb_utils';
import Site from './site';
import Page from './page';
import Link from './link';
import LWW from './ordts/lww';
import PageGraph from './ordts/page-graph';

export async function makeStore() {
  let mainGraphCollectionId = window.localStorage.NomiconGraphCollectionId;
  if (!mainGraphCollectionId) {
    window.localStorage.NomiconGraphCollectionId = mainGraphCollectionId = uuid();
  }

  let db = await new Promise(function(resolve, reject) {
    let req = window.indexedDB.open("nomicon");
    req.onerror = reject;
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = function(e) {
      let db = e.target.result;

      let atoms = db.createObjectStore('atoms', {keyPath: ['id.lamport', 'id.site']});
      atoms.createIndex('collection', 'collectionId', {unique: false});
    }
  });

  let store = Store.create({db, site: Site.load(), id: mainGraphCollectionId});
  await store.ready;
  return store;
}

export const Store = EmberObject.extend({
  id: '',
  db: null,
  site: null,
  _map: null,
  graph: null,

  init() {
    this._super(...arguments);
    this.ready = this._buildIdentityMap();
  },

  nextId() {
    return this.site.nextId();
  },

  getPage(id) {
    return this._map.get(id);
  },

  allPages() {
    // TODO: make this a live array
    return Array.from(this._map.values());
  },

  async newPage(attrs) {
    let p = await this.graph.createPage();
    let page = Page.create({
      id: p.value.uuid,
      atomId: p.id,
      store: this,
      _home: LWW.create({id: p.value.homeCollectionId, store: this}),
      _title: LWW.create({id: p.value.titleCollectionId, store: this}),
      _body: LWW.create({id: p.value.bodyCollectionId, store: this}),
    });
    this._map.set(page.id, page);
    if (attrs && attrs.title) {
      page.set('title', attrs.title);
    }
    return page;
  },

  async persistAtom(a) {
    let tx = this.db.transaction('atoms', 'readwrite');
    tx.objectStore('atoms').add(a);
    return promisifyTx(tx);
  },

  async destroyPage(page) {
    let ps = [];
    ps.push(this.graph.deleteItem(page.atomId));
    ps = ps.concat(page.incoming.map(l => this.graph.deleteItem(l.id))); 
    ps = ps.concat(page.outgoing.map(l => this.graph.deleteItem(l.id))); 

    page.incoming.forEach((l) => l.from.outgoing.removeObject(l));
    page.outgoing.forEach((l) => l.to.incoming.removeObject(l));
    this._map.delete(page.id);

    return Promise.all(ps);
  },

  async destroyLink(link) {
    await this.graph.deleteItem(link.id);

    link.from.outgoing.removeObject(link);
    link.to.incoming.removeObject(link);
    link.destroy();
  },

  async insertLink(fromUUID, toUUID) {
    let l = await this.graph.createLink(fromUUID, toUUID);
    let from = this._map.get(fromUUID);
    let to = this._map.get(toUUID);
    let link = Link.create({
      id: l.id,
      from,
      to,
      store: this,
    });
    from.outgoing.pushObject(link);
    to.incoming.pushObject(link);
    return link;
  },

  async _buildIdentityMap() {
    let tx = this.db.transaction('atoms');
    this._map = new Map();
    let atoms = tx.objectStore('atoms').index('collection');
    let graphAtoms = await promisifyReq(atoms.getAll(IDBKeyRange.only(this.id)));
    let graph = this.graph = PageGraph.create({
      id: this.id,
      atoms: graphAtoms,
      store: this,
    });
    let {pages, links} = graph.process();

    let _pageAttributes = [];
    for (let p of pages) {
      let page = Page.create({
        store: this,
        id: p.value.uuid,
        atomId: p.id,
        _home: LWW.create({id: p.value.homeCollectionId, store: this}),
        _title: LWW.create({id: p.value.titleCollectionId, store: this}),
        _body: LWW.create({id: p.value.bodyCollectionId, store: this}),
      });
      _pageAttributes.push(
        page._home.load(tx),
        page._title.load(tx),
        page._body.load(tx),
      );
      this._map.set(p.value.uuid, page);
    }

    for (let l of links) {
      let from = this._map.get(l.value.from);
      let to = this._map.get(l.value.to);
      let link = Link.create({
        id: l.id,
        from,
        to,
      });
      from.outgoing.push(link);
      to.incoming.push(link);
    }
    
    await Promise.all(_pageAttributes);
  },
});

export default Store;
