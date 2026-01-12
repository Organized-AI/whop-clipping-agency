/**
 * Utilities for sanitizing user input to prevent security issues
 */

/**
 * Sanitize a filename to prevent path traversal and special character issues
 * - Removes path separators (/, \)
 * - Removes null bytes
 * - Replaces special characters with underscores
 * - Limits length to prevent filesystem issues
 */
export function sanitizeFilename(filename: string, maxLength: number = 100): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[\/\\]/g, '_')   // Path separators
    .replace(/\0/g, '')        // Null bytes
    .replace(/\.\./g, '_');    // Path traversal

  // Replace other problematic characters
  sanitized = sanitized
    .replace(/[<>:"|?*]/g, '_')  // Windows invalid chars
    .replace(/[\x00-\x1f]/g, '') // Control characters
    .replace(/\s+/g, '_')        // Whitespace to underscore
    .replace(/_+/g, '_')         // Collapse multiple underscores
    .replace(/^_+|_+$/g, '');    // Trim leading/trailing underscores

  // Limit length (preserve extension if present)
  if (sanitized.length > maxLength) {
    const extMatch = sanitized.match(/\.[a-zA-Z0-9]{1,10}$/);
    const ext = extMatch ? extMatch[0] : '';
    const maxBase = maxLength - ext.length;
    sanitized = sanitized.slice(0, maxBase) + ext;
  }

  // Ensure we have something
  if (!sanitized) {
    return 'unnamed';
  }

  return sanitized;
}

/**
 * Sanitize a slug (for URLs, IDs, etc.)
 * - Only allows alphanumeric, hyphen, underscore
 * - Converts to lowercase
 */
export function sanitizeSlug(input: string, maxLength: number = 50): string {
  if (!input || typeof input !== 'string') {
    return 'unnamed';
  }

  const sanitized = input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);

  return sanitized || 'unnamed';
}

/**
 * Sanitize a clip/video name for display and file naming
 */
export function sanitizeClipName(name: string, maxLength: number = 80): string {
  if (!name || typeof name !== 'string') {
    return 'clip';
  }

  // Allow more characters for display names, but still be safe
  const sanitized = name
    .replace(/[\/\\<>:"|?*\x00-\x1f]/g, '')  // Remove dangerous chars
    .replace(/\s+/g, ' ')                      // Normalize whitespace
    .trim()
    .slice(0, maxLength);

  return sanitized || 'clip';
}

/**
 * Validate and sanitize a video ID
 * YouTube IDs are 11 characters: alphanumeric, underscore, hyphen
 */
export function sanitizeVideoId(videoId: string): string {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID');
  }

  const sanitized = videoId.replace(/[^a-zA-Z0-9_-]/g, '');

  if (sanitized.length !== 11) {
    throw new Error('Invalid video ID length');
  }

  return sanitized;
}
