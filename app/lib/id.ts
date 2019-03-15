export default class Id {
  constructor(
    public site: String, 
    public index: number,
    public lamport: number,
  ) {}

  eq(that: Id): boolean {
    return this.site === that.site && this.index === that.index;
  }

  gt(that: Id): boolean {
    return this.lamport > that.lamport || (this.lamport === that.lamport && this.site > that.site);
  }
}
