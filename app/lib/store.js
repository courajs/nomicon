import EmberObject from '@ember/object';

import uuid from 'uuid/v4';

import {promisifyReq, promisifyTx} from 'nomicon/lib/idb_utils';
import Site from './site';
import Page from './page';
import Link from './link';

export async function makeStore() {
  let db = await new Promise(function(resolve, reject) {
    let req = window.indexedDB.open("nomicon");
    req.onerror = reject;
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = function(e) {
      let db = e.target.result;
      db.createObjectStore("pages", { keyPath: "id" });

      let links = db.createObjectStore("links", { keyPath: "id" });
      links.createIndex("from", "from", { unique: false });
      links.createIndex("to", "to", { unique: false });
    }
  });

  let store = Store.create({db, site: Site.load()});
  await store.ready;
  return store;
}

export const Store = EmberObject.extend({
  db: null,
  site: null,
  _map: null,

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
    let p = Page.create({
      id: uuid(),
      store: this,
    });
    this._map.set(p.id, p);
    let tx = this.db.transaction('pages', 'readwrite');
    tx.objectStore('pages').add(p.serialize());
    await promisifyTx(tx);
    return p;
  },

  async destroyPage(id) {
    let tx = this.db.transaction(['pages', 'links'], 'readwrite');
    // delete the persisted page
    tx.objectStore('pages').delete(id);

    // delete the persisted page
    let links = tx.objectStore('links');
    let from = promisifyReq(links.index('from').getAll(IDBKeyRange.only(id)));
    let to = promisifyReq(links.index('to').getAll(IDBKeyRange.only(id)));
    [from, to] = await Promise.all([from, to]);
    for (let l of from) {
      links.delete(l.id);
    }
    for (let l of to) {
      links.delete(l.id);
    }

    // remove in-memory page and links from the graph
    let p = this._map.get(id);
    p.incoming.forEach((l) => l.from.outgoing.removeObject(l));
    p.outgoing.forEach((l) => l.to.incoming.removeObject(l));
    this._map.delete(id);

    return promisifyTx(tx);
  },

  async destroyLink(link) {
    let tx = this.db.transaction(['links'], 'readwrite');
    tx.objectStore('links').delete(link.id);

    link.from.outgoing.removeObject(link);
    link.to.incoming.removeObject(link);
    link.destroy();

    return promisifyTx(tx);
  },

  async insertLink(fromId, toId) {
    let from = this._map.get(fromId);
    let to = this._map.get(toId);
    let l = Link.create({
      id: ''+Math.random(),
      from,
      to,
      store: this,
    });
    from.outgoing.pushObject(l);
    to.incoming.pushObject(l);
    let tx = this.db.transaction('links', 'readwrite');
    tx.objectStore('links').add(l.serialize());
    return promisifyTx(tx);
  },

  async _buildIdentityMap() {
    let tx = this.db.transaction(['pages', 'links']);
    this._map = new Map();
    let allPages = await promisifyReq(tx.objectStore('pages').getAll());
    for (let p of allPages) {
      this._map.set(p.id, Page.create({
        store: this,
        ...p
      }));
    }

    let allLinks = await promisifyReq(tx.objectStore('links').getAll());
    for (let l of allLinks) {
      let from = this._map.get(l.from);
      let to = this._map.get(l.to);
      let link = Link.create({
        id: l.id,
        from,
        to,
        store: this,
      });
      this._map.get(l.from).outgoing.push(link);
      this._map.get(l.to).incoming.push(link);
    }
  },
});

export default Store;
