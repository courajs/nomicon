import Id from './id';

export interface Atom<Value, Kind, Locator> {
  id: Id;
  collectionId: string;
  type: Kind;
  locator: Locator;
  value: Value;
}

export interface AnyAtom extends Atom<any, any, any> {
}
