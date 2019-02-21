import Component from '@ember/component';
import {computed} from '@ember/object';
import {inject} from '@ember/service';

export default Component.extend({
  data: inject(),
  search: '',
  all: [],

  init() {
    this._super(...arguments);
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
