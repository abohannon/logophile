import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlashcardStack } from '../components/FlashcardStack';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';

export function Review() {
  const { dueCards, dueCount, reviewCard, isLoading } = useSpacedRepetition();
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);

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

  const handleRestart = () => {
    setSessionComplete(false);
    setReviewed(0);
    setCorrect(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (sessionComplete || dueCards.length === 0) {
    return (
      <div className="p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        >
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {reviewed > 0 ? 'Session Complete!' : 'All Caught Up!'}
          </h1>
          <p className="text-slate-400 mb-8">
            {reviewed > 0
              ? `You reviewed ${reviewed} cards with ${correct} correct.`
              : 'No cards are due for review right now.'}
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
            {reviewed > 0 && dueCount > 0 && (
              <button onClick={handleRestart} className="btn-secondary">
                Review More
              </button>
            )}
            <Link to="/search" className="btn-primary">
              Add More Words
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
