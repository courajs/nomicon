import Service, {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';
import {concatMap} from 'rxjs/operators';
import LiveGraph from 'nomicon/lib/live/graph';
import {TrackedBehavior} from 'nomicon/lib/observables';

export default class GraphService extends Service {
  @service sync;
  @service auth;

  @tracked graph;
  @tracked _pages;

  async init() {
    await this.auth.awaitAuth;
    this.graph = new LiveGraph('graph', this.auth.clientId, this.sync);
    window.graphservice = this;
    this._pages = await this.allPages();
  }


  // Queries
  
  async attributesForPage(uuid) {
    let titleId = ['page',uuid,'title'];
    let bodyId = ['page',uuid,'body'];

    let [title,body] = await Promise.all([
        this.trackedSequence(titleId),
        this.trackedSequence(bodyId),
    ]);

    return {
      title: {
        id: titleId,
        seq: title,
      },
      body: {
        id: bodyId,
        seq: body,
      },
    };
  }

  async trackedSequence(id) {
    return await new TrackedBehavior(await this.sync.sequence(id)).initial;
  }

  async linksForPage(uuid) {
    let graph = await this.sync.graph('graph');
    let links = graph.pipe(
        concatMap(async g => {
          let {incoming, outgoing} = g.evaluate();
          incoming = incoming[uuid] || [];
          outgoing = outgoing[uuid] || [];
          incoming = incoming.map(async l => {
            return {
              link_uuid: l.uuid,
              page_uuid: l.from,
              title: await this.trackedSequence(['page',l.from,'title']),
            };
          });
          outgoing = outgoing.map(async l => {
            return {
              link_uuid: l.uuid,
              page_uuid: l.to,
              title: await this.trackedSequence(['page',l.to,'title']),
            };
          });
          return {
            incoming: await Promise.all(incoming),
            outgoing: await Promise.all(outgoing),
          };
        })
    );
    return await new TrackedBehavior(links).initial;
  }

  async allPages() {
    let graph = await this.sync.graph('graph');
    let links = graph.pipe(
        concatMap(async g => {
          let {nodes} = g.evaluate();
          return Promise.all(
              nodes.map(async n => {
                return {
                  uuid: n,
                  title: await this.trackedSequence(['page',n,'title']),
                };
              })
          );
        }),
    );
    return await new TrackedBehavior(links).initial;
  }

  get pages() {
    if (this._pages) {
      return this._pages.value;
    } else {
      return [];
    }
  }

  async getPage(page_id) {
    await this.auth.awaitAuth;
    return this.graph.getPage(page_id);
  }


  // Mutations

  async newPage() {
    await this.auth.awaitAuth;
    await this.graph.syncedOnce;
    return this.graph.newPage();
  }

  link(fromuuid, touuid) {
    return this.graph.link(fromuuid, touuid);
  }

  delete(uuid) {
    return this.graph.delete(uuid);
  }
}
