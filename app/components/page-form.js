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

  _update: task(function* () {
    if (this.update) {
      let title = this.refs.title.value;
      let body = this.refs.body.value;

      return this.update({title, body});
    }
  }).keepLatest(),

  didReceiveAttrs() {
    if (!this.page.title && this.refs.title) {
      this.refs.title.focus();
    } else if (this.page.title && this.refs.body) {
      this.refs.body.focus();
    }
  },

  addRef(el, name) {
    this.refs[name] = el;
    if (!this.page.title && name == 'title') {
      el.focus();
    } else if (this.page.title && name == 'body') {
      el.focus();
    }
  }
});
