import Dexie, { type EntityTable } from 'dexie';

export interface SavedWord {
  id?: number;
  term: string;
  definition: string;
  examples: string[];
  pronunciation?: string;
  audioUrl?: string;
  synonyms: string[];
  partOfSpeech?: string;
  easeFactor: number;
  interval: number;
  dueDate: Date;
  reviewCount: number;
  createdAt: Date;
}

const db = new Dexie('LogophileDB') as Dexie & {
  savedWords: EntityTable<SavedWord, 'id'>;
};

// Version 2: Removed dictionary table (dictionary is now loaded from static JSON)
db.version(2).stores({
  savedWords: '++id, term, dueDate, createdAt',
  dictionary: null // Delete the dictionary table
});

// Keep version 1 for migration
db.version(1).stores({
  savedWords: '++id, term, dueDate, createdAt',
  dictionary: '++id, term'
});

export { db };
