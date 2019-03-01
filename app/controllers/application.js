import Controller from '@ember/controller';
import {inject} from '@ember/service';

import {bound} from 'nomicon/lib/hotkeys';

export default Controller.extend({
  data: inject(),

  showModal: false,

  hotkeys: bound({
    'page-switcher': function() {
      this.set('showModal', true);
    },
    'new-page': function() {
      this.transitionToRoute('new');
    }
  }),

  goToPage(p) {
    this.transitionToRoute('page', p.id);
    this.set('showModal', false);
  },
});
