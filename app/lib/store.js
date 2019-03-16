import EmberObject from '@ember/object';

import uuid from 'uuid/v4';
import {wrap} from 'idb';

import {promisifyReq, promisifyTx} from 'nomicon/lib/idb_utils';
import Site from './site';
import Page from './page';
import Link from './link';
import LWW from './ordts/lww';
import PageGraph from './ordts/page-graph';
import PersistedArray from './persisted-atom-array';

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
    let db = wrap(this.db);

    let id = p.value.homeCollectionId;
    let col = new PersistedArray(id, [], db);
    let home = new LWW(id, false, col, this);

    id = p.value.titleCollectionId;
    col = new PersistedArray(id, [], db);
    let title = new LWW(id, '', col, this);

    id = p.value.bodyCollectionId;
    col = new PersistedArray(id, [], db);
    let body = new LWW(id, '', col, this);

    let page = Page.create({
      id: p.value.uuid,
      atomId: p.id,
      store: this,
      _home: home,
      _title: title,
      _body: body,
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

    let idbthing = wrap(this.db);

    let _pages = [];
    for (let p of pages) {
      let p2 = Promise.all([
          PersistedArray.load(p.value.homeCollectionId, idbthing),
          PersistedArray.load(p.value.titleCollectionId, idbthing),
          PersistedArray.load(p.value.bodyCollectionId, idbthing),
      ]).then(([home, title, body]) => {
        let page = Page.create({
          store: this,
          id: p.value.uuid,
          atomId: p.id,
          _home: new LWW(p.value.homeCollectionId, false, home, this),
          _title: new LWW(p.value.titleCollectionId, '', title, this),
          _body: new LWW(p.value.bodyCollectionId, '', body, this),
        });
        this._map.set(p.value.uuid, page);
      });
      _pages.push(p2);
    }

    // await Promise.all(_pages);
    // ^ was causing typescript build to hang
    // here's a dumb workaround.
    // maybe https://github.com/typed-ember/ember-cli-typescript/issues/337
    for (let p of _pages) {
      await p;
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
  },
});

export default Store;
