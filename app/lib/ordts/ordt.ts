export default interface ORDT<AtomType, ValueType> {
  collectionId: string;
  value: ValueType;
  mergeAtoms(atoms: AtomType[]): void;
}

export interface Update<AtomType> {
  newAtoms: AtomType[];
  updatedArray: AtomType[];
}
