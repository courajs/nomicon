import Controller from '@ember/controller';
import {tracked} from '@glimmer/tracking';
import {inject as service} from '@ember/service';

import LiveSequence from 'nomicon/lib/live/sequence';

import * as rxjs from 'rxjs';

window.rxjs = rxjs;

export default class extends Controller {
  @service auth;
  @service sync;
  
  @tracked collection;
  @tracked sequence;

  async init() {
    this.collection = await this.sync.liveCollection('test3');
    this.sequence = new LiveSequence(this.collection, this.auth.clientId);
  }

  update(e) {
    this.sequence.become(this.sequence.value);
  }
}
