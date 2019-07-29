import Service, {inject as service} from '@ember/service';
import Evented from '@ember/object/evented';
import {tracked} from '@glimmer/tracking';
import {task} from 'ember-concurrency';
import {Observable,Subject} from 'rxjs';
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

  constructor() {
    super(...arguments);
    window.syncService = this;
  }

  async liveCollection(id) {
    let db = await this.idb.db;

    return getOrCreate(this._id_map, id, ()=>{
      let updater = new ArrayUpdatesManager(db, id);
      ensureClockForCollection(db, id)
        .then(() => {
          this.sw.on('update', ()=>updater.update());
          this.sw.send('ask');
          return updater.update();
        });
      return updater.subject;
    });
  }

  async directWrite(collection, value) {
    await writeToCollection(await this.idb.db, collection, [value]);
    this.sw.send('update');
  }
}

function getOrCreate(map, id, creator) {
  let val = map.get(id);
  if (!val) {
    val = creator();
    map.set(id, val);
  }
  return val;
}

class ArrayUpdatesManager {
  db;
  id;
  subject = new Subject();
  clock = {local:0,remote:0};

  constructor(db, id, observer) {
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
    if (values.length) {
      this.subject.next(values);
    }
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
