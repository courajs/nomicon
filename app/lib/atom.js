export default class Atom {
  constructor({id, collectionId, type, locator, value}) {
    this.id = id;
    this.collectionId = collectionId;
    this.type = type;
    this.locator = locator;
    this.value = value;
  }
};
