import {tracked} from '@glimmer/tracking';
import Sequence from 'nomicon/lib/ordts/sequence';

export default class LiveSequence {
  collection;
  sequence;
  @tracked value = '';

  constructor(collection, clientId) {
    this.collection = collection;
    this.sequence = new Sequence(clientId, []);
    collection.subscribe({
      next: (update) => {
        this.sequence.mergeAtoms(update);
        this.value = this.sequence.evaluate();
      }
    });
    window.thing = this;
  }

  become(s) {
    let fresh = this.sequence.become(s);
    this.value = this.sequence.evaluate();
    return this.collection.write(fresh);
  }
}
