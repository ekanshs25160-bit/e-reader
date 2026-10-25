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

export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'Still awake, ';
  if (hour >= 5 && hour < 12) return 'Good morning, ';
  if (hour >= 12 && hour < 17) return 'Good afternoon, ';
  return 'Good evening, ';
}
