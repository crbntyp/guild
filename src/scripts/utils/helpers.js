// Helper utility functions

/**
 * Convert a slug to a friendly display name
 * Examples:
 *   "tarren-mill" -> "Tarren Mill"
 *   "geez-yer-shoes-n-jaykit" -> "Geez Yer Shoes N Jaykit"
 *   "blood-elf" -> "Blood Elf"
 */
export function slugToFriendly(slug) {
  if (!slug) return '';

  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a friendly name to a slug
 * Examples:
 *   "Tarren Mill" -> "tarren-mill"
 *   "Blood Elf" -> "blood-elf"
 */
export function friendlyToSlug(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Format a number with commas
 * Examples:
 *   1234567 -> "1,234,567"
 */
export function formatNumber(num) {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get time ago from timestamp
 * Examples:
 *   "2 hours ago"
 *   "3 days ago"
 */
export function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}
