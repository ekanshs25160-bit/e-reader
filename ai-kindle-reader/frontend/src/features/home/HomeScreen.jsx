'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHomeDashboard } from './hooks/useHomeDashboard';
import { CurrentReadHero } from './components/CurrentReadHero';
import { RecentBooksShelf } from './components/RecentBooksShelf';
import { getTimeGreeting } from './lib/home-helpers';
import { PageHeader, Button, EmptyState, Skeleton } from '@/components/ui';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/components/common/ThemeProvider';

export function HomeScreen() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { userName, openImportModal } = useTheme();
  const {
    books,
    loading,
    error,
    currentHero,
    carouselBooks,
    heroIndex,
    setHeroIndex,
    heroProgress,
    heroPageLabel,
    otherBooks,
    totalSeconds,
    currentStreak,
    totalPagesRead,
    fellOutItem,
    reload,
  } = useHomeDashboard();

  if (!isMounted) {
    return <div className="w-full min-h-dvh bg-background" />;
  }

  const greeting = getTimeGreeting();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="SANCTUARY VAULT"
        title={`${greeting}${userName || 'Reader'}`}
        description={`${pluralize(books.length, 'volume')} preserved on this device.`}
        action={
          <Button variant="secondary" onClick={openImportModal} icon="add">
            Import EPUB
          </Button>
        }
      />

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton variant="card" height="300px" />
            <Skeleton variant="card" height="110px" />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Skeleton variant="card" height="240px" />
            <Skeleton variant="card" height="170px" />
          </div>
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon="error"
          title="Unable to open vault"
          description={error}
          action={
            <Button variant="primary" onClick={reload}>
              Retry
            </Button>
          }
        />
      )}

      {!loading && !error && books.length === 0 && (
        <EmptyState
          icon="auto_stories"
          title="Your desk is clear"
          description="Import an EPUB or explore curated public domain classics stored directly on this device."
          action={
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
              <Button
                variant="primary"
                onClick={() => router.push('/browse')}
                icon="explore"
                className="w-full sm:w-auto"
              >
                Browse The Commons
              </Button>
              <Button
                variant="secondary"
                onClick={openImportModal}
                icon="upload_file"
                className="w-full sm:w-auto"
              >
                Import EPUB
              </Button>
            </div>
          }
        />
      )}

      {!loading && !error && books.length > 0 && currentHero && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <CurrentReadHero
              currentHero={currentHero}
              carouselBooks={carouselBooks}
              heroIndex={heroIndex}
              setHeroIndex={setHeroIndex}
              heroProgress={heroProgress}
              heroPageLabel={heroPageLabel}
              totalSeconds={totalSeconds}
              totalPagesRead={totalPagesRead}
              currentStreak={currentStreak}
            />
          </div>
          <div className="lg:col-span-5">
            <RecentBooksShelf otherBooks={otherBooks} fellOutItem={fellOutItem} />
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
