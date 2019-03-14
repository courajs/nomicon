export interface Atom<Value, Kind, Locator> {
  id: String;
  collectionId: String;
  type: Kind;
  locator: Locator;
  value: Value;
}

export interface AnyAtom extends Atom<any, any, any> {
}
