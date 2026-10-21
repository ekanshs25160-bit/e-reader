'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Uploader({ open, onClose, onShowToast }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  if (!open) return null;

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
  };

  const handleImportConfirm = () => {
    if (!selectedFile) return;
    if (onShowToast) {
      onShowToast(`Imported "${selectedFile.name}" into your Local Vault`);
    }
    setSelectedFile(null);
    onClose();
    router.push('/reader/piranesi');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/45 backdrop-blur-xs p-0 md:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface text-on-surface rounded-t-3xl md:rounded-3xl border border-outline-variant/40 shadow-2xl overflow-hidden p-5 md:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden w-10 h-1 bg-outline-variant/60 rounded-full mx-auto -mt-1 mb-2"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary leading-tight">
                Add to Local Vault
              </h3>
              <p className="font-caption text-caption text-on-surface-variant">
                100% offline · stored in browser IndexedDB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            dragActive
              ? 'border-secondary bg-secondary-fixed/20'
              : 'border-outline-variant/50 bg-surface-container-lowest/70 hover:bg-surface-container-low'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,.txt,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <span className="material-symbols-outlined text-[32px] text-secondary mb-2">
            auto_stories
          </span>
          {selectedFile ? (
            <div className="space-y-1">
              <p className="font-body-ui-bold text-body-ui-bold text-primary truncate">
                {selectedFile.name}
              </p>
              <p className="font-caption text-caption text-on-surface-variant">
                {(selectedFile.size / 1024).toFixed(0)} KB · Ready to shelve
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-body-ui-bold text-body-ui-bold text-primary">
                Drop an .epub file here, or tap to browse
              </p>
              <p className="font-caption text-caption text-on-surface-variant">
                Supports DRM-free EPUB &amp; plain text editions
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {selectedFile ? (
            <button
              type="button"
              onClick={handleImportConfirm}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-body-ui-bold text-body-ui-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Open in Sanctuary Reader</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-container text-on-primary font-body-ui-bold text-body-ui-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              <span>Choose .epub from Device</span>
            </button>
          )}

          <Link
            href="/browse"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md flex items-center justify-center gap-1.5 border border-outline-variant/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary">
              local_library
            </span>
            <span>Or browse 70,000+ free classics in The Commons</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
