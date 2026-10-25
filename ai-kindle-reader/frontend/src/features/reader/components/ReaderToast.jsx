'use client';

export default function ReaderToast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--reader-bg)',
        borderColor: 'var(--reader-border)',
        color: 'var(--reader-fg)',
      }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border font-label-md text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none"
    >
      {message}
    </div>
  );
}
