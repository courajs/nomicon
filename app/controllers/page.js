import Controller from '@ember/controller';
import {inject} from '@ember/service';
import {task, taskGroup, waitForProperty} from 'ember-concurrency';

import {bound} from 'nomicon/lib/hotkeys';

const MODAL_DEFAULTS = {
  showModal: false,
  modalLabel: '',
  modalOptions: [],
  modalPath: '',
  modalChoice: null,
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

  save: task(function* (page) {
    let p = this.model;
    p.set('title', page.title);
    p.set('body', page.body);
    return p.saveAttributes();
  }).keepLatest(),

  destroyPage: task(function* (page) {
    let m = this.model;
    yield this.data.destroyPage(page.id);
    yield this.transitionToRoute('home');
    m.destroy();
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

  prompts: taskGroup().drop(),

  promptAddOutgoing: task(function* () {
    let pages = yield this.data.pages;
    this.setProperties({
      showModal: true,
      modalLabel: 'Add outgoing link...',
      modalOptions: pages,
      modalPath: "title",
      modalChoice: null,
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    yield this.model.linkTo(choice.id);
    this.setProperties(MODAL_DEFAULTS);
  }).group('prompts'),

  promptAddIncoming: task(function* () {
    let pages = yield this.data.pages;
    this.setProperties({
      showModal: true,
      modalLabel: 'Add incoming link...',
      modalOptions: pages,
      modalPath: 'title',
      modalChoice: null,
    });
    let choice = yield waitForProperty(this, 'modalChoice');
    yield this.model.linkFrom(choice.id);
    this.setProperties(MODAL_DEFAULTS);
  }).group('prompts'),

  promptGoTo: task(function* () {
    this.setProperties({
      showModal: true,
      modalLabel: 'Go to...',
      modalOptions: this.model.outgoing,
      modalPath: 'to.title',
      modalChoice: null,
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
      modalChoice: null,
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
