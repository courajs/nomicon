import Route from '@ember/routing/route';
import {inject} from '@ember/service';
import {concatMap,tap} from 'rxjs/operators';

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

    let links = this.graph.linksForPage(page_id);
    let attrs = this.graph.attributesForPage(page_id);
    
    links = await links;
    attrs = await attrs;

    return {
      page,
      uuid: page_id,
      links,
      ...attrs,
    };
  }
});
