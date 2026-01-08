import { motion, AnimatePresence } from 'framer-motion';
import type { SavedWord } from '../db';

interface VocabListProps {
  words: SavedWord[];
  onRemove: (id: number) => void;
}

export function VocabList({ words, onRemove }: VocabListProps) {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-xl font-bold text-white mb-2">No words saved yet</h2>
        <p className="text-slate-400">Search for words and tap + to add them to your vocabulary.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {words.map((word) => (
          <motion.div
            key={word.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            className="card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-semibold text-white capitalize truncate">
                    {word.term}
                  </h3>
                  <span className="text-xs text-primary-400 italic shrink-0">
                    {word.partOfSpeech}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mt-1 line-clamp-2">
                  {word.definition}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>Reviews: {word.reviewCount}</span>
                  <span>Next: {formatDueDate(word.dueDate)}</span>
                </div>
              </div>
              <button
                onClick={() => word.id && onRemove(word.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function formatDueDate(date: Date): string {
  const now = new Date();
  const due = new Date(date);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Now';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks`;
  return `${Math.round(diffDays / 30)} months`;
}
