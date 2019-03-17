import {set} from '@ember/object';
import Component from '@ember/component';
import {inject} from '@ember/service';
import {task} from 'ember-concurrency';

export default Component.extend({
  data: inject(),

  init() {
    this._super(...arguments);
    this.refs = {};
  },

  update: task(function* () {
    set(this.page, 'title', this.refs.title.value);
    set(this.page, 'body', this.refs.body.value);
    set(this.page, 'home', this.refs.home.checked);
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
