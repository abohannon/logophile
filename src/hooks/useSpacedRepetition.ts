import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SavedWord } from '../db';
import { calculateNextReview, qualityFromSwipe, type ReviewQuality } from '../lib/sm2';

export function useSpacedRepetition() {
  const dueCards = useLiveQuery(
    () => db.savedWords
      .where('dueDate')
      .belowOrEqual(new Date())
      .toArray(),
    []
  );

  const totalCards = useLiveQuery(
    () => db.savedWords.count(),
    []
  );

  const reviewCard = async (
    card: SavedWord,
    direction: 'left' | 'right'
  ): Promise<void> => {
    const quality = qualityFromSwipe(direction);
    await reviewCardWithQuality(card, quality);
  };

  const reviewCardWithQuality = async (
    card: SavedWord,
    quality: ReviewQuality
  ): Promise<void> => {
    if (!card.id) return;

    const result = calculateNextReview(quality, card);

    await db.savedWords.update(card.id, {
      easeFactor: result.easeFactor,
      interval: result.interval,
      dueDate: result.dueDate,
      reviewCount: card.reviewCount + 1
    });
  };

  return {
    dueCards: dueCards || [],
    dueCount: dueCards?.length || 0,
    totalCards: totalCards || 0,
    isLoading: dueCards === undefined,
    reviewCard,
    reviewCardWithQuality
  };
}
