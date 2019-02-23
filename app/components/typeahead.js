import Component from '@ember/component';
import {get, computed} from '@ember/object';
import {or} from '@ember/object/computed';

import {bound} from 'nomicon/lib/hotkeys';

export default Component.extend({
  choice: 0,
  path: '',
  search: '',
  empty: [],
  all: or('options', 'empty'),
  choose() {},

  init() {
    this._super(...arguments);
    this.set('keyboardActivated', true);
  },

  results: computed('search', 'all', function() {
    let search = this.search.split(' ');
    return this.all.filter((item) => {
      let searchVal;
      if (this.path) {
        // @path can be a 'dot.separated.string';
        searchVal = get(item, this.path).toLowerCase();
      } else {
        searchVal = item.toLowerCase();
      }
      return containsForward(searchVal, search);
    });
  }),

  updateSearch(newTerm) {
    this.set('choice', 0);
    this.set('search', newTerm);
  },

  focusEl(el) {
    el.focus();
  },

  hotkeys: bound({
    'typeahead-up': function() {
      this.set('choice', Math.max(0,  this.choice - 1));
    },
    'typeahead-down': function() {
      this.set('choice', Math.min(this.results.length-1, this.choice + 1));
    },
    'typeahead-confirm': function() {
      this.choose(this.results[this.choice]);
    },
  }),
});

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


