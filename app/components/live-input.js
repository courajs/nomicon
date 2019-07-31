import Component from '@glimmer/component';
import {tracked} from '@glimmer/tracking';
import {inject as service} from '@ember/service';

import LiveSequence from 'nomicon/lib/live/sequence';

export default class extends Component {
  @service auth;
  @service sync;
  
  @tracked collection
  @tracked sequence;

  constructor() {
    super(...arguments);
    this.init();
  }

  async init() {
    await this.auth.awaitAuth;
    this.sequence = new LiveSequence(this.sync, this.auth.clientId, this.args.collection);
  }

  update(e) {
    this.sequence.become(this.sequence.value);
  }
}
