import Service, {inject} from '@ember/service';
import Evented from '@ember/object/evented';
import {tracked} from '@glimmer/tracking';
import {task} from 'ember-concurrency';
import {keepLatest} from 'nomicon/lib/concurrency';
import {
  getFromCollection,
  writeToCollection,
  ensureClockForCollection,
} from 'nomicon/lib/idb';


export default Service.extend({
  idb: inject(),

  async notifyCollection(id) {
    let db = await dbp;

    await ensureClockForCollection(db, id);
    sw.send('ask');

    let c = new Collection(db, id);
    await c.update();
    sw.on('update', ()=>c.trigger('updateAvailable'));
    return c;
  },

  async liveCollection(id) {
    let c = this.notifyCollection(id);
    c.on('updateAvailable', ()=>c.update());
  },
});

export class Collection {
  db = null;
  id = null;
  events = new EventTarget();

  @tracked clock = {local:0,remote:0};
  @tracked data = [];

  @keepLatest
  async update() {
    let {
      clock,
      values
    } = await getFromCollection(this.db, this.id, this.clock);
    this.clock = clock;
    this.data.push(...values);
    this.trigger('updated');
  }

  async write(data) {
    if (!Array.isArray(data)) { throw new Error('pass an array'); }
    await writeToCollection(this.db, this.id, data);
    sw.send('update');
  }

  async writeAndUpdate(data) {
    await this.write(data);
    return this.update();
  }

  on() {
    this.events.addEventListener(...arguments);
  }
  trigger(name) {
    this.events.dispatchEvent(new Event(name));
  }
}
