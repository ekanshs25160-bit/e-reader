'use client';

import { useState } from 'react';

const INSIGHTS = {
  subtext: {
    heading: 'Psychological Subtext & Social Alienation',
    marginalia: 'Marginalia #04',
    bullets: [
      {
        title: 'Monomania & Solitude:',
        body: 'The narrator’s hyper-fixation on interior thought induces a physical retreat from everyday social encounters—exemplifying classic literary interiority.',
      },
      {
        title: 'Social Stratification & Space:',
        body: 'Threshold spaces—staircases, drawing-room doors, and flooded vestibules—externalize the tension between private conscience and public scrutiny.',
      },
      {
        title: 'The Threshold as Liminal Border:',
        body: 'Each crossing between private chamber and outer street represents moving from theoretical detachment into unavoidable moral reality',
        streaming: true,
      },
    ],
    grounding: 'Grounding: 2 historical annotations (Bakhtin, 1929; Frank, 2010)',
  },
  summary: {
    heading: 'Spoiler-Free Chapter Synthesis',
    marginalia: 'Marginalia #05',
    bullets: [
      {
        title: 'Opening Movement:',
        body: 'Introduces the protagonist’s immediate surroundings, financial or social pressures, and the central tension of the opening scene without revealing later plot turns.',
      },
      {
        title: 'Character Dynamics:',
        body: 'Establishes the contrast between outward social obligation and the protagonist’s guarded inner life.',
      },
      {
        title: 'Narrative Tone:',
        body: 'Balances close psychological observation with atmospheric detail that anchors the chapter’s setting',
        streaming: true,
      },
    ],
    grounding: 'Spoiler Guard Active · Restricted to Chapter I text only',
  },
  author: {
    heading: 'Authorial Context & Historical Era',
    marginalia: 'Marginalia #06',
    bullets: [
      {
        title: 'Biographical Moment:',
        body: 'Written during a period of intense literary experimentation, reflecting the author’s engagement with moral philosophy and social reform.',
      },
      {
        title: 'Publication History:',
        body: 'Originally serialized to immediate critical debate, shaping the modern psychological novel.',
      },
      {
        title: 'Literary Lineage:',
        body: 'Bridges Romantic sensibility with sharp realist observation of class, domesticity, and conscience',
        streaming: true,
      },
    ],
    grounding: 'Grounding: Historical Archive & Critical Edition Notes',
  },
};

