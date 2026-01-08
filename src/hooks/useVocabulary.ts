import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavedWord } from '../db';
import { getInitialSpacedRepetitionFields } from '../lib/sm2';
import type { WordDefinition } from '../lib/dictionary';

export function useVocabulary() {
  const savedWords = useLiveQuery(
    () => db.savedWords.orderBy('createdAt').reverse().toArray(),
    []
  );

  const isWordSaved = async (term: string): Promise<boolean> => {
    const count = await db.savedWords.where('term').equals(term.toLowerCase()).count();
    return count > 0;
  };

  const saveWord = async (word: WordDefinition): Promise<void> => {
    const exists = await isWordSaved(word.term);
    if (exists) return;

    await db.savedWords.add({
      term: word.term.toLowerCase(),
      definition: word.definition,
      examples: word.examples,
      pronunciation: word.pronunciation,
      audioUrl: word.audioUrl,
      synonyms: word.synonyms,
      partOfSpeech: word.partOfSpeech,
      ...getInitialSpacedRepetitionFields(),
      createdAt: new Date()
    });
  };

  const removeWord = async (id: number): Promise<void> => {
    await db.savedWords.delete(id);
  };

  const getWordByTerm = async (term: string): Promise<SavedWord | undefined> => {
    return db.savedWords.where('term').equals(term.toLowerCase()).first();
  };

  const exportVocabulary = (): string => {
    if (!savedWords) return '[]';
    return JSON.stringify(savedWords, null, 2);
  };

  const importVocabulary = async (json: string): Promise<number> => {
    const words = JSON.parse(json) as SavedWord[];
    let imported = 0;

    for (const word of words) {
      const exists = await isWordSaved(word.term);
      if (!exists) {
        await db.savedWords.add({
          ...word,
          id: undefined,
          dueDate: new Date(word.dueDate),
          createdAt: new Date(word.createdAt)
        });
        imported++;
      }
    }

    return imported;
  };

  return {
    savedWords: savedWords || [],
    isLoading: savedWords === undefined,
    saveWord,
    removeWord,
    isWordSaved,
    getWordByTerm,
    exportVocabulary,
    importVocabulary
  };
}
