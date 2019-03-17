import {computed} from '@ember-decorators/object';
import {alias, not} from '@ember-decorators/object/computed';

import LWW from './ordts/lww';
import Link from './link';
import Id from './id';

export default class Page {
  incoming: Array<Link> = [];
  outgoing: Array<Link> = [];

  constructor(
    public id: string,
    public atomId: Id,
    public _home: LWW<boolean>,
    public _title: LWW<string>,
    public _body: LWW<string>,
    private store: any,
  ) {}

  @alias('_home.value') home!: boolean;
  @alias('_title.value') title!: string;
  @alias('_body.value') body!: string;

  @not('body') stub!: boolean;

  @computed('{incoming,outgoing}.[]')
  get numPeers(): number {
    return this.incoming.length + this.outgoing.length;
  }

  async linkTo(otherId: string): Promise<void> {
    return this.store.insertLink(this.id, otherId);
  }
  async linkFrom(otherId: string): Promise<void> {
    return this.store.insertLink(otherId, this.id);
  }
}
