import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from '../components/SearchBar';
import { WordCard } from '../components/WordCard';
import { useWordSearch } from '../hooks/useWordSearch';
import { flattenDefinitions, type DictionaryEntry } from '../lib/dictionary';
import type { WordDefinition } from '../lib/dictionary';

export function Search() {
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
    <div className="p-4 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-4">Dictionary</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          autoFocus
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedWord ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mt-4"
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
            className="mt-4"
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
              <div className="space-y-2">
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
                        <h3 className="text-lg font-semibold text-white capitalize">
                          {word.term}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-1">
                          {word.definitions[0]?.definition}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {!query && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-slate-400">Search for any word to get started</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
