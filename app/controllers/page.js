import Controller from '@ember/controller';
import {inject} from '@ember/service';

export default Controller.extend({
  data: inject(),
  async save(page) {
    page.id = this.model.page.id;
    await this.data.updatePage(page);
    let model = await this.data.getPage(this.model.page.id);
    this.set('model', model);
  },
  log: console.log,
});
