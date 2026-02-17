/**
 * Formats a timestamp (in nanoseconds) to a human-readable date string
 */
export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return date.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Formats weight from storage format (weight * 100) to display format with 2 decimal places
 */
export function formatWeight(weight: bigint): string {
  return (Number(weight) / 100).toFixed(2);
}
