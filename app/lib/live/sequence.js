import {tracked} from '@glimmer/tracking';
import Sequence from 'nomicon/lib/ordts/sequence';

export default class LiveSequence {
  collection;
  sequence;
  @tracked value = '';

  constructor(sync, clientId, id) {
    this.sync = sync;
    this.sequence = new Sequence(clientId, []);

    sync.liveCollection(id)
      .then(updates => {
        this.collection = updates;
        updates.subscribe({
          next: (update) => {
            this.sequence.mergeAtoms(update);
            this.value = this.sequence.evaluate();
          }
        });
      });
  }

  become(s) {
    let fresh = this.sequence.become(s);
    this.value = this.sequence.evaluate();
    return this.collection.write(fresh);
  }
}
