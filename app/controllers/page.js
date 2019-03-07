import Controller from '@ember/controller';
import {inject} from '@ember/service';
import {task, taskGroup, waitForProperty} from 'ember-concurrency';

import {bound} from 'nomicon/lib/hotkeys';
import {CREATE} from 'nomicon/lib/typeahead';

const MODAL_DEFAULTS = {
  showModal: false,
  modalLabel: '',
  modalOptions: [],
  modalPath: '',
  modalChoice: null,
  modalShowCreateOption: false,
  modalSearchText: '',
};

export default Controller.extend({
  data: inject(),

  //   ...MODAL_DEFAULTS,
  //   ^ this breaks an ESLint rule
  //   (not FAILS it, BREAKS it -- it errors out. Not set up to
  //   handle the spread operator apparently)
  showModal: false,
  modalLabel: '',
  modalOptions: [],
  modalPath: '',
  modalChoice: null,
  modalShowCreateOption: false,
  modalSearchText: '',

  destroyPage: task(function* (page) {
    yield this.data.destroyPage(page);
    yield this.transitionToRoute('home');
    page.destroy();
  }),

  hotkeys: bound({
    'add-outgoing-link': function() {
      this.promptAddOutgoing.perform();
    },
    'add-incoming-link': function() {
      this.promptAddIncoming.perform();
    },
    'follow-outgoing-link': function() {
      this.promptGoTo.perform();
    },
    'follow-incoming-link': function() {
      this.promptGoFrom.perform();
    },
  }),

  _modalChoice(choice, searchText) {
    this.set('modalChoice', choice);
    this.set('modalSearchText', searchText);
  },

  prompts: taskGroup().drop(),

  promptAddOutgoing: task(function* () {
    let pages = yield this.data.pages;
    pages = pages.filter(other => {
      if (other === this.model) {
        return false;
      }
      for (let l of this.model.outgoing) {
        if (other === l.to) {
          return false;
        }
      }
      return true;
    });

    this.setProperties({
      showModal: true,
      modalLabel: 'Add outgoing link...',
      modalOptions: pages,
      modalPath: "title",
      modalShowCreateOption: true,
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    if (choice === CREATE) {
      let page = yield this.data.newPage({title: this.modalSearchText});
      yield this.model.linkTo(page.id);
      this.setProperties(MODAL_DEFAULTS);
      return this.transitionToRoute('page', page.id);
    }
    yield this.model.linkTo(choice.id);
    this.setProperties(MODAL_DEFAULTS);
  }).group('prompts'),

  promptAddIncoming: task(function* () {
    let pages = yield this.data.pages;
    pages = pages.filter(other => {
      if (other === this.model) {
        return false;
      }
      for (let l of this.model.incoming) {
        if (other === l.from) {
          return false;
        }
      }
      return true;
    });

    this.setProperties({
      showModal: true,
      modalLabel: 'Add incoming link...',
      modalOptions: pages,
      modalPath: 'title',
      modalShowCreateOption: true,
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    if (choice === CREATE) {
      let page = yield this.data.newPage({title: this.modalSearchText});
      yield this.model.linkFrom(page.id);
      this.setProperties(MODAL_DEFAULTS);
      return this.transitionToRoute('page', page.id);
    }
    yield this.model.linkFrom(choice.id);
    this.setProperties(MODAL_DEFAULTS);
  }).group('prompts'),

  promptGoTo: task(function* () {
    this.setProperties({
      showModal: true,
      modalLabel: 'Go to...',
      modalOptions: this.model.outgoing,
      modalPath: 'to.title',
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    this.setProperties(MODAL_DEFAULTS);
    return this.transitionToRoute('page', choice.to.id);
  }).group('prompts'),

  promptGoFrom: task(function* () {
    this.setProperties({
      showModal: true,
      modalLabel: 'Go to...',
      modalOptions: this.model.incoming,
      modalPath: 'from.title',
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    this.setProperties(MODAL_DEFAULTS);
    return this.transitionToRoute('page', choice.from.id);
  }).group('prompts'),

  close() {
    this.prompts.cancelAll();
    this.setProperties(MODAL_DEFAULTS);
  },
});
