export default class IdClass implements Id {
  constructor(
    public site: string, 
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

export interface Id {
  site: string;
  index: number;
  lamport: number;
}

export function eq(a: Id, b: Id): boolean {
  return a.site === b.site && a.index === b.index;
}

export function cmp(a: Id, b: Id): number {
  let diff = a.lamport - b.lamport;
  if (diff !== 0) {
    return diff;
  }

  if (a.site < b.site) {
    return -1;
  } else if (a.site > b.site) {
    return 1;
  } else {
    return 0;
  }
}
