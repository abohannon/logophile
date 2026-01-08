import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlashcardStack } from '../components/FlashcardStack';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import { useVocabulary } from '../hooks/useVocabulary';

export function Review() {
  const { dueCards, dueCount, totalCards, reviewCard, isLoading } = useSpacedRepetition();
  const { savedWords } = useVocabulary();
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);

  const masteredCount = savedWords.filter(w => w.interval >= 21).length;
  const learningCount = savedWords.filter(w => w.interval > 0 && w.interval < 21).length;
  const newCount = savedWords.filter(w => w.reviewCount === 0).length;

  const handleStartReview = () => {
    setSessionActive(true);
    setSessionComplete(false);
    setReviewed(0);
    setCorrect(0);
  };

  const handleSwipe = async (card: typeof dueCards[0], direction: 'left' | 'right') => {
    await reviewCard(card, direction);
    setReviewed(r => r + 1);
    if (direction === 'right') {
      setCorrect(c => c + 1);
    }
  };

  const handleEmpty = () => {
    setSessionComplete(true);
  };

  const handleBackToStats = () => {
    setSessionActive(false);
    setSessionComplete(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Session complete screen
  if (sessionActive && sessionComplete) {
    return (
      <div className="p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        >
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">Session Complete!</h1>
          <p className="text-slate-400 mb-8">
            You reviewed {reviewed} cards with {correct} correct.
          </p>

          {reviewed > 0 && (
            <div className="card w-full max-w-xs mb-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary-400">
                  {Math.round((correct / reviewed) * 100)}%
                </p>
                <p className="text-slate-400 text-sm">Accuracy</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={handleBackToStats} className="btn-secondary">
              Back to Stats
            </button>
            {dueCount > 0 && (
              <button onClick={handleStartReview} className="btn-primary">
                Review More
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Active review session
  if (sessionActive && dueCards.length > 0) {
    return (
      <div className="p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-white">Review Session</h1>
          <p className="text-slate-400">
            {dueCards.length} {dueCards.length === 1 ? 'card' : 'cards'} remaining
          </p>
        </motion.div>

        <FlashcardStack
          cards={dueCards}
          onSwipe={handleSwipe}
          onEmpty={handleEmpty}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-slate-500"
        >
          <p>Tap card to flip • Swipe to answer</p>
        </motion.div>
      </div>
    );
  }

  // Pre-session stats view (default)
  return (
    <div className="p-4 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Review</h1>
        <p className="text-slate-400 mt-1">Track your progress</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <StatCard
          label="Total Words"
          value={totalCards}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatCard
          label="Due Today"
          value={dueCount}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          highlight={dueCount > 0}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Progress</h2>
        <div className="space-y-3">
          <ProgressBar label="Mastered" count={masteredCount} total={totalCards} color="bg-green-500" />
          <ProgressBar label="Learning" count={learningCount} total={totalCards} color="bg-yellow-500" />
          <ProgressBar label="New" count={newCount} total={totalCards} color="bg-blue-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {dueCount > 0 ? (
          <button
            onClick={handleStartReview}
            className="w-full btn-primary py-4 text-lg font-semibold"
          >
            Start Review ({dueCount} {dueCount === 1 ? 'card' : 'cards'})
          </button>
        ) : totalCards > 0 ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-slate-400">All caught up! No cards due for review.</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-400 mb-4">No words in your vocabulary yet.</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search for words
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`card ${highlight ? 'ring-2 ring-primary-500' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700 text-slate-400'}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  count,
  total,
  color
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{count}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