export default function AiDrawer({
  open = true,
  onClose,
  quote = '“He had become so completely absorbed in himself, and isolated from his fellows, that he dreaded meeting, not only his landlady, but anyone at all.”',
  initialTab = 'subtext',
  onShowToast,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [spoilersOff, setSpoilersOff] = useState(true);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUps, setFollowUps] = useState([]);
  const [keptAsNote, setKeptAsNote] = useState(false);

  if (!open) return null;

  const currentInsight = INSIGHTS[activeTab] || INSIGHTS.subtext;

  const handleSendFollowUp = (e) => {
    e?.preventDefault();
    const q = followUpInput.trim();
    if (!q) return;
    setFollowUps((prev) => [
      ...prev,
      {
        question: q,
        answer: `In the context of this passage, "${q}" highlights how the narrator frames unspoken social rules against private conviction—keeping the reader strictly within the perspective of Chapter I.`,
      },
    ]);
    setFollowUpInput('');
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-primary/20 backdrop-blur-[2.5px] z-40 pointer-events-auto transition-opacity duration-300"
      />
      <section className="fixed bottom-0 left-0 right-0 z-50 h-[68%] md:left-auto md:top-0 md:h-full md:w-[440px] md:rounded-t-none md:rounded-l-3xl md:border-t-0 md:border-l bg-surface text-on-surface flex flex-col rounded-t-[24px] border-t border-outline-variant/40 shadow-[0_-8px_32px_rgba(21,42,65,0.16)] transition-transform duration-300 ease-out overflow-hidden">
        <div className="w-full flex justify-center pt-2.5 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant/60"></div>
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30 shadow-xs">
              <span
                className="material-symbols-outlined text-[18px]"
                data-icon="auto_stories"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight leading-tight">
                Literary Companion
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpoilersOff((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/40 text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-colors"
            >
              <span
                className="material-symbols-outlined text-[14px] text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield
              </span>
              <span>{spoilersOff ? 'Spoilers: Off (Ch. 1)' : 'Spoilers: All Chapters'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5 hide-scrollbar">
          <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 border-l-[3.5px] border-l-secondary relative shadow-[0_2px_8px_rgba(44,64,88,0.03)]">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                format_quote
              </span>
              <p className="font-body-reading text-[14px] leading-[22px] italic text-on-surface-variant">
                {quote}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('subtext')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md active:scale-95 transition-all ${
                activeTab === 'subtext'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[15px] ${
                  activeTab === 'subtext' ? 'text-secondary-fixed' : ''
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span>Explain Subtext</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md active:scale-95 transition-all ${
                activeTab === 'summary'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">menu_book</span>
              <span>Chapter Summary</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('author')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md active:scale-95 transition-all ${
                activeTab === 'author'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">travel_explore</span>
              <span>Author &amp; Era</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setKeptAsNote(true);
                if (onShowToast) onShowToast('Passage & marginalia saved to your Journal');
              }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
              <span>{keptAsNote ? 'Saved to Journal ✓' : 'Save to Journal'}</span>
            </button>
          </div>

          <div className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <h3 className="font-headline-sm text-[18px] text-primary tracking-tight font-medium flex items-center gap-1.5">
                <span>{currentInsight.heading}</span>
              </h3>
              <span className="font-caption text-caption text-outline">
                {currentInsight.marginalia}
              </span>
            </div>
            <div className="space-y-2.5 font-body-ui text-[13.5px] leading-[20px] text-on-surface">
              {currentInsight.bullets.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span>
                  <p>
                    <strong className="font-body-ui-bold text-primary">{b.title} </strong>
                    {b.body}
                    {b.streaming && (
                      <span className="inline-block w-[2px] h-3.5 bg-secondary ml-1 cursor-pulse align-middle"></span>
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-on-surface-variant font-caption text-caption border-t border-outline-variant/20">
              <span className="material-symbols-outlined text-[15px] text-secondary">policy</span>
              <span>{currentInsight.grounding}</span>
            </div>
          </div>

          {followUps.map((item, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest/90 rounded-xl p-3.5 border border-outline-variant/35 space-y-2 animate-in fade-in duration-200"
            >
              <p className="font-label-md text-label-md text-secondary">Q: {item.question}</p>
              <p className="font-body-ui text-[13.5px] leading-[20px] text-on-surface">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        <footer className="p-4 bg-surface/95 border-t border-outline-variant/20 flex flex-col gap-2.5">
          <form
            onSubmit={handleSendFollowUp}
            className="flex items-center bg-surface-container rounded-full px-3.5 py-1.5 border border-outline-variant/40 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-outline mr-2">search</span>
            <input
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-on-surface font-body-ui text-[13px] placeholder:text-outline focus:ring-0 focus:outline-none"
              placeholder="Ask a follow-up about this passage..."
              type="text"
            />
            <button
              type="submit"
              aria-label="Send follow up"
              className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform ml-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
            </button>
          </form>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setKeptAsNote((v) => !v);
                if (onShowToast) onShowToast('Note pinned to current page margin');
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-xs hover:bg-primary transition-colors active:scale-98"
            >
              <span
                className="material-symbols-outlined text-[16px] text-secondary-fixed"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                push_pin
              </span>
              <span>{keptAsNote ? 'Pinned to Page Margin ✓' : 'Keep as Note on this Page'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator?.clipboard) {
                  navigator.clipboard.writeText(quote);
                }
                if (onShowToast) onShowToast('Insight copied to clipboard');
              }}
              aria-label="Share insight"
              className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/40 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">ios_share</span>
            </button>
          </div>
          <div className="text-center">
            <span className="font-caption text-[10px] text-outline">
              Saves to CFI timeline &amp; margin vault
            </span>
          </div>
        </footer>
      </section>
    </>
  );
}
