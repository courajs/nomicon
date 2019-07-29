import Controller from '@ember/controller';

export default class extends Controller {
  clicks = [1,2,3];
  doClick(e) {
    console.log('hey');
  }
}
