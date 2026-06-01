const normalize = (s) => String(s || "").toLowerCase().trim();

/** Simple Levenshtein distance for typo-tolerant ranking */
export const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

/**
 * Rank strings against query: prefix/substring match first, then fuzzy.
 */
export const rankSuggestions = (query, items, { limit = 8, getLabel = (x) => x } = {}) => {
  const q = normalize(query);
  if (!q) return [];

  const scored = items
    .map((item) => {
      const label = normalize(getLabel(item));
      if (!label) return null;
      let score = 999;
      if (label === q) score = 0;
      else if (label.startsWith(q)) score = 1;
      else if (label.includes(q)) score = 2;
      else {
        const dist = levenshtein(q, label.slice(0, Math.max(label.length, q.length + 2)));
        if (dist <= Math.max(2, Math.floor(q.length / 3))) score = 10 + dist;
        else return null;
      }
      return { item, score, label: getLabel(item) };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label));

  const seen = new Set();
  const out = [];
  for (const row of scored) {
    const key = row.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.item);
    if (out.length >= limit) break;
  }
  return out;
};
