import Service, {inject} from '@ember/service';
import {alias, or} from '@ember/object/computed';

export default Service.extend({
  sync: inject(),

  _cp: null,
  collection: null,

  _defaultData: [],
  _data: alias('collection.data'),
  data: or('_data', '_defaultData'),

  async init() {
    this._super(...arguments);
    this._cp = this.sync.liveCollection('graph');
    this.set('collection', await this._cp);
    this.collection.on('updated', () => {
      this.notifyPropertyChange('data');
    });
  },

  pages: computed('data', function() {
  }),

});
