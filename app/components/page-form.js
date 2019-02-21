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

  _submit: task(function* () {
    let title = this.refs.title.value;
    let body = this.refs.body.value;

    return this.save({title, body});
  }),

  _update: task(function* () {
    if (this.update) {
      let title = this.refs.title.value;
      let body = this.refs.body.value;

      return this.update({title, body});
    }
  }).keepLatest(),

  addRef(el, name) {
    this.refs[name] = el;
  }
});
