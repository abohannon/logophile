/**
 * Dictionary module
 *
 * Loads dictionary data from static JSON file and searches in memory.
 * Does NOT use IndexedDB - that's reserved for user's saved vocabulary.
 */

export interface DictionaryEntry {
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

export interface WordDefinition {
  term: string;
  partOfSpeech: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  pronunciation?: string;
  audioUrl?: string;
}

// In-memory dictionary storage
let dictionary: Map<string, DictionaryEntry> = new Map();
let sortedTerms: string[] = [];
let dictionaryLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadDictionary(): Promise<void> {
  if (dictionaryLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      console.log('Loading dictionary...');
      const response = await fetch('/data/dictionary.json');

      if (!response.ok) {
        console.warn('Dictionary not found, using sample data');
        loadSampleDictionary();
        return;
      }

      const data = await response.json() as Record<string, {
        definitions?: { pos: string; def: string; examples?: string[]; synonyms?: string[] }[];
        pronunciation?: string;
        audio?: string;
      }>;

      // Convert to Map for fast lookups
      for (const [term, info] of Object.entries(data)) {
        const entry: DictionaryEntry = {
          term: term.toLowerCase(),
          definitions: (info.definitions || []).map(d => ({
            partOfSpeech: d.pos || 'unknown',
            definition: d.def || '',
            examples: d.examples || [],
            synonyms: d.synonyms || []
          })),
          pronunciation: info.pronunciation,
          audioUrl: info.audio
        };
        dictionary.set(entry.term, entry);
      }

      // Pre-sort terms for efficient prefix search
      sortedTerms = Array.from(dictionary.keys()).sort();

      console.log(`Dictionary loaded: ${dictionary.size} words`);
      dictionaryLoaded = true;
    } catch (error) {
      console.error('Failed to load dictionary:', error);
      loadSampleDictionary();
    }
  })();

  return loadingPromise;
}

function loadSampleDictionary(): void {
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
      term: 'beautiful',
      definitions: [{
        partOfSpeech: 'adjective',
        definition: 'Pleasing the senses or mind aesthetically',
        examples: ['What a beautiful sunset!'],
        synonyms: ['attractive', 'pretty', 'handsome', 'lovely']
      }],
      pronunciation: '/ˈbjuːtɪf(ə)l/'
    }
  ];

  for (const word of sampleWords) {
    dictionary.set(word.term, word);
  }
  sortedTerms = Array.from(dictionary.keys()).sort();
  dictionaryLoaded = true;
  console.log(`Sample dictionary loaded: ${dictionary.size} words`);
}

export async function searchWords(query: string, limit = 20): Promise<DictionaryEntry[]> {
  if (!query.trim()) return [];

  await loadDictionary();

  const normalizedQuery = query.toLowerCase().trim();
  const results: DictionaryEntry[] = [];

  // Exact match first
  const exactMatch = dictionary.get(normalizedQuery);
  if (exactMatch) {
    results.push(exactMatch);
  }

  // Prefix matches using binary search on sorted terms
  const startIndex = binarySearchPrefix(sortedTerms, normalizedQuery);

  for (let i = startIndex; i < sortedTerms.length && results.length < limit; i++) {
    const term = sortedTerms[i];
    if (!term.startsWith(normalizedQuery)) break;

    // Skip exact match (already added)
    if (term === normalizedQuery) continue;

    const entry = dictionary.get(term);
    if (entry) results.push(entry);
  }

  return results.slice(0, limit);
}

// Binary search to find first term with given prefix
function binarySearchPrefix(arr: string[], prefix: string): number {
  let low = 0;
  let high = arr.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] < prefix) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

export async function getWord(term: string): Promise<DictionaryEntry | undefined> {
  await loadDictionary();
  return dictionary.get(term.toLowerCase());
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
