import Component from '@glimmer/component';
import {tracked} from '@glimmer/tracking';
import {inject as service} from '@ember/service';

import LiveSequence from 'nomicon/lib/live/sequence';

export default class extends Component {
  @service auth;
  @service sync;
  
  _prevCollection
  _prevSeq;

  get sequence() {
    if (this.args.collection === this._prevCollection) {
      return this._prevSeq;
    } else {
      this._prevCollection = this.args.collection;
      this._prevSeq = new LiveSequence(this.sync, this.auth.clientId, this.args.collection);
      return this._prevSeq;
    }
  }

  update(e) {
    this.sequence.become(this.sequence.value);
  }
}
