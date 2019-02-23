import Service from '@ember/service';
import {computed} from '@ember/object';
import {alias} from '@ember/object/computed';

import {task} from 'ember-concurrency';

import {promisifyReq, promisifyTx} from 'nomicon/lib/idb_utils';
import {makeStore} from 'nomicon/lib/models';

export default Service.extend({
  init() {
    this._super(...arguments);
    window.dataService = this;
    let s = makeStore();
    this.set('ready', s);
    s.then((store) => this.set('store', store));

    this.updateProps.perform();
  },

  pages: alias('updateProps.lastSuccessful.value'),
  homes: alias('pages'),

  async getPage(id) {
    await this.ready;
    return this.store.getPage(id);
  },
  async newPage({title, body}) {
    await this.ready;
    let p = await this.store.newPage({title, body});
    this.invalidate();
    return p;
  },

  async destroyPage(id) {
    await this.ready;
    let p = await this.store.destroyPage(id);
    this.invalidate();
    return p;
  },

  updateProps: task(function* () {
    yield this.ready;
    return this.store.allPages();
  }).keepLatest(),

  invalidate() {
    this.updateProps.perform();
  },
});

