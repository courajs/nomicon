import Component from '@ember/component';
import {inject} from '@ember/service';
import {task} from 'ember-concurrency';

export default Component.extend({
  data: inject(),
  save() {},
  update: null,

  init() {
    this._super(...arguments);
    this.refs = {};
  },

  _submit() {
    let title = this.refs.title.value;
    let body = this.refs.body.value;

    this.save({title, body});
  },

  _update() {
    if (this.update) {
      let title = this.refs.title.value;
      let body = this.refs.body.value;

      this.update({title, body});
    }
  },

  addRef(el, name) {
    this.refs[name] = el;
  }
});
