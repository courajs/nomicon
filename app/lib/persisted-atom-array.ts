import {tracked} from '@glimmer/tracking';
import {IDBPDatabase} from 'idb';

export default class PersistedArray<T> {
  @tracked atoms: Array<T>;

  constructor(
    public id: string,
    atoms: Array<T>,
    private db: IDBPDatabase,
  ) {
    this.atoms = atoms;
  }

  static async load<T>(id: string, db: IDBPDatabase): Promise<PersistedArray<T>> {
    let atoms = await db.getAllFromIndex('atoms', 'collection', id);
    return new this<T>(id, atoms, db);
  }

  async push(atom: T): Promise<void> {
    this.atoms.push(atom);
    this.atoms = this.atoms;
    await this.db.add('atoms', atom);
  }
}

