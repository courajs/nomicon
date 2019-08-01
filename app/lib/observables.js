import {Subject} from 'rxjs';

export function Poker() {
  let s = new Subject();
  return {
    stream: s,
    poke() {s.next();},
  };
}

// This is a subject. It expects to receive arrays,
// and concats them all together into a local array.
// To a new subscriber, it first emits the local array,
// then begins forwarding each new observed array.
export class CatchUpSubject {
  values = [];
  _inner = new Subject();

  next(update) {
    this.values.push(...update);
    this._inner.next(update);
  }

  subscribe(observer) {
    if (this.values.length) {
      observer.next(this.values);
    }
    return this._inner.subscribe(observer);
  }
}
