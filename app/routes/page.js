import Route from '@ember/routing/route';
import {inject} from '@ember/service';

export default Route.extend({
  data: inject(),
  model({page_id}) {
    return this.data.getPage(page_id);
  }
});
