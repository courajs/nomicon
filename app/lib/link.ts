import Id from './id';
import Page from './page';

export default interface Link {
  id: Id;
  from: Page;
  to: Page;
}

