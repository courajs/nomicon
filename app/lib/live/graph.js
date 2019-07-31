import {tracked} from '@glimmer/tracking';
import Graph from 'nomicon/lib/ordts/graph';
import LiveSequence from 'nomicon/lib/live/sequence';

export default class LiveGraph {
  collection; graph; sync;
  idMap = new Map();
  @tracked pages = [];

  constructor(id, clientId, sync) {
    this.sync = sync;
    this.graph = new Graph(clientId, []);
    this.sync.liveCollection(id)
      .then(updates => {
        updates.subscribe({
          next: update => {
            this.graph.mergeAtoms(update);
            this.calcPages();
          }
        });
      });
    window.thelivegraph = this;
  }

  calcPages() {
    let result = this.graph.evaluate();
    for (let n of result.nodes) {
      this.ensurePage(n);
    }
    for (let [uuid, p] of this.idMap) {
      p.incomingUUIDs = result.incoming[uuid];
      p.outgoingUUIDs = result.outgoing[uuid];
    }
    this.pages = Array.from(this.idMap.values());
  }
  
  ensurePage(uuid) {
    if (!this.idMap.has(uuid)) {
      this.idMap.set(uuid, new LivePage(uuid, this.sync, this, this.clientId));
    }
  }

  getPage(uuid) {
    return this.idMap.get(uuid);
  }
}

export class LivePage {
  uuid;
  sync; graph; clientId;
  titleSequence; bodySequence;
  @tracked _title = '';
  @tracked _body = '';
  @tracked incomingUUIDs;
  @tracked outgoingUUIDs;

  constructor(uuid, sync, graph, clientId) {
    this.uuid = uuid;
    this.sync = sync;
    this.graph = graph;
    this.clientId = clientId;
  }

  get incoming() {
    return this.incomingUUIDs.map(id => this.graph.getPage(id));
  }
  get outgoing() {
    return this.outgoingUUIDs.map(id => this.graph.getPage(id));
  }

  get title() {
    if (!this.titleSequence) {
      this.titleSequence = new LiveSequence(this.sync, this.clientId, [
        'page', this.uuid, 'title',
      ]);
    }
    return this.titleSequence.value;
  }
  get body() {
    if (!this.titleSequence) {
      this.bodySequence = new LiveSequence(this.sync, this.clientId, [
        'page', this.uuid, 'body',
      ]);
    }
    return this.bodySequence.value;
  }
}
