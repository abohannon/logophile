import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from '../components/SearchBar';
import { WordCard } from '../components/WordCard';
import { HighlightedTerm } from '../components/HighlightedTerm';
import { useWordSearch } from '../hooks/useWordSearch';
import { flattenDefinitions, type DictionaryEntry } from '../lib/dictionary';
import type { WordDefinition } from '../lib/dictionary';

export function Home() {
  const { query, setQuery, results, isLoading, clearSearch } = useWordSearch();
  const [selectedWord, setSelectedWord] = useState<DictionaryEntry | null>(null);

  const handleSelectWord = (word: DictionaryEntry) => {
    setSelectedWord(word);
  };

  const handleBack = () => {
    setSelectedWord(null);
  };

  const definitions: WordDefinition[] = selectedWord
    ? flattenDefinitions(selectedWord)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {selectedWord ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 pt-8"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to results
              </button>

              <div className="space-y-4">
                {definitions.map((def, i) => (
                  <WordCard key={i} word={def} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 min-h-[calc(100vh-12rem)] flex flex-col justify-end"
            >
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              )}

              {!isLoading && query && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400">No words found for "{query}"</p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="flex flex-col-reverse space-y-2 space-y-reverse">
                  {results.map((word) => (
                    <motion.button
                      key={word.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelectWord(word)}
                      className="w-full card text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            <HighlightedTerm term={word.term} query={query} />
                          </h3>
                          <p className="text-sm text-slate-400 line-clamp-1">
                            {word.definitions[0]?.definition}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {!query && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">📖</div>
                  <h2 className="text-xl font-bold text-white mb-2">Look up any word</h2>
                  <p className="text-slate-400">Search for words to see definitions,<br />examples, and synonyms</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed search bar at bottom */}
      {!selectedWord && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pt-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={clearSearch}
            placeholder="Search for a word..."
          />
        </div>
      )}
    </div>
  );
}
