import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { WordDefinition } from '../lib/dictionary';
import { useVocabulary } from '../hooks/useVocabulary';

interface WordCardProps {
  word: WordDefinition;
  showSaveButton?: boolean;
}

export function WordCard({ word, showSaveButton = true }: WordCardProps) {
  const { saveWord, isWordSaved } = useVocabulary();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    isWordSaved(word.term).then(setIsSaved);
  }, [word.term, isWordSaved]);

  const handleSave = async () => {
    if (isSaved || saving) return;
    setSaving(true);
    await saveWord(word);
    setIsSaved(true);
    setSaving(false);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const playAudio = () => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play().catch(console.error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white capitalize">{word.term}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-primary-400 italic">{word.partOfSpeech}</span>
            {word.pronunciation && (
              <button
                onClick={playAudio}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>{word.pronunciation}</span>
                {word.audioUrl && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {showSaveButton && (
          <button
            onClick={handleSave}
            disabled={isSaved || saving}
            className={`p-2 rounded-lg transition-colors ${
              isSaved
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 active:bg-slate-800'
            }`}
          >
            {isSaved ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm12 10l-5 5-3-3 1.41-1.41L12 15.17l3.59-3.58L17 13z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>

      <p className="mt-4 text-slate-200 text-lg leading-relaxed">
        {word.definition}
      </p>

      {word.examples.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Examples
          </h3>
          <ul className="space-y-2">
            {word.examples.map((example, i) => (
              <li key={i} className="text-slate-300 italic pl-4 border-l-2 border-slate-600">
                "{example}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {word.synonyms.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Synonyms
          </h3>
          <div className="flex flex-wrap gap-2">
            {word.synonyms.map((synonym, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300"
              >
                {synonym}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
