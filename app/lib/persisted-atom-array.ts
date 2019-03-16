import {set} from '@ember/object';
import {IDBPDatabase} from 'idb';

export default class PersistedArray<T> {
  constructor(
    public id: string,
    public atoms: Array<T>,
    private db: IDBPDatabase,
  ) {}

  static async load<T>(id: string, db: IDBPDatabase): Promise<PersistedArray<T>> {
    let atoms = await db.getAllFromIndex('atoms', 'collection', id);
    return new this<T>(id, atoms, db);
  }

  async push(atom: T): Promise<null> {
    this.atoms.push(atom);
    set(this, 'atoms', this.atoms);
    await this.db.add('atoms', atom);
    return null;
  }
}

