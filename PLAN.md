# Logophile - Vocabulary Builder PWA

## Overview
A progressive web app for looking up word definitions, saving words to a personal vocabulary list, and practicing with Tinder-style flashcards using spaced repetition (SM-2 algorithm).

**Project Location:** `~/Projects/logophile`

---

## Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| Build Tool | Vite | Fast, modern, excellent PWA plugin support |
| Framework | React 18 + TypeScript | Type safety, hooks, large ecosystem |
| PWA | vite-plugin-pwa | Zero-config service worker, manifest generation |
| Storage | Dexie.js (IndexedDB) | Reactive hooks for React, handles large datasets |
| Styling | Tailwind CSS | Mobile-first responsive design, small bundle |
| Animations | Framer Motion | Native-feeling swipe gestures |
| Flashcards | react-tinder-card | Tinder-style swipe UX |

---

## Data Sources

### Primary: Open English WordNet 2025
- **URL:** https://en-word.net/
- **Format:** JSON (~11 MB compressed)
- **Contains:** Definitions, example sentences, synonyms, semantic relations
- **License:** CC BY 4.0 (free for personal use)

### Supplementary: Wiktionary Pronunciations
- **Source:** https://kaikki.org/dictionary/rawdata.html
- **Format:** JSONL with IPA transcriptions and audio URLs
- **Size:** ~2-3 MB for English word pronunciations
- **License:** CC BY-SA 3.0

---

## Core Features (MVP)

### 1. Dictionary Lookup
- Search bar with autocomplete
- Display: word, pronunciation (IPA + audio), definition(s), examples, synonyms
- Offline-capable (all data stored in IndexedDB)

### 2. Vocabulary List
- Save words from dictionary with one tap
- View all saved words in a list
- Delete words from collection
- Export/import vocabulary (JSON)

### 3. Flashcard Review (Spaced Repetition)
- Tinder-style swipe: right = "Know it", left = "Don't know"
- SM-2 algorithm implementation:
  - Cards you struggle with appear more frequently
  - Easy cards appear less often over time
  - Track: ease factor, interval, due date per word
- Show due cards count on home screen
- Tap to reveal definition (flip animation)

---

## Project Structure

```
logophile/
├── public/
│   ├── icons/              # PWA icons (192x192, 512x512)
│   └── data/
│       ├── wordnet.json    # Open English WordNet data
│       └── pronunciations.json  # IPA/audio data
├── src/
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── WordCard.tsx
│   │   ├── FlashcardStack.tsx
│   │   ├── VocabList.tsx
│   │   └── Layout.tsx
│   ├── db/
│   │   └── index.ts        # Dexie database schema
│   ├── hooks/
│   │   ├── useWordSearch.ts
│   │   ├── useVocabulary.ts
│   │   └── useSpacedRepetition.ts
│   ├── lib/
│   │   ├── sm2.ts          # SM-2 algorithm
│   │   └── dictionary.ts   # WordNet data access
│   ├── pages/
│   │   ├── Home.tsx        # Search + stats
│   │   ├── Dictionary.tsx  # Word lookup results
│   │   ├── Vocabulary.tsx  # Saved words list
│   │   └── Review.tsx      # Flashcard session
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Tailwind imports
├── index.html
├── vite.config.ts          # PWA configuration
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Database Schema (Dexie.js)

```typescript
interface SavedWord {
  id?: number;
  term: string;
  definition: string;
  examples: string[];
  pronunciation?: string;
  audioUrl?: string;
  synonyms: string[];
  // Spaced repetition fields
  easeFactor: number;      // Default: 2.5
  interval: number;        // Days until next review
  dueDate: Date;
  reviewCount: number;
  createdAt: Date;
}

// Indexes: term, dueDate (for querying due cards)
```

---

## Implementation Steps

### Phase 1: Project Setup
1. Create Vite + React + TypeScript project
2. Install dependencies (Dexie, Tailwind, Framer Motion, vite-plugin-pwa)
3. Configure Tailwind CSS
4. Configure PWA manifest and service worker
5. Set up Dexie database schema
6. Create basic routing (React Router or simple state-based)

### Phase 2: Dictionary Data
1. Download Open English WordNet 2025 JSON
2. Download/extract Wiktionary pronunciation data
3. Create data loading utilities
4. Build search functionality with prefix matching
5. Store dictionary data in IndexedDB on first load

### Phase 3: Core UI
1. Build mobile-first layout with bottom navigation
2. Create SearchBar with debounced autocomplete
3. Create WordCard component (definition, examples, pronunciation)
4. Add "Save to Vocabulary" button functionality
5. Build VocabList page with saved words

### Phase 4: Flashcard System
1. Implement SM-2 spaced repetition algorithm
2. Create FlashcardStack component with Framer Motion
3. Integrate react-tinder-card for swipe gestures
4. Add flip animation to reveal definition
5. Update review stats after each session
6. Show "due for review" count on home screen

### Phase 5: Polish & PWA
1. Add loading states and error handling
2. Implement offline indicator
3. Add install prompt UI
4. Create app icons (multiple sizes)
5. Test on mobile devices
6. Verify offline functionality

---

## SM-2 Algorithm Summary

```typescript
function calculateNextReview(quality: number, card: SavedWord) {
  // quality: 0-5 (0-2 = fail, 3-5 = pass)
  let { easeFactor, interval } = card;

  if (quality < 3) {
    // Failed - reset interval
    interval = 1;
  } else {
    // Passed - increase interval
    if (interval === 0) interval = 1;
    else if (interval === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  // Adjust ease factor
  easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(1.3, easeFactor);

  return { easeFactor, interval, dueDate: addDays(new Date(), interval) };
}
```

---

## Mobile UX Considerations

- **Bottom navigation:** Home | Dictionary | Vocabulary | Review
- **Touch targets:** Minimum 44x44px for all interactive elements
- **Swipe gestures:** Natural left/right on flashcards
- **Haptic feedback:** Use navigator.vibrate() on swipe completion
- **Safe area insets:** Account for notches/home indicators
- **Pull to refresh:** On vocabulary list
- **Skeleton loading:** While dictionary data loads

---

## Future Enhancements (Post-MVP)

- User authentication (Firebase/Supabase)
- Cloud sync across devices
- Word categories/tags
- Daily word notifications
- Learning statistics/streaks
- Multiple language support
- Import from other apps (Anki, Quizlet)
- Share vocabulary lists

---

## Verification Plan

1. **Build & Run:**
   ```bash
   npm run dev    # Development server
   npm run build  # Production build
   npm run preview  # Preview production build
   ```

2. **PWA Testing:**
   - Open in Chrome DevTools > Application > Service Workers
   - Verify manifest loads correctly
   - Test "Install" prompt appears
   - Test offline mode (disconnect network, reload)

3. **Mobile Testing:**
   - Use Chrome DevTools device emulation
   - Test on actual iOS/Android device via local network
   - Verify swipe gestures work smoothly
   - Check safe area handling

4. **Feature Testing:**
   - Search for words and verify results
   - Save words to vocabulary
   - Complete a flashcard session
   - Verify spaced repetition schedules cards correctly
   - Test audio pronunciation playback

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "dexie": "^4.x",
    "dexie-react-hooks": "^1.x",
    "framer-motion": "^11.x",
    "react-tinder-card": "^1.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "vite-plugin-pwa": "^0.20.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```
