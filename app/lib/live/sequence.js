import {tracked} from '@glimmer/tracking';
import Sequence from 'nomicon/lib/ordts/sequence';

export default class LiveSequence {
  collection;
  sequence;
  @tracked value = '';

  constructor(collection, clientId) {
    this.collection = collection;
    this.sequence = new Sequence(clientId, []);
    collection.subscribe(this);
  }

  next(update) {
    this.sequence.mergeAtoms(update);
    this.value = this.sequence.evaluate();
  }

  become(s) {
  }
}
