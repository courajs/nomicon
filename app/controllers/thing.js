import Controller from '@ember/controller';
import {tracked} from '@glimmer/tracking';
import {inject as service} from '@ember/service';

import * as rxjs from 'rxjs';

window.rxjs = rxjs;

export default class extends Controller {
  @service sync;
  @service graph;
  
  @tracked thing = "";
  @tracked collection;
  @tracked items = [];

  async init() {
    this.collection = await this.sync.liveCollection('test2');
    this.collection.subscribe({
      next: (update) => {
        this.items = this.items.concat(update);
      }
    });
  }

  get things() {
    return this.items.sort((b,a) => a.at - b.at).map(x=>x.message);
  }

  addThing(e) {
    e.preventDefault();
    let item = {
      at: new Date().valueOf(),
      message: this.thing,
    };
    this.thing = '';
    this.collection.write([item]);
  }
}
