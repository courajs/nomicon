import {set} from '@ember/object';
import uuid from 'uuid/v4';
import {openDB, IDBPDatabase} from 'idb';

import Id from './site';
import Site from './site';
import Page from './page';
import Link from './link';
import LWW, {LWWAtom} from './ordts/lww';
import PageGraph, {GraphAtom} from './ordts/page-graph';
import PersistedArray from './persisted-atom-array';


export async function makeStore(): Promise<Store> {
  let mainGraphCollectionId = window.localStorage.NomiconGraphCollectionId;
  if (!mainGraphCollectionId) {
    window.localStorage.NomiconGraphCollectionId = mainGraphCollectionId = uuid();
  }

  let db = await openDB('nomicon', 1, {
    upgrade(db) {
      let atoms = db.createObjectStore('atoms', {keyPath: ['id.lamport', 'id.site']});
      atoms.createIndex('collection', 'collectionId', {unique: false});
    }
  });

  let store = new Store(mainGraphCollectionId, Site.load(), db);
  await store.ready;
  return store;
}

export class Store {
  _map: Map<string, any> = new Map();
  graph!: PageGraph;
  ready: Promise<void>;

  constructor(
    public id: string,
    private site: any,
    private db: IDBPDatabase,
  ) {
    this.ready = this._buildIdentityMap();
  }

  nextId(): Id {
    return this.site.nextId();
  }

  getPage(id: string): any {
    return this._map.get(id);
  }

  allPages(): Array<any> {
    // TODO: make this a live array
    return Array.from(this._map.values());
  }

  async newPage(attrs: {title?: string}): Promise<any> {
    let p = await this.graph.createPage();

    let id = p.value.homeCollectionId;
    let col = new PersistedArray(id, [], this.db);
    let home = new LWW(id, false, col, this);

    id = p.value.titleCollectionId;
    col = new PersistedArray(id, [], this.db);
    let title = new LWW(id, '', col, this);

    id = p.value.bodyCollectionId;
    col = new PersistedArray(id, [], this.db);
    let body = new LWW(id, '', col, this);

    let page = new Page(
      p.value.uuid,
      p.id,
      home,
      title,
      body,
      this,
    );
    this._map.set(page.id, page);
    if (attrs && attrs.title) {
      set(page, 'title', attrs.title);
    }
    return page;
  }

  async destroyPage(page: Page): Promise<void> {
    let ps = [];
    ps.push(this.graph.deleteItem(page.atomId));
    ps = ps.concat(page.incoming.map(l => this.graph.deleteItem(l.id))); 
    ps = ps.concat(page.outgoing.map(l => this.graph.deleteItem(l.id))); 

    page.incoming.forEach((l) => l.from.outgoing.removeObject(l));
    page.outgoing.forEach((l) => l.to.incoming.removeObject(l));
    this._map.delete(page.id);

    for (let p of ps) {
      await p;
    }
  }

  async destroyLink(link: Link): Promise<void> {
    await this.graph.deleteItem(link.id);

    link.from.outgoing.removeObject(link);
    link.to.incoming.removeObject(link);
  }

  async insertLink(fromUUID: string, toUUID: string): Promise<Link> {
    let l = await this.graph.createLink(fromUUID, toUUID);
    let from = this._map.get(fromUUID);
    let to = this._map.get(toUUID);
    let link = {
      id: l.id,
      from,
      to,
    };
    from.outgoing.pushObject(link);
    to.incoming.pushObject(link);
    return link;
  }

  async _buildIdentityMap(): Promise<void> {
    this._map = new Map();

    let graphCollection = await PersistedArray.load<GraphAtom>(this.id, this.db);
    let graph = this.graph = new PageGraph(this.id, graphCollection, this);
    let {pages, links} = graph.process();


    let _pages = [];
    for (let p of pages) {
      let p2 = Promise.all([
          PersistedArray.load<LWWAtom<boolean>>(p.value.homeCollectionId, this.db),
          PersistedArray.load<LWWAtom<string>>(p.value.titleCollectionId, this.db),
          PersistedArray.load<LWWAtom<string>>(p.value.bodyCollectionId, this.db),
      ]).then(([home, title, body]) => {
        let page = new Page(
          p.value.uuid,
          p.id,
          new LWW(p.value.homeCollectionId, false, home, this),
          new LWW(p.value.titleCollectionId, '', title, this),
          new LWW(p.value.bodyCollectionId, '', body, this),
          this,
        );
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
      let link = {
        id: l.id,
        from,
        to,
      };
      from.outgoing.push(link);
      to.incoming.push(link);
    }
  }
}


export default Store;
