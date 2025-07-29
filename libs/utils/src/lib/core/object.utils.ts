/**
 * Searches for a key in nested objects and returns the dot-notation path to it
 * @param obj - object to search in
 * @param targetKey - key to search for
 * @param currentPath - current path (used for recursion)
 * @returns dot-notation path to the key or null if not found
 */
export function findKeyPath(
  obj: Record<string, any> | null,
  targetKey: string,
  currentPath: string = ''
): string | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (key === targetKey) {
      return newPath;
    }

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const result = findKeyPath(obj[key], targetKey, newPath);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Searches for all occurrences of a key in nested objects
 * @param obj - object to search in
 * @param targetKey - key to search for
 * @param currentPath - current path (used for recursion)
 * @returns array of all dot-notation paths to the key
 */
export function findAllKeyPaths(
  obj: Record<string, any> | null,
  targetKey: string,
  currentPath: string = ''
): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  const paths: string[] = [];

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (key === targetKey) {
      paths.push(newPath);
    }

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const nestedPaths = findAllKeyPaths(obj[key], targetKey, newPath);
      paths.push(...nestedPaths);
    }
  }

  return paths;
}
