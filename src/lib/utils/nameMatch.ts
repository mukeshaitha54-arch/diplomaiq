export function normalizeForComparison(name: string): string {
  // 1. Lowercase
  // 2. Replace non-alphanumeric (keep spaces) with space
  // 3. Trim and collapse multiple spaces to single space
  const cleaned = name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  // 4. Split into words and sort them alphabetically
  const words = cleaned.split(' ').sort();
  
  // Join back for easy comparison
  return words.join(' ');
}

export function namesMatch(entered: string, sbtet: string): boolean {
  if (!entered || !sbtet) return false;
  return normalizeForComparison(entered) === normalizeForComparison(sbtet);
}
