import Controller from '@ember/controller';
import {inject} from '@ember/service';

export default Controller.extend({
  data: inject(),
  async make({title, body}) {
    let p = await this.data.newPage({title, body});
    return this.transitionToRoute('page', p.id);
  }
});
