import Component from '@ember/component';
import {on} from '@ember/object/evented';

import {EKMixin, keyDown} from 'ember-keyboard';

export default Component.extend(EKMixin, {
  init() {
    this._super(...arguments);
    this.set('keyboardActivated', true);
  },
  addOut() {},
  addIn() {},
  goOut() {},
  goIn() {},
  
  _addOutgoing: on(keyDown('ctrl+Period'), function() {
    this.addOut();
  }),
  _addIncoming: on(keyDown('ctrl+Comma'), function() {
    this.addIn();
  }),
  _goTo: on(keyDown('ctrl+BracketRight'), function() {
    this.goOut();
  }),
  _goFrom: on(keyDown('ctrl+BracketLeft'), function() {
    this.goIn();
  }),
});
