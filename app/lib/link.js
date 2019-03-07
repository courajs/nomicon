import EmberObject from '@ember/object';

export default EmberObject.extend({
  id: '',
  atomId: null,
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

