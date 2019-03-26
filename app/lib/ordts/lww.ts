import {tracked} from '@glimmer/tracking';

import Id from '../id';
import {Atom} from '../atom';
import ORDT from './ordt';

export type LWWAtom<ContentType> = Atom<ContentType, 'write', Id|null>

export default class LWW<ContentType> implements ORDT<LWWAtom<ContentType>, ContentType> {
  readonly collectionId: string;
  @tracked private atoms: Array<LWWAtom<ContentType>>;
  private defaultValue: ContentType;

  constructor(collectionId: string, atoms: Array<LWWAtom<ContentType>>, d: ContentType) {
    this.collectionId = collectionId;
    this.atoms = atoms;
    this.defaultValue = d;
  }

  // Perhaps...
  // static withDefault<D>(dValue: D): LWW<D> { ... }

  mergeAtoms(atoms: Array<LWWAtom<ContentType>>): void {
    throw new Error("not implemented");
    console.log(atoms);
  }

  get value(): ContentType {
    if (this.atoms.length) {
      return this.atoms[this.atoms.length-1].value;
    } else {
      return this.defaultValue;
    }
  }

  setValue(newVal: ContentType, id: Id): LWWAtom<ContentType> {
    let prev = this.atoms[this.atoms.length-1];
    let prevId = prev && prev.id || null;
    let a: LWWAtom<ContentType> = {
      id,
      collectionId: this.collectionId,
      type: 'write',
      locator: prevId,
      value: newVal,
    };
    this.atoms.push(a);
    this.atoms = this.atoms;
    return a;
  }
};
