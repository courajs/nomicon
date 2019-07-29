import Service, {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';
import Graph from 'nomicon/lib/ordts/graph';

export default class GraphService extends Service {
  @service sync;
  @service auth;

  _graph;
  @tracked graph;

  constructor() {
    this.init();
  }

  async init() {
    let updates = await this.sync.liveCollection('graph');
    this._graph = graphFromCollection(this.auth.clientId, updates);
    this._graph.subscribe({
      next: (g) => {
        this.graph = g;
      }
    });
  }

  get graph() {
    return this._graph.evaluate();
  }

  get titleCollections() {
    let ids = this.graph.nodes.map(function(uuid) {
      return this.sync.liveCollection({type:'page',attribute:'title'});
    });
  }

  get pages() {
  }
}

function graphFromCollection(clientId, collectionUpdateObservable) {
  let graph = new Graph(clientId, []);
  let subject = new Subject();
  collectionUpdateObservable.subscribe({
    next: (update)=> {
      graph.mergeAtoms(update);
      subject.next(graph);
    }
  });
  return subject;
}
