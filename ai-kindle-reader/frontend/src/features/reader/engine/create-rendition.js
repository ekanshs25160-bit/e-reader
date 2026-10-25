export function injectWebFonts(doc) {
  if (!doc || !doc.head) return;
  if (!doc.getElementById('flyleaf-fonts')) {
    const link = doc.createElement('link');
    link.id = 'flyleaf-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Lora:ital,wght@0,400..700;1,400..700&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap';
    doc.head.appendChild(link);
  }
  if (!doc.getElementById('flyleaf-opendyslexic')) {
    const odStyle = doc.createElement('style');
    odStyle.id = 'flyleaf-opendyslexic';
    odStyle.textContent =
      "@font-face { font-family: 'OpenDyslexic'; src: local('OpenDyslexic'), local('OpenDyslexic-Regular'); font-weight: 400; font-style: normal; font-display: swap; } @font-face { font-family: 'OpenDyslexic'; src: local('OpenDyslexic-Bold'), local('OpenDyslexic'); font-weight: 700; font-style: normal; font-display: swap; }";
    doc.head.appendChild(odStyle);
  }
}

export function enforceNeighborContainment(doc, viewerEl) {
  if (doc) {
    if (doc.documentElement) {
      doc.documentElement.style.overflow = 'hidden';
      doc.documentElement.style.scrollbarWidth = 'none';
      doc.documentElement.style.margin = '0';
      doc.documentElement.style.padding = '0';
    }
    if (doc.body) {
      doc.body.style.overflow = 'hidden';
      doc.body.style.scrollbarWidth = 'none';
      doc.body.style.margin = '0';
      doc.body.style.padding = '0';
    }
  }
  const epubContainer = viewerEl?.querySelector('.epub-container');
  if (epubContainer) {
    epubContainer.style.overflow = 'hidden';
    epubContainer.style.scrollbarWidth = 'none';
  }
}

export function registerRenderHooks(rendition, getIsCancelled) {
  rendition.hooks.render.register((view) => {
    if (getIsCancelled?.()) return;
    try {
      const doc = view?.contents?.document;
      if (doc?.documentElement) {
        doc.documentElement.style.setProperty('padding', '0', 'important');
        doc.documentElement.style.setProperty('padding-left', '0', 'important');
        doc.documentElement.style.setProperty('padding-right', '0', 'important');
        doc.documentElement.style.setProperty('padding-top', '0', 'important');
        doc.documentElement.style.setProperty('padding-bottom', '0', 'important');
        doc.documentElement.style.setProperty('margin', '0', 'important');
        doc.documentElement.style.setProperty('overflow', 'hidden', 'important');
        doc.documentElement.style.setProperty('scrollbar-width', 'none', 'important');
      }
      if (doc?.body) {
        doc.body.style.setProperty('padding', '0', 'important');
        doc.body.style.setProperty('padding-left', '0', 'important');
        doc.body.style.setProperty('padding-right', '0', 'important');
        doc.body.style.setProperty('padding-top', '0', 'important');
        doc.body.style.setProperty('padding-bottom', '0', 'important');
        doc.body.style.setProperty('margin', '0', 'important');
        doc.body.style.setProperty('overflow', 'hidden', 'important');
        doc.body.style.setProperty('scrollbar-width', 'none', 'important');
      }
    } catch {}
  });
}

export function createEpubContainerObserver(viewerEl) {
  if (!viewerEl || typeof MutationObserver === 'undefined') return null;
  const observer = new MutationObserver(() => {
    const epubContainer = viewerEl.querySelector('.epub-container');
    if (epubContainer) {
      epubContainer.style.overflow = 'hidden';
      epubContainer.style.scrollbarWidth = 'none';
      epubContainer.style.padding = '0';
      epubContainer.style.margin = '0';
    }
  });
  observer.observe(viewerEl, { childList: true, subtree: true });
  return observer;
}
