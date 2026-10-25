'use client';

import { formatReadingTime } from '../lib/stats-helpers';
import { pluralize } from '@/lib/format';
import StatBlock from '@/components/ui/StatBlock';

export function StatsOverviewCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-hairline bg-surface rounded-[12px] divide-y md:divide-y-0 md:divide-x divide-hairline">
      <StatBlock
        label="Time Read"
        value={formatReadingTime(stats.totalSeconds)}
        className="p-5 sm:p-6"
      />
      <StatBlock
        label="Days Running"
        value={stats.currentStreak}
        unit={pluralize(stats.currentStreak, 'day')}
        className="p-5 sm:p-6"
      />
      <StatBlock
        label="Finished"
        value={stats.finishedCount}
        unit={pluralize(stats.finishedCount, 'volume', 'volumes', false)}
        className="p-5 sm:p-6"
      />
      <StatBlock
        label="Highlights"
        value={stats.totalHighlights}
        unit={pluralize(stats.totalHighlights, 'passage', 'passages', false)}
        className="p-5 sm:p-6"
      />
    </div>
  );
}

export default StatsOverviewCards;
