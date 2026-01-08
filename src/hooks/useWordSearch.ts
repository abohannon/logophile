import { useState, useEffect, useCallback } from 'react';
import { searchWords, type DictionaryEntry } from '../lib/dictionary';

export function useWordSearch(debounceMs = 150) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      const words = await searchWords(query);
      setResults(words);
      setIsLoading(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    clearSearch
  };
}
