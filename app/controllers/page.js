import Controller from '@ember/controller';
import {inject} from '@ember/service';
import {computed} from '@ember/object';
import {alias} from '@ember/object/computed';
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
  graph: inject(),

  page: alias('model.page'),
  title: alias('model.titleSequence'),
  incoming: alias('model.links.value.incoming'),
  outgoing: alias('model.links.value.outgoing'),

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
    yield this.graph.delete(page.uuid);
    yield this.transitionToRoute('home');
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
    let pages = yield this.graph.pages;
    pages = pages.filter(other => {
      if (other === this.page) {
        return false;
      }
      for (let l of this.page.outgoing) {
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
      let newPage = yield this.graph.newPage();
      yield newPage.titleSequence.become(this.modalSearchText);
      yield this.graph.link(this.page.uuid, newPage.uuid);
      this.setProperties(MODAL_DEFAULTS);
      return this.transitionToRoute('page', newPage.uuid);
    }
    yield this.graph.link(this.page.uuid, choice.uuid);
    this.setProperties(MODAL_DEFAULTS);
  }).group('prompts'),

  promptAddIncoming: task(function* () {
    let pages = yield this.graph.pages;
    pages = pages.filter(other => {
      if (other === this.page) {
        return false;
      }
      for (let l of this.page.incoming) {
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
      let newPage = yield this.graph.newPage();
      yield newPage.titleSequence.become(this.modalSearchText);
      yield this.graph.link(newPage.uuid, this.page.uuid);
      this.setProperties(MODAL_DEFAULTS);
      return this.transitionToRoute('page', newPage.uuid);
    }
    yield this.graph.link(choice.uuid, this.page.uuid);
    this.setProperties(MODAL_DEFAULTS);
  }).group('prompts'),

  promptGoTo: task(function* () {
    this.setProperties({
      showModal: true,
      modalLabel: 'Go to...',
      modalOptions: this.page.outgoing,
      modalPath: 'to.title',
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    this.setProperties(MODAL_DEFAULTS);
    return this.transitionToRoute('page', choice.to.uuid);
  }).group('prompts'),

  promptGoFrom: task(function* () {
    this.setProperties({
      showModal: true,
      modalLabel: 'Go to...',
      modalOptions: this.page.incoming,
      modalPath: 'from.title',
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    this.setProperties(MODAL_DEFAULTS);
    return this.transitionToRoute('page', choice.from.uuid);
  }).group('prompts'),

  close() {
    this.prompts.cancelAll();
    this.setProperties(MODAL_DEFAULTS);
  },
});
