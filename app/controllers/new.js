import Controller from '@ember/controller';
import {inject} from '@ember/service';

export default Controller.extend({
  data: inject(),
  async make(page) {
    page.id = ""+Math.random();
    await this.data.addPage(page);
    this.transitionToRoute('page', page.id);
  }
});
