import { db, type DictionaryEntry } from '../db';

export type { DictionaryEntry };

export interface WordDefinition {
  term: string;
  partOfSpeech: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  pronunciation?: string;
  audioUrl?: string;
}

let dictionaryLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadDictionary(): Promise<void> {
  if (dictionaryLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const count = await db.dictionary.count();
    if (count > 0) {
      dictionaryLoaded = true;
      return;
    }

    try {
      const response = await fetch('/data/wordnet.json');
      if (!response.ok) {
        console.warn('WordNet data not found, using sample data');
        await loadSampleDictionary();
        dictionaryLoaded = true;
        return;
      }

      const data = await response.json();
      const entries: DictionaryEntry[] = [];

      for (const [term, info] of Object.entries(data as Record<string, unknown>)) {
        const wordInfo = info as {
          definitions?: { pos: string; def: string; examples?: string[]; synonyms?: string[] }[];
          pronunciation?: string;
          audio?: string;
        };

        entries.push({
          term: term.toLowerCase(),
          definitions: (wordInfo.definitions || []).map(d => ({
            partOfSpeech: d.pos || 'unknown',
            definition: d.def || '',
            examples: d.examples || [],
            synonyms: d.synonyms || []
          })),
          pronunciation: wordInfo.pronunciation,
          audioUrl: wordInfo.audio
        });
      }

      // If no entries from wordnet.json, load sample data
      if (entries.length === 0) {
        console.warn('WordNet data is empty, using sample data');
        await loadSampleDictionary();
        dictionaryLoaded = true;
        return;
      }

      await db.dictionary.bulkAdd(entries);
      dictionaryLoaded = true;
    } catch (error) {
      console.error('Failed to load dictionary:', error);
      await loadSampleDictionary();
      dictionaryLoaded = true;
    }
  })();

  return loadingPromise;
}

async function loadSampleDictionary(): Promise<void> {
  const sampleWords: DictionaryEntry[] = [
    {
      term: 'logophile',
      definitions: [{
        partOfSpeech: 'noun',
        definition: 'A lover of words; a person who loves words',
        examples: ['As a logophile, she spent hours reading the dictionary for pleasure.'],
        synonyms: ['word lover', 'philologist', 'linguaphile']
      }],
      pronunciation: '/ˈlɒɡəfʌɪl/'
    },
    {
      term: 'ephemeral',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Lasting for a very short time',
        examples: ['The ephemeral beauty of cherry blossoms makes them even more precious.'],
        synonyms: ['fleeting', 'transient', 'momentary', 'brief']
      }],
      pronunciation: '/ɪˈfem(ə)rəl/'
    },
    {
      term: 'serendipity',
      definitions: [{
        partOfSpeech: 'noun',
        definition: 'The occurrence of events by chance in a happy or beneficial way',
        examples: ['Finding that rare book was pure serendipity.'],
        synonyms: ['chance', 'fortune', 'luck', 'providence']
      }],
      pronunciation: '/ˌserənˈdipədē/'
    },
    {
      term: 'eloquent',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Fluent or persuasive in speaking or writing',
        examples: ['She gave an eloquent speech that moved the audience to tears.'],
        synonyms: ['articulate', 'expressive', 'fluent', 'persuasive']
      }],
      pronunciation: '/ˈeləkwənt/'
    },
    {
      term: 'ubiquitous',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Present, appearing, or found everywhere',
        examples: ['Smartphones have become ubiquitous in modern society.'],
        synonyms: ['omnipresent', 'ever-present', 'pervasive', 'universal']
      }],
      pronunciation: '/yo͞oˈbikwədəs/'
    },
    {
      term: 'mellifluous',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Sweet-sounding; pleasant to hear',
        examples: ['Her mellifluous voice was perfect for narrating audiobooks.'],
        synonyms: ['sweet-sounding', 'dulcet', 'honeyed', 'melodious']
      }],
      pronunciation: '/məˈliflo͞oəs/'
    },
    {
      term: 'perspicacious',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Having a ready insight into and understanding of things',
        examples: ['The perspicacious detective noticed the crucial clue everyone else missed.'],
        synonyms: ['astute', 'shrewd', 'perceptive', 'discerning']
      }],
      pronunciation: '/ˌpərspəˈkāSHəs/'
    },
    {
      term: 'ineffable',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Too great or extreme to be expressed or described in words',
        examples: ['She felt an ineffable joy when she held her newborn baby.'],
        synonyms: ['indescribable', 'inexpressible', 'unspeakable', 'unutterable']
      }],
      pronunciation: '/inˈefəb(ə)l/'
    },
    {
      term: 'sanguine',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Optimistic or positive, especially in a difficult situation',
        examples: ['Despite the setback, she remained sanguine about the project\'s success.'],
        synonyms: ['optimistic', 'hopeful', 'confident', 'positive']
      }],
      pronunciation: '/ˈsaNGɡwən/'
    },
    {
      term: 'quixotic',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Exceedingly idealistic; unrealistic and impractical',
        examples: ['His quixotic quest to eliminate all poverty seemed noble but impossible.'],
        synonyms: ['idealistic', 'romantic', 'visionary', 'impractical']
      }],
      pronunciation: '/kwikˈsädik/'
    },
    {
      term: 'laconic',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Using very few words; brief and concise',
        examples: ['His laconic reply of "No" ended the conversation abruptly.'],
        synonyms: ['brief', 'concise', 'terse', 'succinct']
      }],
      pronunciation: '/ləˈkänik/'
    },
    {
      term: 'esoteric',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Intended for or understood by only a small number of people with specialized knowledge',
        examples: ['The professor\'s esoteric lecture on quantum mechanics confused most of the audience.'],
        synonyms: ['obscure', 'arcane', 'abstruse', 'recondite']
      }],
      pronunciation: '/ˌesəˈterik/'
    }
  ];

  await db.dictionary.bulkAdd(sampleWords);
}

export async function searchWords(query: string, limit = 20): Promise<DictionaryEntry[]> {
  if (!query.trim()) return [];

  await loadDictionary();

  const normalizedQuery = query.toLowerCase().trim();

  const exactMatch = await db.dictionary
    .where('term')
    .equals(normalizedQuery)
    .first();

  const prefixMatches = await db.dictionary
    .where('term')
    .startsWith(normalizedQuery)
    .limit(limit)
    .toArray();

  const results = exactMatch
    ? [exactMatch, ...prefixMatches.filter(w => w.term !== exactMatch.term)]
    : prefixMatches;

  return results.slice(0, limit);
}

export async function getWord(term: string): Promise<DictionaryEntry | undefined> {
  await loadDictionary();
  return db.dictionary.where('term').equals(term.toLowerCase()).first();
}

export function flattenDefinitions(entry: DictionaryEntry): WordDefinition[] {
  return entry.definitions.map(def => ({
    term: entry.term,
    partOfSpeech: def.partOfSpeech,
    definition: def.definition,
    examples: def.examples,
    synonyms: def.synonyms,
    pronunciation: entry.pronunciation,
    audioUrl: entry.audioUrl
  }));
}
