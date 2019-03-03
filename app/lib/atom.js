export default class Atom {
  constructor({id, collectionId, type, parentId, value}) {
    this.id = id;
    this.collectionId = collectionId;
    this.type = type;
    this.parentId = parentId;
    this.value = value;
  }
};
