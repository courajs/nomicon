import Controller from '@ember/controller';
import {inject} from '@ember/service';
import {task} from 'ember-concurrency';

const
  ADD_OUT = 1,
  ADD_IN  = 2,
  GO_OUT  = 3,
  GO_IN   = 4;

export default Controller.extend({
  data: inject(),
  showModal: false,

  ADDOUT: ADD_OUT,
  ADDIN: ADD_IN,
  GOOUT: GO_OUT,
  GOIN: GO_IN,

  save: task(function* (page) {
    page.id = this.model.page.id;
    yield this.data.updatePage(page);
    let model = yield this.data.getPage(this.model.page.id);
    this.set('model', model);
  }).keepLatest(),

  _addOutgoing() {
    this.set('showModal', ADD_OUT);
  },
  _addIncoming() {
    this.set('showModal', ADD_IN);
  },
  _goTo() {
    this.set('showModal', GO_OUT);
  },
  _goFrom() {
    this.set('showModal', GO_IN);
  },


  close() {
    this.set('showModal', false);
  },
  choose(choice) {
    switch (this.showModal) {
      case ADD_OUT:
        let edge = {id: Math.random(), from: this.model.page.id, to: choice.id};
        this.data.basicAdd('links', edge);
        this.model.outgoing.pushObject(edge);
        break;
      case ADD_IN:
        edge = {id: Math.random(), to: this.model.page.id, from: choice.id};
        this.data.basicAdd('links', edge);
        this.model.incoming.pushObject(edge);
        break;
      case GO_OUT:
        this.transitionToRoute('page', choice.id);
        break;
      case GO_IN:
        this.transitionToRoute('page', choice.id);
        break;
      default:
        throw new Error('ahh');
    }
    this.set('showModal', false);
  },
});
