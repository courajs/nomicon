import Service from '@ember/service';
import {alias, filter} from '@ember/object/computed';

import {task} from 'ember-concurrency';

import {makeStore} from 'nomicon/lib/store';

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
  homes: filter('pages.@each.home', page => page.home),
  orphans: filter('pages.@each.numPeers', page => !page.home && page.numPeers === 0),
  stubs: filter('pages.@each.stub', page => page.stub),

  async getPage(id) {
    await this.ready;
    return this.store.getPage(id);
  },
  async newPage(attrs) {
    await this.ready;
    let p = await this.store.newPage(attrs);
    this.invalidate();
    return p;
  },

  async destroyPage(id) {
    await this.ready;
    let p = await this.store.destroyPage(id);
    this.invalidate();
    return p;
  },

  async destroyLink(link) {
    await this.ready;
    return this.store.destroyLink(link);
  },

  updateProps: task(function* () {
    yield this.ready;
    return this.store.allPages();
  }).keepLatest(),

  invalidate() {
    this.updateProps.perform();
  },
});

