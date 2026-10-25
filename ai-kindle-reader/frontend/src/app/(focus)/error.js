'use client';

export default function FocusError({ error, reset }) {
  return (
    <div className="p-6 max-w-lg mx-auto my-12 bg-surface text-on-surface rounded-xl border border-outline">
      <h2 className="text-lg font-bold mb-2">Focus Route Error</h2>
      <pre className="text-xs bg-surface-container p-3 rounded overflow-auto mb-4 text-error">
        {error?.message || String(error)}
      </pre>
      <pre className="text-xs bg-surface-container p-3 rounded overflow-auto mb-4 text-on-surface-variant">
        {error?.stack}
      </pre>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm"
      >
        Try again
      </button>
    </div>
  );
}
