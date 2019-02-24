import Route from '@ember/routing/route';
import {inject} from '@ember/service';

export default Route.extend({
  data: inject(),
  async redirect() {
    let model = await this.data.newPage({title:'', body:''});
    return this.replaceWith('page', model.id);
  },
});
