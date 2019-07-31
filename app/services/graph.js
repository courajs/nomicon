import Service, {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';
import LiveGraph from 'nomicon/lib/live/graph';

export default class GraphService extends Service {
  @service sync;
  @service auth;

  @tracked graph;

  async init() {
    await this.auth.awaitAuth;
    this.graph = new LiveGraph('graph', this.auth.clientId, this.sync);
  }

  get pages() {
    console.log('pages');
    if (this.graph) {
      return this.graph.pages;
    } else {
      [];
    }
  }
}
