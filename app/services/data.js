import Service from '@ember/service';

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
        let pages = db.createObjectStore("pages", { keyPath: "id" });
        let links = db.createObjectStore("links", { keyPath: "id" });
        links.createIndex("from", "from", { unique: false });
        links.createIndex("to", "to", { unique: false });
      }
    }));
  },

  async allPages() {
    let db = await this.db;
    let tx = db.transaction('pages');
    let pages = tx.objectStore('pages');
    return promisifyReq(pages.getAll());
  },

  async addPage(page) {
    let db = await this.db;
    let tx = db.transaction('pages', 'readwrite');
    let pages = tx.objectStore('pages');
    pages.add(page);
    return promisifyTx(tx);
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
