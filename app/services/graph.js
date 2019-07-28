import Service, {inject as service} from '@ember/service';
import {alias, or} from '@ember/object/computed';
import Graph from 'nomicon/lib/ordts/graph';

export default Graph extends Service {
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
    return Promise.all(
  }

  get pages() {
  }

  _data: alias('collection.data'),

  graph: or('_graph', '_dummyGraph'),
  _dummyGraph: computed(function() {
    return new Graph('');
  }),
  _graph: null,

  async init() {
    this._super(...arguments);
    this.set('collection', await this.sync.liveCollection('graph'));
    await this.auth.awaitAuth;
    this.graph = new Graph(this.auth.clientId);
    this.graph.mergeAtoms(this.collection.data);
    this.collection.on('updated', () => {
      this.graph.mergeAtoms(this.collection.data);
      this.notifyPropertyChange('data');
    });
  },

  pages: computed('data', function() {
  }),

}
