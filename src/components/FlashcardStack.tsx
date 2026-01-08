import { useState, useRef, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import type { SavedWord } from '../db';

interface FlashcardStackProps {
  cards: SavedWord[];
  onSwipe: (card: SavedWord, direction: 'left' | 'right') => void;
  onEmpty?: () => void;
}

type Direction = 'left' | 'right' | 'up' | 'down';

export function FlashcardStack({ cards, onSwipe, onEmpty }: FlashcardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(cards.length - 1);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const currentIndexRef = useRef(currentIndex);

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const handleSwipe = useCallback((direction: Direction, card: SavedWord) => {
    if (direction === 'left' || direction === 'right') {
      onSwipe(card, direction);

      if (navigator.vibrate) {
        navigator.vibrate(direction === 'right' ? [50] : [30, 30, 30]);
      }
    }
    updateCurrentIndex(currentIndexRef.current - 1);

    if (currentIndexRef.current < 0 && onEmpty) {
      setTimeout(onEmpty, 300);
    }
  }, [onSwipe, onEmpty]);

  const handleCardLeftScreen = () => {
    // Card has left, cleanup if needed
  };

  const toggleFlip = (cardId: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center px-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
        <p className="text-slate-400">No cards due for review right now.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto h-[480px]">
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-10">
        <div className="text-red-500/50 text-sm font-medium">← Don't know</div>
        <div className="text-green-500/50 text-sm font-medium">Know it →</div>
      </div>

      <AnimatePresence>
        {cards.map((card, index) => {
          if (index > currentIndex) return null;

          const isFlipped = card.id ? flippedCards.has(card.id) : false;
          const isTop = index === currentIndex;

          return (
            <TinderCard
              key={card.id}
              onSwipe={(dir) => handleSwipe(dir as Direction, card)}
              onCardLeftScreen={handleCardLeftScreen}
              preventSwipe={['up', 'down']}
              className="absolute inset-0"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{
                  scale: isTop ? 1 : 0.95 - (currentIndex - index) * 0.02,
                  opacity: 1,
                  y: (currentIndex - index) * 8
                }}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onClick={() => isTop && card.id && toggleFlip(card.id)}
                style={{ perspective: 1000 }}
              >
                <div
                  className="relative w-full h-full transition-transform duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front of card */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center border border-slate-700"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-sm text-primary-400 mb-2 italic">
                      {card.partOfSpeech}
                    </span>
                    <h2 className="text-4xl font-bold text-white text-center capitalize">
                      {card.term}
                    </h2>
                    {card.pronunciation && (
                      <span className="text-slate-400 mt-2">{card.pronunciation}</span>
                    )}
                    <p className="text-slate-500 text-sm mt-8">Tap to reveal definition</p>
                  </div>

                  {/* Back of card */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary-900 to-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col border border-primary-700"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <span className="text-sm text-primary-300 mb-1 italic">
                      {card.partOfSpeech}
                    </span>
                    <h3 className="text-2xl font-bold text-white capitalize mb-4">
                      {card.term}
                    </h3>
                    <p className="text-lg text-slate-200 leading-relaxed flex-1">
                      {card.definition}
                    </p>
                    {card.examples.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-primary-700/50">
                        <p className="text-slate-300 italic text-sm">
                          "{card.examples[0]}"
                        </p>
                      </div>
                    )}
                    <p className="text-slate-500 text-sm mt-4 text-center">
                      Swipe right if you know it, left if you don't
                    </p>
                  </div>
                </div>
              </motion.div>
            </TinderCard>
          );
        })}
      </AnimatePresence>

      {currentIndex < 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Session complete!</h2>
          <p className="text-slate-400">Great job reviewing your cards.</p>
        </div>
      )}
    </div>
  );
}
