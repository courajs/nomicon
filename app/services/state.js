// Taken from https://github.com/jerel/ember-storage
//
// The MIT License (MIT)
//
// Copyright (c) 2015
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
// KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
// BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import Service from '@ember/service';
import { isNone } from '@ember/utils';

var storage = {
  'local': window.localStorage,
  'session': window.sessionStorage,
};

export default Service.extend({

  prefix: 'nomicon',
  type: 'local',

  _prefix(key) {
    return this.get('prefix')+'__'+key;
  },

  init() {
    this._super(...arguments);

    let self = this,
        regexp = new RegExp('^('+this.get('prefix')+'__)');

    this._notify = function(evnt) {
      self.notifyPropertyChange(evnt.key.replace(regexp, ''));
    };

    window.addEventListener('storage', this._notify, false);
  },

  willDestroy() {
    this._super(...arguments);
    window.removeEventListener('storage', this._notify, false);
  },

  unknownProperty(k) {
    var key = this._prefix(k),
        type = this.get('type');
    // if we don't use JSON.parse here then observing a boolean doesn't work
    return storage[type][key] && JSON.parse(storage[type][key]);
  },
  setUnknownProperty(k, value) {
    let key = this._prefix(k),
        type = this.get('type');

    if(isNone(value)) {
      delete storage[type][key];
    } else {
      storage[type][key] = JSON.stringify(value);
    }
    this.notifyPropertyChange(k);
    return value;
  },
  clear(keyPrefix) {
    this.beginPropertyChanges();
    let prefix = keyPrefix || this.get('prefix'),
        regexp = new RegExp('^('+prefix+'__)'),
        type = this.get('type'),
        toDelete = [];

    for (var i=0; i < storage[type].length; i++){
      let key = storage[type].key(i);
      // don't nuke *everything* in localStorage... just keys that match our pattern
      if (key.match(regexp)) {
        toDelete.push(key);
      }
    }
    toDelete.forEach(function(key) {
      delete storage[type][key];
      key = key.replace(regexp, '');
      this.set(key);
    }, this);
    this.endPropertyChanges();
  }
});
