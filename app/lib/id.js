export default class Id {
  constructor(site, index, lamport) {
    this.site = site;
    this.index = index;
    this.lamport = lamport;
  }

  eq(that) {
    return this.site === that.site && this.index === that.index;
  }

  gt(that) {
    return this.lamport > that.lamport || (this.lamport === that.lamport && this.site > that.site);
  }
}
