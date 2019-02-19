import Component from '@ember/component';
import {inject} from '@ember/service';
import {task} from 'ember-concurrency';

export default Component.extend({
  data: inject(),

  init() {
    this._super(...arguments);
    this.refs = {};
  },

  submit: task(function* () {
    let title = this.refs.title.value;
    let body = this.refs.body.value;

    this.data.addPage({id: ""+Math.random(), title, body});
  }),

  addRef(el, name) {
    this.refs[name] = el;
  }
});
