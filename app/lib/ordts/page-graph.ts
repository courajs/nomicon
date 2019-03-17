import uuid from 'uuid/v4';

import Id from '../id';
import {Atom} from '../atom';
import PersistedArray from '../persisted-atom-array';


interface pageValue {
  uuid: string;
  homeCollectionId: string;
  titleCollectionId: string;
  bodyCollectionId: string;
}
interface linkValue {
  from: string;
  to: string;
}

type PageAtom = Atom<pageValue, 'new-page', Id|null>;
type LinkAtom = Atom<linkValue, 'new-link', Id|null>;
type DelAtom  = Atom<null, 'delete', Id>;
export type GraphAtom = PageAtom | LinkAtom | DelAtom;

interface Deletable {
  deleted?: boolean;
}

function assertNever(x: never): never { return x; }

export default class {
  constructor(
    public id: string,
    private atoms: PersistedArray<GraphAtom>,
    private store: any
  ) {}

  process(): {pages: Array<PageAtom>, links: Array<LinkAtom>} {
    let items: { [key: string]: GraphAtom & Deletable; } = {};
    let pages: Array<PageAtom & Deletable> = [];
    let links: Array<LinkAtom & Deletable> = [];

    for (let atom of this.atoms.atoms) {
      switch (atom.type) {
        case 'new-page':
          pages.push(atom);
          items[`${atom.id.site}:${atom.id.lamport}`] = atom;
          break;
        case 'new-link':
          links.push(atom);
          items[`${atom.id.site}:${atom.id.lamport}`] = atom;
          break;
        case 'delete':
          items[`${atom.locator.site}:${atom.locator.lamport}`].deleted = true;
          break;
        default:
          assertNever(atom);
      }
    }

    return {
      pages: pages.filter(p => !p.deleted),
      links: links.filter(l => !l.deleted),
    };
  }

  prevId(): Id|null {
    for (let i=this.atoms.atoms.length-1; i>=0; i--) {
      if (this.atoms.atoms[i].type !== 'delete') {
        return this.atoms.atoms[i].id;
      }
    }
    return null;
  }

  async deleteItem(itemId: Id): Promise<void> {
    let atom: DelAtom = {
      id: this.store.nextId(),
      collectionId: this.id,
      type: 'delete',
      locator: itemId,
      value: null,
    };
    return this.atoms.push(atom);
  }

  async createPage(): Promise<PageAtom> {
    let atom: PageAtom = {
      id: this.store.nextId(),
      collectionId: this.id,
      type: 'new-page',
      locator: this.prevId(),
      value: {
        uuid: uuid(),
        homeCollectionId: uuid(),
        titleCollectionId: uuid(),
        bodyCollectionId: uuid(),
      },
    };
    await this.atoms.push(atom);
    return atom;
  }

  async createLink(fromUUID: string, toUUID: string): Promise<LinkAtom> {
    let atom: LinkAtom = {
      id: this.store.nextId(),
      collectionId: this.id,
      type: 'new-link',
      locator: this.prevId(),
      value: {
        from: fromUUID,
        to: toUUID,
      },
    };
    await this.atoms.push(atom);
    return atom;
  }
}
