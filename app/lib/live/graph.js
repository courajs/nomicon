import {tracked} from '@glimmer/tracking';
import Graph from 'nomicon/lib/ordts/graph';
import LiveSequence from 'nomicon/lib/live/sequence';

export default class LiveGraph {
  collection; graph; sync;
  idMap = new Map();
  @tracked pages = [];

  constructor(id, clientId, sync) {
    this.syncedOnce = new Promise((resolve) => {
      this.markSynced = resolve;
    });
    this.sync = sync;
    this.graph = new Graph(clientId, []);
    this.sync.liveCollection(id)
      .then(updates => {
        this.collection = updates;
        updates.subscribe({
          next: update => {
            this.graph.mergeAtoms(update);
            this.calcPages();
          }
        });
        this.markSynced();
      });
    window.thelivegraph = this;
  }

  calcPages() {
    let existing = new Set(this.idMap.keys());
    let result = this.graph.evaluate();
    for (let n of result.nodes) {
      this.ensurePage(n);
      existing.delete(n);
    }
    for (let old of existing) {
      this.idMap.delete(old);
    }
    for (let [uuid, p] of this.idMap) {
      let incoming = result.incoming[uuid] || [];
      p.incoming = incoming.map(({uuid,from,to}) => {
        return {
          uuid,
          from: this.idMap.get(from),
          to: this.idMap.get(to),
        };
      });
      let outgoing = result.outgoing[uuid] || [];
      p.outgoing = outgoing.map(({uuid,from,to}) => {
        return {
          uuid,
          from: this.idMap.get(from),
          to: this.idMap.get(to),
        }
      });
    }
    this.pages = Array.from(this.idMap.values());
  }
  
  ensurePage(uuid) {
    if (!this.idMap.has(uuid)) {
      this.idMap.set(uuid, new LivePage(uuid, this.sync, this, this.clientId));
    }
  }

  getPage(uuid) {
    this.ensurePage(uuid);
    return this.idMap.get(uuid);
  }

  async newPage() {
    let atom = this.graph.addNode();
    let {uuid} = atom;
    await this.collection.write([atom]);
    return this.getPage(uuid);
  }

  async link(fromuuid, touuid) {
    let atom = this.graph.addEdge(fromuuid, touuid);
    return this.collection.write([atom]);
  }

  delete(uuid) {
    let atom = this.graph.delete(uuid);
    return this.collection.write([atom]);
  }
}

export class LivePage {
  uuid;
  sync; graph; clientId;
  _titleSequence; _bodySequence;
  @tracked _title = '';
  @tracked _body = '';
  @tracked incoming = [];
  @tracked outgoing = [];

  constructor(uuid, sync, graph, clientId) {
    this.uuid = uuid;
    this.sync = sync;
    this.graph = graph;
    this.clientId = clientId;
  }

  get titleCollection() {
    return ['page', this.uuid, 'title'];
  }
  get bodyCollection() {
    return ['page', this.uuid, 'body'];
  }

  get titleSequence() {
    if (!this._titleSequence) {
      this._titleSequence = new LiveSequence(this.sync, this.clientId, this.titleCollection);
    }
    return this._titleSequence;
  }
  get bodySequence() {
    if (!this._bodySequence) {
      this._bodySequence = new LiveSequence(this.sync, this.clientId, this.bodyCollection);
    }
    return this._bodySequence;
  }

  get title() {
    return this.titleSequence.value;
  }
  get body() {
    return this.bodySequence.value;
  }
}
