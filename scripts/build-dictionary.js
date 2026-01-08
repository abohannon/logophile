#!/usr/bin/env node

/**
 * Build Dictionary Script
 *
 * Downloads and processes Kaikki English dictionary data from Wiktionary.
 * Outputs a JSON file with definitions, examples, IPA pronunciations, and synonyms.
 *
 * Usage: node scripts/build-dictionary.js
 */

import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync, readFileSync } from 'fs';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const KAIKKI_URL = 'https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz';
const FREQUENCY_URL = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt';
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'dictionary.json');
const TEMP_DIR = join(__dirname, 'downloads');
const TEMP_FILE = join(TEMP_DIR, 'kaikki-english.jsonl.gz');

// Word limit - set to Infinity for all words
// Start with 30k for faster initial load, can increase later
const WORD_LIMIT = 30000;

// Progress tracking
let processedLines = 0;
let includedWords = 0;
let lastProgressTime = Date.now();

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

async function downloadFile(url, destPath, description) {
  console.log(`Downloading ${description}...`);
  console.log(`  URL: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const totalSize = parseInt(response.headers.get('content-length') || '0');
  let downloadedSize = 0;
  const startTime = Date.now();

  // Ensure temp directory exists
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }

  const fileStream = createWriteStream(destPath);
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    downloadedSize += value.length;
    fileStream.write(value);

    // Progress update every 2 seconds
    const now = Date.now();
    if (now - lastProgressTime > 2000) {
      const elapsed = now - startTime;
      const speed = downloadedSize / (elapsed / 1000);
      const percent = totalSize ? ((downloadedSize / totalSize) * 100).toFixed(1) : '?';
      const eta = totalSize ? formatDuration((totalSize - downloadedSize) / speed * 1000) : '?';
      console.log(`  Progress: ${formatBytes(downloadedSize)} / ${formatBytes(totalSize)} (${percent}%) - ${formatBytes(speed)}/s - ETA: ${eta}`);
      lastProgressTime = now;
    }
  }

  fileStream.end();
  await new Promise(resolve => fileStream.on('finish', resolve));

  const elapsed = Date.now() - startTime;
  console.log(`  Downloaded ${formatBytes(downloadedSize)} in ${formatDuration(elapsed)}`);
}

async function loadFrequencyList() {
  console.log('Loading word frequency list...');

  try {
    const response = await fetch(FREQUENCY_URL);
    if (!response.ok) {
      console.log('  Warning: Could not load frequency list, will include all words with definitions');
      return null;
    }

    const text = await response.text();
    const words = new Set(text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean));
    console.log(`  Loaded ${words.size} common words`);
    return words;
  } catch (error) {
    console.log('  Warning: Could not load frequency list:', error.message);
    return null;
  }
}

function normalizePos(pos) {
  const posMap = {
    'noun': 'noun',
    'verb': 'verb',
    'adj': 'adjective',
    'adv': 'adverb',
    'prep': 'preposition',
    'conj': 'conjunction',
    'pron': 'pronoun',
    'det': 'determiner',
    'intj': 'interjection',
    'num': 'numeral',
    'particle': 'particle',
    'affix': 'affix',
    'suffix': 'suffix',
    'prefix': 'prefix',
    'phrase': 'phrase',
    'proverb': 'proverb',
    'idiom': 'idiom',
    'abbrev': 'abbreviation',
    'symbol': 'symbol',
    'letter': 'letter',
    'name': 'proper noun',
    'proper noun': 'proper noun',
    'contraction': 'contraction',
  };

  return posMap[pos?.toLowerCase()] || pos || 'unknown';
}

function transformEntry(entry) {
  // Extract senses (definitions)
  const definitions = (entry.senses || [])
    .filter(sense => sense.glosses && sense.glosses.length > 0)
    .map(sense => ({
      pos: normalizePos(entry.pos),
      def: sense.glosses[0],
      examples: (sense.examples || [])
        .map(ex => ex.text)
        .filter(Boolean)
        .slice(0, 3), // Limit examples
      synonyms: []
    }));

  if (definitions.length === 0) return null;

  // Extract synonyms from various sources
  const synonyms = new Set();
  if (entry.synonyms) {
    entry.synonyms.forEach(s => {
      if (s.word) synonyms.add(s.word.toLowerCase());
    });
  }
  // Check in senses too
  (entry.senses || []).forEach(sense => {
    if (sense.synonyms) {
      sense.synonyms.forEach(s => {
        if (s.word) synonyms.add(s.word.toLowerCase());
      });
    }
  });

  // Add synonyms to first definition
  if (synonyms.size > 0 && definitions.length > 0) {
    definitions[0].synonyms = Array.from(synonyms).slice(0, 10);
  }

  // Extract pronunciation
  let pronunciation = null;
  if (entry.sounds && entry.sounds.length > 0) {
    for (const sound of entry.sounds) {
      if (sound.ipa) {
        pronunciation = sound.ipa;
        break;
      }
    }
  }

  return {
    definitions,
    pronunciation
  };
}

async function processKaikkiData(frequencyWords) {
  console.log('Processing Kaikki dictionary data...');
  console.log(`  Word limit: ${WORD_LIMIT === Infinity ? 'unlimited' : WORD_LIMIT.toLocaleString()}`);

  const dictionary = {};
  const startTime = Date.now();

  // Create read stream from downloaded file
  const { createReadStream } = await import('fs');
  const fileStream = createReadStream(TEMP_FILE);
  const gunzip = createGunzip();
  const rl = createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    processedLines++;

    // Progress update every 50k lines
    if (processedLines % 50000 === 0) {
      const elapsed = Date.now() - startTime;
      console.log(`  Processed ${processedLines.toLocaleString()} lines, included ${includedWords.toLocaleString()} words (${formatDuration(elapsed)})`);
    }

    try {
      const entry = JSON.parse(line);

      // Skip non-English entries
      if (entry.lang_code !== 'en') continue;

      // Skip if no word
      if (!entry.word) continue;

      const word = entry.word.toLowerCase();

      // Skip if word already exists (keep first/better definition)
      if (dictionary[word]) continue;

      // Skip if using frequency list and word not in it (unless we haven't hit limit)
      if (frequencyWords && !frequencyWords.has(word) && includedWords >= WORD_LIMIT) {
        continue;
      }

      // Transform entry
      const transformed = transformEntry(entry);
      if (!transformed) continue;

      dictionary[word] = transformed;
      includedWords++;

      // Stop if we've hit the limit
      if (includedWords >= WORD_LIMIT) {
        console.log(`  Reached word limit of ${WORD_LIMIT.toLocaleString()}`);
        break;
      }
    } catch (error) {
      // Skip malformed lines
      continue;
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`  Finished processing in ${formatDuration(elapsed)}`);
  console.log(`  Total lines processed: ${processedLines.toLocaleString()}`);
  console.log(`  Words included: ${includedWords.toLocaleString()}`);

  return dictionary;
}

async function writeDictionary(dictionary) {
  console.log('Writing dictionary file...');

  // Ensure output directory exists
  const outputDir = dirname(OUTPUT_PATH);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const json = JSON.stringify(dictionary);
  const { writeFileSync } = await import('fs');
  writeFileSync(OUTPUT_PATH, json);

  const stats = statSync(OUTPUT_PATH);
  console.log(`  Written to: ${OUTPUT_PATH}`);
  console.log(`  File size: ${formatBytes(stats.size)}`);
}

async function cleanup() {
  console.log('Cleaning up temporary files...');

  try {
    if (existsSync(TEMP_FILE)) {
      unlinkSync(TEMP_FILE);
      console.log(`  Deleted: ${TEMP_FILE}`);
    }
  } catch (error) {
    console.log(`  Warning: Could not delete temp file: ${error.message}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Dictionary Build Script');
  console.log('='.repeat(60));
  console.log();

  const totalStartTime = Date.now();

  try {
    // Step 1: Download Kaikki data
    await downloadFile(KAIKKI_URL, TEMP_FILE, 'Kaikki English dictionary');
    console.log();

    // Step 2: Load frequency list (optional)
    const frequencyWords = await loadFrequencyList();
    console.log();

    // Step 3: Process data
    const dictionary = await processKaikkiData(frequencyWords);
    console.log();

    // Step 4: Write output
    await writeDictionary(dictionary);
    console.log();

    // Step 5: Cleanup
    await cleanup();
    console.log();

    const totalElapsed = Date.now() - totalStartTime;
    console.log('='.repeat(60));
    console.log(`Build completed in ${formatDuration(totalElapsed)}`);
    console.log(`Dictionary contains ${Object.keys(dictionary).length.toLocaleString()} words`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
