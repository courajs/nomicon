import Route from '@ember/routing/route';
import {inject} from '@ember/service';

export default Route.extend({
  data: inject(),
  graph: inject(),

  async model({page_id}) {
    console.log('model');
    return this.graph.getPage(page_id);
  }
});
