import Component from '@ember/component';
import {inject} from '@ember/service';
import {task} from 'ember-concurrency';

export default Component.extend({
  data: inject(),
  save: ()=>{},

  init() {
    this._super(...arguments);
    this.refs = {};
  },

  _submit: function() {
    let title = this.refs.title.value;
    let body = this.refs.body.value;

    this.save({title, body});
  },

  addRef(el, name) {
    this.refs[name] = el;
  }
});
