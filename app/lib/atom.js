export default class Atom {
  constructor({id, objectType, objectId, type, parent, value}) {
    this.id = id;
    this.objectType = objectType;
    this.objectId = objectId;
    this.type = type;
    this.parent = parent;
    this.value = value;
  }
};
