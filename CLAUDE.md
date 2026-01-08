# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Logophile is a vocabulary builder PWA for looking up word definitions, saving words to a personal vocabulary list, and practicing with Tinder-style flashcards using spaced repetition (SM-2 algorithm).

## Commands

```bash
npm run dev       # Start development server (http://localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build
npm run build:dict  # Build dictionary JSON from source data

# E2E tests (Playwright)
npx playwright test                    # Run all tests
npx playwright test e2e/restructure.spec.ts  # Run single test file
npx playwright test --headed           # Run with browser visible
```

## Architecture

### Data Flow
- **Dictionary data**: Loaded from static JSON (`/public/data/dictionary.json`) into memory on app start. NOT stored in IndexedDB.
- **User vocabulary**: Stored in IndexedDB via Dexie.js. Contains saved words with spaced repetition metadata.

### Key Modules

**`src/lib/dictionary.ts`** - Dictionary lookup system
- Loads dictionary JSON into an in-memory `Map<string, DictionaryEntry>`
- Pre-sorts terms for binary search prefix matching
- Falls back to sample data if dictionary.json unavailable

**`src/lib/sm2.ts`** - SM-2 spaced repetition algorithm
- `calculateNextReview(quality, card)` - Computes next review date and ease factor
- Quality 0-2 = fail (reset interval), 3-5 = pass (increase interval)
- `qualityFromSwipe('left' | 'right')` - Maps swipe direction to quality score

**`src/db/index.ts`** - Dexie database schema
- Single table: `savedWords` with indexes on `term`, `dueDate`, `createdAt`
- `SavedWord` interface includes SR fields: `easeFactor`, `interval`, `dueDate`, `reviewCount`

### Hooks

- `useVocabulary()` - CRUD operations for saved words
- `useSpacedRepetition()` - Query due cards, process reviews
- `useWordSearch()` - Dictionary search with results

### Routes

- `/` - Home (dictionary search)
- `/vocabulary` - Saved words list
- `/review` - Flashcard review session

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS for styling
- Dexie.js for IndexedDB (user data only)
- Framer Motion + react-tinder-card for swipe gestures
- vite-plugin-pwa for service worker and manifest
