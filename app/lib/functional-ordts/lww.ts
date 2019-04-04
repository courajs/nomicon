import Id, {cmp} from '../id';
import {Atom} from '../atom';

type AtomFor<ContentType> = Atom<ContentType, 'write', null>;

export interface LWW<ContentType> {
  collectionId: string;
  atoms: AtomFor<ContentType>;
}

export function resolve<C>(it: LWW<C>): C|null {
  if (it.atoms.length === 0) {
    return null;
  } else {
    return it.atoms[it.atoms.length-1].value;
  }
}

export function mergeAtoms<C>(existing: AtomFor<C>[], newAtoms: AtomFor<C>[]): AtomFor<C>[] {
  return existing.concat(newAtoms).sort((a,b) => cmp(a.id, b.id));
}

export function write<C>(existing: AtomFor<C>[], value: C, nextId: Id): AtomFor<C> {
  return existing.concat({
    id: nextId,
    collectionId
  });
}
