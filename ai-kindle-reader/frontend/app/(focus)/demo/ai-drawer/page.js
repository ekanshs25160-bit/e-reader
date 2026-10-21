'use client';

import { useRouter } from 'next/navigation';
import AiDrawer from '@/components/AiDrawer';
import { useTheme } from '@/components/common/ThemeProvider';

export default function Page() {
  const router = useRouter();
  const { showToast } = useTheme();

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased font-body-ui selection:bg-secondary-fixed selection:text-on-secondary-fixed overflow-hidden select-none">
      <div className="relative w-full h-dvh bg-background flex flex-col justify-between overflow-hidden">
        <main className="relative flex-1 w-full h-full flex flex-col">
          <header className="w-full px-5 pt-3 pb-2 flex items-center justify-between text-on-surface-variant z-10">
            <button
              type="button"
              onClick={() => router.push('/reader/crime-and-punishment')}
              aria-label="Back to Library"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="font-label-sm text-label-sm tracking-widest uppercase text-outline">
                Fyodor Dostoevsky
              </span>
              <h1 className="font-headline-sm text-[15px] font-medium text-primary">
                Crime and Punishment
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => showToast('Page bookmarked')}
                aria-label="Bookmark"
                className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors active:scale-95"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bookmark
                </span>
              </button>
            </div>
          </header>
          <article className="px-6 md:px-16 lg:px-24 md:max-w-3xl md:mr-[440px] pt-3 pb-24 text-on-surface font-body-reading text-body-reading leading-[30px] overflow-hidden opacity-90 transition-opacity">
            <div className="text-center mb-6">
              <span className="font-label-sm text-label-sm tracking-[0.2em] text-outline font-semibold uppercase">
                Part I · Chapter I
              </span>
            </div>
            <p className="mb-4 text-justify indent-6">
              On an exceptionally hot evening early in July a young man came out of the garret in
              which he lodged in S. Place and walked slowly, as though in hesitation, towards K.
              bridge.
            </p>
            <p className="mb-4 text-justify">
              He had successfully avoided meeting his landlady on the stairs. His garret was under
              the roof of a high, five-storied house and was more like a cupboard than a room. The
              little German lady who provided him with this cubicle lived on the floor below, and
              every time he went out he was obliged to pass her kitchen, the door of which
              invariably stood wide open.
            </p>
            <p className="mb-4 text-justify">
              <span className="relative inline bg-secondary-fixed/50 text-on-surface px-1 py-0.5 rounded shadow-sm border-b-2 border-secondary/50">
                <span className="absolute -left-1.5 -top-1 w-1.5 h-4 bg-secondary rounded-l-sm"></span>
                He had become so completely absorbed in himself, and isolated from his fellows,
                that he dreaded meeting, not only his landlady, but anyone at all.
                <span className="absolute -right-1.5 -bottom-0.5 w-1.5 h-4 bg-secondary rounded-r-sm"></span>
              </span>{' '}
              He was crushed by poverty; but the anxieties of his position had of late ceased to
              weigh upon him.
            </p>
            <p className="text-justify indent-6">
              He had given up attending to matters of practical importance; he had lost all desire
              to do so. Nothing that any landlady could do held any terror for him.
            </p>
          </article>
        </main>

        <AiDrawer
          open={true}
          onClose={() => router.push('/reader/crime-and-punishment')}
          onShowToast={showToast}
        />
      </div>
    </div>
  );
}
