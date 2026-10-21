'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReadingStats } from '@/utils/db';

export default function Page() {
  const [stats, setStats] = useState({
    totalHours: 87,
    totalMinutes: 58,
    currentStreak: 6,
    finishedVolumes: 4,
    totalHighlights: 51,
    lastReadBook: { id: 'piranesi', title: 'Piranesi' },
    weeklyDays: [
      { label: 'M', dayNum: 0, minutes: 24, active: true },
      { label: 'T', dayNum: 1, minutes: 18, active: true },
      { label: 'W', dayNum: 2, minutes: 20, active: true },
      { label: 'T', dayNum: 3, minutes: 0, active: false },
      { label: 'F', dayNum: 4, minutes: 0, active: false },
      { label: 'S', dayNum: 5, minutes: 0, active: false },
      { label: 'S', dayNum: 6, minutes: 0, active: false },
    ],
  });

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const liveStats = await getReadingStats();
        if (liveStats && active) {
          setStats(liveStats);
        }
      } catch (err) {
        console.warn('Error loading telemetry stats:', err);
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const totalWeeklyMinutes = (stats.weeklyDays || []).reduce(
    (acc, cur) => acc + (cur.minutes || 0),
    0
  );

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      <main className="w-full bg-background flex-col relative pb-28 md:pb-10">
        <header className="md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 shadow-sm dark:shadow-none flex justify-between items-center w-full px-gutter py-space-sm border-b border-outline-variant/30">
          <Link href="/settings" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-outline-variant/40 bg-surface-container-high flex items-center justify-center">
              <img
                className="w-full h-full object-cover"
                alt="Reader Portrait"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa2b_KB0Su7rUQgMiJyBfvSK82YsnkwTxuyKmNZkBGDJLzpcrZ3GZhnuvjZXBPoI9CQly_7XbiNQqsODYWNmECDYE5zOV0443CZI9yawG6fLDxAiGrjct8SNzCxp-er031SZl--_tbtPqzVXiKNeM_ORZ2hj2I2VRLog2nK7ztHGtAaE2VJnAruY0XdTDOxmiHQa5sCuqZO2Ew1sYYvOPr_KCr6UchtqD2Y4qIMyX8QYJx4-nTDxs8"
              />
            </div>
            <span className="font-headline-md text-headline-md text-primary dark:text-inverse-primary font-medium tracking-tight">
              Flyleaf
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/library"
              aria-label="Search"
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </Link>
          </div>
        </header>

        <div className="px-gutter md:px-8 pt-5 flex flex-col space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
          <section className="lg:col-span-2 flex flex-col space-y-3.5">
            <div className="flex flex-col space-y-1">
              <h1 className="font-headline-lg text-headline-lg text-primary font-normal tracking-tight">
                Your reading
              </h1>
              <p className="font-caption text-caption text-on-surface-variant italic leading-relaxed">
                Measured on this device, kept on this device. Nothing here has ever left it.
              </p>
            </div>
            <Link
              className="group flex items-center justify-between px-3.5 py-2.5 bg-surface-container-lowest/80 backdrop-blur-sm border border-black/[0.08] dark:border-white/10 hover:border-black/[0.16] rounded-full shadow-[0_1px_3px_rgba(44,64,88,0.03)] active:scale-[0.98] transition-all duration-150"
              href={`/reader/${stats.lastReadBook?.id || 'piranesi'}`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="material-symbols-outlined text-primary text-[18px] group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-label-md text-label-md text-primary tracking-wide">
                    BACK TO
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface italic truncate">
                    {stats.lastReadBook?.title || 'Piranesi'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pl-2 text-on-surface-variant">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  menu_book
                </span>
              </div>
            </Link>
          </section>

          {/* Metric Telemetry Cards */}
          <section className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                TIME READ
              </span>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  {stats.totalHours}
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-0.5">
                    h
                  </span>{' '}
                  {stats.totalMinutes}
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-0.5">
                    m
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                  DAYS RUNNING
                </span>
                <span
                  className="material-symbols-outlined text-secondary text-[17px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  {stats.currentStreak}
                </span>
                <span className="font-caption text-caption text-on-surface-variant ml-1.5 italic">
                  days streak
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                FINISHED
              </span>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  {stats.finishedVolumes}
                </span>
                <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                  volumes
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                HIGHLIGHTS
              </span>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  {stats.totalHighlights}
                </span>
                <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                  passages
                </span>
              </div>
            </div>
          </section>

          {/* This Week Reading Breakdown Chart */}
          <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                This week
              </h2>
              <span className="font-caption text-caption text-on-surface-variant">
                {Math.floor(totalWeeklyMinutes / 60)}h {totalWeeklyMinutes % 60}m since Monday
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2 pt-1">
              {(stats.weeklyDays || []).map((day, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-1.5">
                  <span
                    className={`font-label-sm text-label-sm ${
                      day.isToday ? 'text-secondary font-bold' : 'text-on-surface'
                    }`}
                  >
                    {day.label}
                  </span>
                  {day.minutes > 0 ? (
                    <div
                      className={`w-full aspect-[2/3] rounded-md overflow-hidden ring-1 shadow-sm relative group bg-surface-container ${
                        day.isToday ? 'ring-secondary' : 'ring-black/15'
                      }`}
                    >
                      <img
                        className="w-full h-full object-cover"
                        alt="Reading day"
                        src={
                          idx % 2 === 0
                            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNl9RHp_P_wjhuLyd6ECPoVjHQx_OMoQyDBH05jSextB8aNugHisbeI4hr5nhDPgMx5-nXAnoTJ8TzmvgXfFLfU4g664k5CJGGw51qkNHXa87YUKa6Jf2BlhgLC2rkdkDzz9omU4uuqlE2QztEV-Lwh54nmQH2bvLuitXatQKoTVtj5sGXkd1YRGpCsN3qqgK6X70PXkEqjLqnKpTzjD0ALAdDInCCHICTsx5A6cmgtebfVNnM3OLl'
                            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMOHNtWKtnnsEdd-P4C1LRZ-9uRhrca-tKUF7VIZo5V261ioaeiM8MsW0hwaQUFuJxbj8ieE-uhcG85v-QDuGaOuL5Vrhu4tYD_szeoesGGW_rCzo9skPry9BGXZB61f-JSXRBfxh7myLWFnfE13Nnlyg9BPhPg2KIeuIjnMagXYdUkdTLAp2iaruEjv_yWO7OiuNQ4UGZoTNYh-rZ2GdFWzG6Wc1T1fGrk9ftKQ5SyABaX-YcOZp4'
                        }
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[2/3] rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low/50 flex items-center justify-center opacity-60">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/50"></span>
                    </div>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-label-sm ${
                      day.minutes > 0
                        ? day.isToday
                          ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
                          : 'bg-[#EEECE6] dark:bg-surface-container text-on-surface font-semibold'
                        : 'text-on-surface-variant opacity-60'
                    }`}
                  >
                    {day.minutes > 0 ? `${day.minutes}m` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Historical 6 Months Calendar */}
          <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3">
            <div className="flex flex-col space-y-0.5">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                The last six months
              </h2>
              <span className="font-caption text-caption text-on-surface-variant">
                144 days with a book · longest run 52 days
              </span>
            </div>
            <div className="overflow-x-auto pt-2 pb-1">
              <div className="min-w-[310px] flex flex-col space-y-1.5">
                <div className="flex text-[10px] font-caption text-on-surface-variant pl-4 justify-between pr-1">
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                </div>
                <div className="flex gap-1.5 items-start">
                  <div className="flex flex-col gap-1 text-[9px] font-caption text-on-surface-variant pr-1">
                    <span>M</span>
                    <span>W</span>
                    <span>F</span>
                  </div>
                  <div className="grid grid-flow-col grid-rows-7 gap-1 flex-1">
                    {Array.from({ length: 154 }).map((_, i) => {
                      const active = (i * 7 + 3) % 5 !== 0;
                      return (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${
                            active
                              ? i % 4 === 0
                                ? 'bg-secondary'
                                : 'bg-secondary/40'
                              : 'bg-surface-container-high'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
