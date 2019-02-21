import Component from '@ember/component';
import {computed} from '@ember/object';
import {inject} from '@ember/service';
import { on } from '@ember/object/evented';

import { EKMixin, keyDown } from 'ember-keyboard';

export default Component.extend(EKMixin, {
  data: inject(),
  choice: 0,
  search: '',
  all: [],
  choose() {},

  init() {
    this._super(...arguments);
    this.set('keyboardActivated', true);
    this.data.basicGetAll('pages').then(pages => {
      this.set('all', pages);
    });
  },

  options: computed('search', 'all', function() {
    let search = this.search.split(' ');
    return this.all.filter(function(page) {
      let title = page.title.toLowerCase();
      return containsForward(title, search);
    });
  }),

  updateSearch(newTerm) {
    this.set('choice', 0);
    this.set('search', newTerm);
  },

  focusEl(el) {
    el.focus();
  },

  // https://github.com/patience-tema-baron/ember-keyboard/blob/master/addon/fixtures/code-maps/default.js
  _curosrUp: on(...['ArrowUp', 'cmd+KeyK', 'ctrl+KeyK'].map(keyDown), function() {
    this.set('choice', Math.max(0,  this.choice - 1));
  }),
  _curosrDown: on(...['ArrowDown', 'cmd+KeyJ', 'ctrl+KeyJ'].map(keyDown), function() {
    this.set('choice', Math.min(this.options.length-1, this.choice + 1));
  }),
  _choose: on(keyDown('Enter'), function() {
    this.choose(this.options[this.choice]);
  }),
});

function keyDowns(keys) {
  return keys.map(keyDown);
}

function containsForward(string, searchList) {
  let index = 0;
  for (let term of searchList) {
    index = string.indexOf(term, index);
    if (index === -1) {
      return false;
    }
  }
  return true;
}
