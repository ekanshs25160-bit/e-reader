import { describe, it, expect } from 'vitest';
import { computeStreaks, computeMedian, buildWeeklyDays } from '@/lib/stats/calc';

describe('lib/stats/calc', () => {
  describe('computeMedian', () => {
    it('returns 0 for empty array', () => {
      expect(computeMedian([])).toBe(0);
      expect(computeMedian(null)).toBe(0);
    });

    it('computes median for odd-length arrays', () => {
      expect(computeMedian([10])).toBe(10);
      expect(computeMedian([50, 10, 20])).toBe(20);
      expect(computeMedian([1, 9, 3, 7, 5])).toBe(5);
    });

    it('computes rounded median for even-length arrays', () => {
      expect(computeMedian([10, 20])).toBe(15);
      expect(computeMedian([10, 20, 30, 40])).toBe(25);
      expect(computeMedian([1, 2, 4, 5])).toBe(3);
    });
  });

  describe('computeStreaks', () => {
    it('returns 0 streak when there are no active dates', () => {
      const { currentStreak, longestStreak } = computeStreaks([], new Date('2026-10-25T12:00:00Z'));
      expect(currentStreak).toBe(0);
      expect(longestStreak).toBe(0);
    });

    it('calculates current streak when active today', () => {
      const today = new Date(2026, 9, 25); // Oct 25, 2026
      const activeDates = ['2026-10-24', '2026-10-25'];
      const { currentStreak, longestStreak } = computeStreaks(activeDates, today);
      expect(currentStreak).toBe(2);
      expect(longestStreak).toBe(2);
    });

    it('preserves current streak when active yesterday but not yet today', () => {
      const today = new Date(2026, 9, 25); // Oct 25, 2026
      const activeDates = ['2026-10-23', '2026-10-24'];
      const { currentStreak, longestStreak } = computeStreaks(activeDates, today);
      expect(currentStreak).toBe(2);
      expect(longestStreak).toBe(2);
    });

    it('calculates longest streak across historical gaps', () => {
      const today = new Date(2026, 9, 25);
      const activeDates = [
        '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', // 4 days
        '2026-10-10', // gap
        '2026-10-24', '2026-10-25' // 2 days
      ];
      const { currentStreak, longestStreak } = computeStreaks(activeDates, today);
      expect(currentStreak).toBe(2);
      expect(longestStreak).toBe(4);
    });
  });

  describe('buildWeeklyDays', () => {
    it('builds 7 days of the current week starting on Monday', () => {
      const today = new Date(2026, 9, 25); // Sunday Oct 25, 2026
      const weekly = buildWeeklyDays([], today);
      expect(weekly).toHaveLength(7);
      expect(weekly[0].label).toBe('M');
      expect(weekly[6].label).toBe('S');
      expect(weekly[6].isToday).toBe(true);
    });
  });
});
