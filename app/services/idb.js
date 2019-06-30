import Service from '@ember/service';
import {open} from 'nomicon/lib/idb';

export default Service.extend({
  db: null,

  init() {
    this._super(...arguments);
    this.db = open();
  },
});
