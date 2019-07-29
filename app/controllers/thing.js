import Controller from '@ember/controller';
import {tracked} from '@glimmer/tracking';
import {inject as service} from '@ember/service';

import * as rxjs from 'rxjs';

window.rxjs = rxjs;

let backing = [1,2,3];

export default class extends Controller {
  @service sync;
  
  @tracked collection;
  @tracked latest = [];

  constructor() {
    super(...arguments);
    this.init();
  }

  async init() {
    this.collection = await this.sync.liveCollection('tester');
    this.collection.subscribe({
      next: (val) => {
        this.latest = val;
      }
    });
  }

  doClick() {}
}
