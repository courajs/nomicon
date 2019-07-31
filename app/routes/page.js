import Route from '@ember/routing/route';
import {inject} from '@ember/service';

export default Route.extend({
  data: inject(),
  graph: inject(),

  async model({page_id}) {
    return this.graph.getPage(page_id);
  }
});
