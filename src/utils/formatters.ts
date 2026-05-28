export const normalizeContributorName = (name: string | null | undefined): string => {
  if (!name) return 'Anonymous';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower === 'anonymous' || lower === 'system' || lower === 'admin' || lower === '') {
    return 'Anonymous';
  }

  // Convert to Title Case for proper grouped display (e.g., 'anuj tripathi' -> 'Anuj Tripathi')
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
