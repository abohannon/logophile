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

export interface DictionaryEntry {
  id?: number;
  term: string;
  definitions: {
    partOfSpeech: string;
    definition: string;
    examples: string[];
    synonyms: string[];
  }[];
  pronunciation?: string;
  audioUrl?: string;
}

const db = new Dexie('LogophileDB') as Dexie & {
  savedWords: EntityTable<SavedWord, 'id'>;
  dictionary: EntityTable<DictionaryEntry, 'id'>;
};

db.version(1).stores({
  savedWords: '++id, term, dueDate, createdAt',
  dictionary: '++id, term'
});

export { db };
