import uuid from 'uuid/v4';
import Id from './id';

export default class Site {
  constructor(id, index, lamport) {
    this.id = id;
    this.index = index;
    this.lamport = lamport;
  }

  static load() {
    let id = window.localStorage.NomiconSiteId;
    let index, lamport;
    if (!id) {
      window.localStorage.NomiconSiteId = id = uuid();
      window.localStorage.NomiconSiteIndex = index = 0;
      window.localStorage.NomiconLamport = lamport = 0;
    } else {
      index = window.localStorage.NomiconSiteIndex;
      lamport = window.localStorage.NomiconLamport;
    }
    return new this(id, index, lamport);
  }

  nextId() {
    let index = localStorage.NomiconSiteIndex++;
    let lamport = localStorage.NomiconLamport++;
    return new Id(this.id, index, lamport);
  }
}
