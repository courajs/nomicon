import Controller from '@ember/controller';
import {inject} from '@ember/service';

export default Controller.extend({
  data: inject(),
  async save(page) {
    page.id = this.model.id;
    this.data.updatePage(page);
  }
});
