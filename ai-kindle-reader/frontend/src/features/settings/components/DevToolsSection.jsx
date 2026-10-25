import { seedSampleReadingData, clearSeededReadingData } from '@/lib/storage';

export function DevToolsSection({ refreshStorageMetrics, showToast }) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <section className="space-y-2">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block px-1">
        DEVELOPER TOOLS
      </span>
      <div className="border border-hairline bg-surface rounded-[12px] divide-y divide-hairline">
        <div
          onClick={async () => {
            const count = await seedSampleReadingData();
            await refreshStorageMetrics();
            showToast(`Seeded ${count} days of sample telemetry data`);
          }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
        >
          <div>
            <p className="font-sans text-[14.5px] text-ink">Seed sample reading telemetry</p>
            <p className="text-[11.5px] text-muted font-sans">
              90 days of reading sessions and heatmap
            </p>
          </div>
          <span
            className="material-symbols-outlined text-muted text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            add_chart
          </span>
        </div>

        <div
          onClick={async () => {
            await clearSeededReadingData();
            await refreshStorageMetrics();
            showToast('Cleared sample reading telemetry');
          }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
        >
          <div>
            <p className="font-sans text-[14.5px] text-ink">Clear sample telemetry</p>
            <p className="text-[11.5px] text-muted font-sans">Reset reading stats store</p>
          </div>
          <span
            className="material-symbols-outlined text-muted text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            restart_alt
          </span>
        </div>
      </div>
    </section>
  );
}
