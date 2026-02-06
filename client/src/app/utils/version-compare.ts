/**
 * Compares two version strings using PEP 440 semantics (simplified).
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 *
 * Note: This is a simplified implementation. For production, consider
 * using a library like 'compare-versions' or 'semver' if it supports PEP 440.
 */
export const compareVersions = (a: string, b: string): number => {
  // Normalize pre-release versions
  const normalizeVersion = (v: string) => v.replace(/[a-zA-Z].*$/, "");

  const aNormalized = normalizeVersion(a);
  const bNormalized = normalizeVersion(b);

  const aParts = aNormalized.split(".").map(Number);
  const bParts = bNormalized.split(".").map(Number);

  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;

    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  // If versions are equal, prefer stable over pre-release
  if (aNormalized === bNormalized) {
    const aIsPrerelease = a !== aNormalized;
    const bIsPrerelease = b !== bNormalized;

    if (!aIsPrerelease && bIsPrerelease) return 1;
    if (aIsPrerelease && !bIsPrerelease) return -1;
  }

  return 0;
};

/**
 * Deduplicates array of Pulp content by package name, keeping latest version.
 */
export const deduplicateByLatestVersion = <
  T extends { name: string; version: string },
>(
  items: T[],
): T[] => {
  const byName = new Map<string, T>();

  for (const item of items) {
    const existing = byName.get(item.name);
    if (!existing || compareVersions(item.version, existing.version) > 0) {
      byName.set(item.name, item);
    }
  }

  return Array.from(byName.values());
};
