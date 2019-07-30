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
    console.log('init');
    this.collection = await this.sync.liveCollection(this.args.collection);
    await this.auth.awaitAuth;
    this.sequence = new LiveSequence(this.collection, this.auth.clientId);
  }

  update(e) {
    this.sequence.become(this.sequence.value);
  }
}
