import Route from '@ember/routing/route';
import {inject} from '@ember/service';
import {flatMap} from 'rxjs/operators';

import {TrackedBehavior} from 'nomicon/lib/observables';

export default Route.extend({
  sync: inject(),
  graph: inject(),

  async model({page_id}) {
    let page = await this.graph.getPage(page_id);
    // we have the page uuid
    // we need the title sequence
    // we need the body sequence
    // we need the links in/out of the page
    // we need the title of all linked pages

    let titleId = ['page', page_id, 'title'];
    let titleSequence = new TrackedBehavior(await this.sync.sequence(titleId));
    let bodyId = ['page', page_id, 'body'];
    let bodySequence = new TrackedBehavior(await this.sync.sequence(bodyId));

    let graph = await this.sync.graph('graph');

    let thing = graph.pipe(
        flatMap(async g => {
          let {incoming,outgoing} = g.evaluate();
          incoming = incoming[page_id] || [];
          outgoing = outgoing[page_id] || [];
          incoming = incoming.map(async l => {
            return {
              uuid: l.uuid,
              title: await this.sync.sequence(['page', l.from, 'title']),
            };
          });
          outgoing = outgoing.map(async l => {
            return {
              uuid: l.uuid,
              title: await this.sync.sequence(['page', l.to, 'title']),
            };
          });
          incoming = await Promise.all(incoming);
          outgoing = await Promise.all(outgoing);

          incoming = incoming.map(async l => {
            let tracked = await new TrackedBehavior(l.title).initial;
            return {
              uuid: l.uuid,
              title: tracked,
            };
          });
          outgoing = outgoing.map(async l => {
            let tracked = await new TrackedBehavior(l.title).initial;
            return {
              uuid: l.uuid,
              title: tracked,
            };
          });
          incoming = await Promise.all(incoming);
          outgoing = await Promise.all(outgoing);
          return {
            incoming,
            outgoing,
          };
        }),
    );

    thing.subscribe({
      next(thing) {
        window.latest = thing;
        console.log(thing);
      }
    });



    // await graph.initial;
    await titleSequence.initial;
    await bodySequence.initial;

    return {
      page,
      graph,
      uuid: page_id,
      title: {
        id: titleId,
        seq: titleSequence,
      },
      body: {
        id: bodyId,
        seq: bodySequence,
      },
    };
  }
});
