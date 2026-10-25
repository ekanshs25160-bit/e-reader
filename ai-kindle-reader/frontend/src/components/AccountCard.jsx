'use client';

import React from 'react';

/**
 * AccountCard
 * Slot component for authentication and account management.
 * Preserved as an isolated slot per editorial spec.
 */
export default function AccountCard({ className = '' }) {
  return (
    <div className={`bg-surface border border-hairline rounded-[12px] p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium font-sans block mb-1">
            Account &amp; Sync
          </span>
          <p className="font-sans text-[14px] text-ink">
            Stored on this device. Synced only if you sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
