import Route from '@ember/routing/route';
import {inject} from '@ember/service';

export default Route.extend({
  graph: inject(),
  async redirect() {
    let model = await this.graph.newPage();
    return this.replaceWith('page', model.uuid);
  },
});
