import Service, {inject as service} from '@ember/service';
import Evented from '@ember/object/evented';
import {task} from 'ember-concurrency';
import {Observable,Subject} from 'rxjs';
import {EquivMap} from '@thi.ng/associative';
import {keepLatest} from 'nomicon/lib/concurrency';
import {CatchUpSubject} from 'nomicon/lib/observables';
import {
  getFromCollection,
  writeToCollection,
  ensureClockForCollection,
} from 'nomicon/lib/idb';


export default class Sync extends Service {
  @service idb;
  @service sw;

  _id_map = new EquivMap();

  notifier = new Subject();

  init() {
    window.syncService = this;
    this.notifier.subscribe(this.sw.outgoing);
  }

  async liveCollection(id) {
    let db = await this.idb.db;

    return getOrCreate(this._id_map, id, ()=>{
      let collection = new CollectionConnection(db, id);
      collection.notifications.subscribe(this.notifier);
      ensureClockForCollection(db, id)
        .then(() => {
          this.sw.on('update').forEach(()=>collection.update());
          this.sw.send('ask');
          collection.update();
        });
      return collection;
    });
  }

  /*
  async directWrite(collection, value) {
    await writeToCollection(await this.idb.db, collection, [value]);
    this.sw.send('update');
  }
  //*/
}

function getOrCreate(map, id, creator) {
  let val = map.get(id);
  if (!val) {
    val = creator();
    map.set(id, val);
  }
  return val;
}

class CollectionConnection {
  db; id; notify;
  values = new CatchUpSubject();
  notifications = new Subject();
  clock = {local:0,remote:0};

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
    if (values.length) {
      this.values.next(values);
    }
  }

  async write(values) {
    if (!Array.isArray(values)) { throw new Error('pass an array'); }
    await writeToCollection(this.db, this.id, values);
    this.notifications.next('update');
    return this.update();
  }

  subscribe(observer) {
    return this.values.subscribe(observer);
  }
}
