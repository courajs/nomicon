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

function assertNever(x: never): never { return x; }

export class PageGraph {
  pages: Map<string, PageNode>;

  removePage(a: PageAtom): void {
    let p = this.pages.get(a.value.uuid);
    for (let e of p.outgoing) {
      e.to.incoming.removeObject(e);
      e.to.incoming = e.to.incoming;
    }
    for (let e of p.incoming) {
      e.from.outgoing.removeObject(e);
      e.from.outgoing = e.from.outgoing;
    }
    this.pages.delete(a.value.uuid);
  }
  removeLink(a: LinkAtom): void {
    let from = this.pages.get(a.value.from);
    from.removeLinkTo(a.value.to);
    let to = this.pages.get(a.value.to);
    to.removeLinkFrom(a.value.from);
  }
}

export interface PageNodeParams {
  incoming?: Array<PageEdge>;
  outgoing?: Array<PageEdge>;
  readonly id: Id;
  readonly uuid string;
  readonly homeCollectionId string;
  readonly titleCollectionId string;
  readonly bodyCollectionId string;
}

export class PageNode implements PageNodeParams {
  @tracked incoming: Array<PageEdge> = [];
  @tracked outgoing: Array<PageEdge> = [];
  constructor(p: PageNodeParams) {
    Object.assign(this, p);
  }
  removeLinkTo(uuid: string): void {
    for (let i=0; i<this.outgoing.length; i++) {
      if (this.outgoing[i].to.uuid === uuid) {
        this.outgoing.splice(i, 1);
        this.outgoing = this.outgoing;
        return;
      }
    }
  }
  removeLinkFrom(uuid: string) {
    for (let i=0; i<this.incoming.length; i++) {
      if (this.incoming[i].from.uuid === uuid) {
        this.incoming.splice(i, 1);
        this.incoming = this.outgoing;
        return;
      }
    }
  }
}

export interface PageEdge {
  readonly id: Id;
  readonly from: PageNode;
  readonly to: PageNode;
}

export default class GraphORDT implements ORDT<GraphAtom, PageGraph> {
  readonly collectionId string;
  private atoms: Array<GraphAtom>;
  private graph?: PageGraph;

  constructor(
    collectionId: string,
    atoms: Array<GraphAtom>,
  ) {
    this.collectionId = collectionId;
    this.atoms = atoms;
  }

  mergeAtoms(atoms: GraphAtom[]): void {
    for (let atom of atoms) {
      if (atom.type === 'delete') {
        // Find the atom we're deleting, and put it right afterwards
        for (let i = 0; i<this.atoms.length; i++) {
          if (atom.locator.eq(this.atoms[i].id)) {
            this.atoms.splice(i, 0, atom);
            let parent = this.atoms[i];
            if (parent.type === 'new-link') {
              this.graph.removeLink(parent);
            } else if (parent.type === 'new-page') {
              this.graph.removePage(parent);
            }
            break;
          }
        }
      } else if (atom.type === 'new-link' || atom.type === 'new-page') {
        // new things get inserted at the end, so search backwards
        if (atom.locator === null) {
          this.atoms.unshift(atom);
        } else {
          for (let i = this.atoms.length-1; i>=0; i--) {
            if (atom.locator.eq(this.atoms[i].id)) {
              // Deletes hug their parent, so insert afterwards if there are any
              while (this.atoms[i+1] && this.atoms[i+1].type === 'delete') { i++; }
              this.atoms.splice(i, 0, atom);
              break;
            }
          }
        }
        if (atom.type === 'new-page') {
          this.graph.pages.set(atom.value.uuid, new PageNode
        } else if (atom.type === 'new-link') {
          this.graph.link(atom.value.from, atom.value.to);
        }
      }
    }
  }

  get value(): PageGraph {
    let pages: PageAtom[] = [];
    let links: LinkAtom[] = [];

    let last: GraphAtom|null = null;

    function save(a: GraphAtom|null): void {
      if (!a) {return;}
      switch (atom.type) {
        case 'new-page':
          pages.push(a);
          break;
        case 'new-link':
          links.push(a);
          break;
      }
    }

    for (let atom of this.atoms) {
      switch (atom.type) {
        case 'new-page':
        case 'new-link':
          save(last);
          last = atom;
          break;
        case 'delete':
          last = null;
          break;
        default:
          assertNever(atom);
      }
    }
    save(last);

    let map = new Map<string, PageNode>();
    for (let page of pages) {
      let node = new PageNode(Object.assign({id: page.id}, page.value));
      map.set(page.value.uuid, node);
    }
    for (let link of links) {
      let edge: PageEdge = {id: link.id, from: link.value.from, to: link.value.to};
      map.get(link.value.from).outgoing.push(edge);
      map.get(link.value.to).incoming.push(edge);
    }
    this.graph = {pages: map};
    return this.graph;
  }

  private prevId(): Id|null {
    for (let i=this.atoms.atoms.length-1; i>=0; i--) {
      if (this.atoms.atoms[i].type !== 'delete') {
        return this.atoms.atoms[i].id;
      }
    }
    return null;
  }

  deleteItem(toDeleteId: Id, newAtomId: Id): Update<GraphAtom> {
    let atom: DelAtom = {
      id: newAtomId,
      collectionId: this.id,
      type: 'delete',
      locator: toDeleteId,
      value: null,
    };
    this.mergeAtoms([atom]);
    return {
      newAtoms: [atom],
      updatedArray: this.atoms,
    };
  }

  createPage(newAtomId: Id): Update<GraphAtom> {
    let atom: PageAtom = {
      id: newAtomId,
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
    this.mergeAtoms([atom]);
    return {
      newAtoms: [atom],
      updatedArray: this.atoms,
    };
  }

  createLink(fromUUID: string, toUUID: string, newAtomId: Id): Update<GraphAtom> {
    let atom: LinkAtom = {
      id: newAtomId,
      collectionId: this.id,
      type: 'new-link',
      locator: this.prevId(),
      value: {
        from: fromUUID,
        to: toUUID,
      },
    };
    this.mergeAtoms([atom]);
    return {
      newAtoms: [atom],
      updatedArray: this.atoms,
    };
  }
}
