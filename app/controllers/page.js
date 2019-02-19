import Controller from '@ember/controller';
import {inject} from '@ember/service';

export default Controller.extend({
  data: inject(),
  async save(page) {
    page.id = this.model.id;
    await this.data.updatePage(page);
    let model = await this.data.getPage(this.model.id);
    this.set('model', model);
  }
});
