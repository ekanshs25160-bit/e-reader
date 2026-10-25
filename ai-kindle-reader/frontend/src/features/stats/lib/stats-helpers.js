export function formatReadingTime(totalSeconds) {
  const sec = Number(totalSeconds) || 0;
  if (sec <= 0) return '0m';
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }
  return `${Math.max(1, minutes)}m`;
}

export const HEATMAP_SCALE = [
  'bg-hairline/50', // 0: inactive
  'bg-accent/20',   // 1: low
  'bg-accent/45',   // 2: medium
  'bg-accent/75',   // 3: high
  'bg-accent',      // 4: peak
];
