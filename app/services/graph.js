import Service, {inject as service} from '@ember/service';
import {alias, or} from '@ember/object/computed';
import Graph from 'nomicon/lib/ordts/graph';

export default class GraphService extends Service {
  @service sync;
  @service auth;

  @tracked collection;

  constructor() {
    this.init();
  }

  async init() {
    this.collection = await this.sync.liveCollection('graph');
    this.graph = new Graph(this.auth.clientId, []);
  }

  get graph() {
    let g = new Graph(this.auth.clientId, []);
    if (this.collection) {
      g.mergeAtoms(this.collection.data);
    }
    return g.evaluate();
  }

  get titleCollections() {
    let ids = this.graph.nodes.map(function(uuid) {
      return this.sync.liveCollection({type:'page',attribute:'title'});
    });
  }

  get pages() {
  }
}
