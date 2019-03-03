import EmberObject from '@ember/object';

export default EmberObject.extend({
  store: null,
  id: '',
  from: null,
  to: null,

  serialize() {
    return {
      id: this.id,
      from: this.from.id,
      to: this.to.id,
    };
  },
});

