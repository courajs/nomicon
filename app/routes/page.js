import Route from '@ember/routing/route';
import {inject} from '@ember/service';

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
    let titleSequence = await this.sync.sequence(titleId);
    let bodyId = ['page', page_id, 'body'];
    let bodySequence = await this.sync.sequence(bodyId);

    let graph = this.sync.graph('graph');

    await graph.initial;
    await titleSequence.initial;
    await bodySequence.initial;

    return {
      page,
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
