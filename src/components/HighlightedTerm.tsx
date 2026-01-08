interface HighlightedTermProps {
  term: string;
  query: string;
}

export function HighlightedTerm({ term, query }: HighlightedTermProps) {
  if (!query.trim()) {
    return <span className="capitalize">{term}</span>;
  }

  const lowerTerm = term.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const matchIndex = lowerTerm.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return <span className="capitalize">{term}</span>;
  }

  const beforeMatch = term.slice(0, matchIndex);
  const match = term.slice(matchIndex, matchIndex + query.length);
  const afterMatch = term.slice(matchIndex + query.length);

  return (
    <span className="capitalize">
      {beforeMatch}
      <strong className="font-bold">{match}</strong>
      {afterMatch}
    </span>
  );
}
