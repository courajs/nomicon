import Controller from '@ember/controller';
import {inject} from '@ember/service';

import {bound} from 'nomicon/lib/hotkeys';
import env from 'nomicon/config/environment';

export default Controller.extend({
  data: inject(),

  environment: env.environment,
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
