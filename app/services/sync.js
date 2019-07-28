import Service, {inject as service} from '@ember/service';
import Evented from '@ember/object/evented';
import {tracked} from '@glimmer/tracking';
import {task} from 'ember-concurrency';
import {EquivMap} from '@thi.ng/associative';
import {keepLatest} from 'nomicon/lib/concurrency';
import {
  getFromCollection,
  writeToCollection,
  ensureClockForCollection,
} from 'nomicon/lib/idb';


export default class Sync extends Service {
  @service idb;
  @service sw;

  _id_map = new EquivMap();

  liveCollection(id) {
    let current = this._id_map.get(id);
    if (current) { return current; }

    let db = await idb.db;

    await ensureClockForCollection(db, id);
    this.sw.send('ask');

    let c = new LiveCollection(db, id);
    this.sw.on('update', ()=>c.update());
    c.update();
    this._id_map.set(id, c);
    return c;
 }
}

class LiveCollection {
  db;
  id;
  clock = {local:0,remote:0};
  @tracked data = [];

  constructor(db, id) {
    this.db = db;
    this.id = id;
  }

  @keepLatest
  async update() {
    let {
      clock,
      values
    } = await getFromCollection(this.db, this.id, this.clock);
    this.clock = clock;
    this.data.push(...values);
    this.data = this.data;
  }

  async write(values) {
    if (!Array.isArray(values)) { throw new Error('pass an array'); }
    await writeToCollection(this.db, this.id, values);
    sw.send('update');
    return this.update();
  }
}
