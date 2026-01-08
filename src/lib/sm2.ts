import type { SavedWord } from '../db';

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewResult {
  easeFactor: number;
  interval: number;
  dueDate: Date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateNextReview(
  quality: ReviewQuality,
  card: Pick<SavedWord, 'easeFactor' | 'interval' | 'reviewCount'>
): ReviewResult {
  let { easeFactor, interval } = card;
  const { reviewCount } = card;

  if (quality < 3) {
    interval = 1;
  } else {
    if (reviewCount === 0) {
      interval = 1;
    } else if (reviewCount === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(1.3, easeFactor);

  return {
    easeFactor,
    interval,
    dueDate: addDays(new Date(), interval)
  };
}

export function getInitialSpacedRepetitionFields(): Pick<SavedWord, 'easeFactor' | 'interval' | 'dueDate' | 'reviewCount'> {
  return {
    easeFactor: 2.5,
    interval: 0,
    dueDate: new Date(),
    reviewCount: 0
  };
}

export function qualityFromSwipe(direction: 'left' | 'right'): ReviewQuality {
  return direction === 'right' ? 4 : 1;
}
