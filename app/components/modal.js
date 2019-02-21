import Component from '@ember/component';
import {on} from '@ember/object/evented';

import {EKMixin, keyDown} from 'ember-keyboard';

export default Component.extend(EKMixin, {
  close() {},

  init() {
    this._super(...arguments);
    this.set('keyboardActivated', true);
  },

  _clickBackdrop: on(keyDown('Escape'), function() {
    this.close();
  }),
});
