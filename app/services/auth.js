import Service, {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default class Auth extends Service {
  @service idb;
  @service sw;

  @tracked authState = 'pending';
  @tracked clientId;

  constructor() {
    super(...arguments);
    
    this.sw.on('authed', (as) => {
      this.authState = 'authed';
      this.clientId = as;
    });

    this._checkForId();
  }

  async _checkForId() {
    let db = await this.idb.db;
    let id = await db.get('meta', 'client_id');
    if (id) {
      this.authState = 'authed';
      this.clientId = id;
    } else {
      this.authState = 'unauthed';
    }
  }

  authenticateAs(id) {
    this.sw.send({kind:'auth',value:id});
  }
}
