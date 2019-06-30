import Service, {inject} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default Service.extend({
  idb: inject(),
  sw: inject(),

  authState: tracked({value:'pending'}),
  clientId: tracked({value:null}),

  async init() {
    this._super(...arguments);
    
    this.sw.on('authed', (as) => {
      this.authState = 'authed';
      this.clientId = as;
    });

    let db = await this.idb.db;
    let id = await db.get('meta', 'client_id');
    if (id) {
      this.authState = 'authed';
      this.clientId = id;
    } else {
      this.authState = 'unauthed';
    }
  },

  authenticateAs(id) {
    this.sw.send({kind:'auth',value:id});
  }
});
