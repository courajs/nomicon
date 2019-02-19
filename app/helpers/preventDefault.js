import { helper } from '@ember/component/helper';

export function preventDefault([f]) {
  return function(e) {
    e.preventDefault();
    f();
  }
}

export default helper(preventDefault);
