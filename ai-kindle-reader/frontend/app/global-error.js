'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body className="p-6 bg-surface text-on-surface">
        <h2 className="text-lg font-bold mb-2">Global Error</h2>
        <pre className="text-xs bg-surface-container p-3 rounded overflow-auto mb-4 text-error">
          {error?.message || String(error)}
        </pre>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
