import Service from '@ember/service';
import {computed} from '@ember/object';
import {alias} from '@ember/object/computed';

import {task} from 'ember-concurrency';

export default Service.extend({
  init() {
    this._super(...arguments);

    window.dataThing = this;

    this.set('db', new Promise(function(resolve, reject) {
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
    }));

    this.updateProps.perform();
  },

  pages: alias('updateProps.lastSuccessful.value'),
  homes: alias('pages'),

  async getPage(id) {
    let db = await this.db;
    let tx = db.transaction(['pages', 'links']);
    let pages = tx.objectStore('pages');
    let links = tx.objectStore('links');
    let from = links.index('from');
    let to = links.index('to');
    let [p, incoming, outgoing] = await Promise.all([
        promisifyReq(pages.get(id)),
        promisifyReq(to.getAll(IDBKeyRange.only(id))),
        promisifyReq(from.getAll(IDBKeyRange.only(id))),
    ]);
    
    return {page: p, incoming, outgoing};
  },
  async addPage(page) {
    return this.basicAdd('pages', page);
  },
  async updatePage(page) {
    return this.basicUpdate('pages', page);
  },

  updateProps: task(function* () {
    return this.basicGetAll('pages');
  }).keepLatest(),
  invalidate() {
    this.updateProps.perform();
  },

  async basicGetAll(store) {
    let db = await this.db;
    let tx = db.transaction(store);
    let objStore = tx.objectStore(store);
    return promisifyReq(objStore.getAll());
  },

  async basicGet(store, id) {
    let db = await this.db;
    let tx = db.transaction(store);
    let objStore = tx.objectStore(store);
    return promisifyReq(objStore.get(id));
  },

  async basicAdd(store, obj) {
    let db = await this.db;
    let tx = db.transaction(store, 'readwrite');
    let objStore = tx.objectStore(store);
    objStore.add(obj);
    let result = await promisifyTx(tx);
    this.invalidate();
    return result;
  },

  async basicUpdate(store, obj) {
    let db = await this.db;
    let tx = db.transaction(store, 'readwrite');
    let objStore = tx.objectStore(store);
    objStore.put(obj);
    let result = await promisifyTx(tx);
    this.invalidate();
    return result;
  },
});


function promisifyReq(req) {
  return new Promise(function(resolve, reject) {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function promisifyTx(tx) {
  return new Promise(function(resolve, reject) {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = reject;
  });
}
