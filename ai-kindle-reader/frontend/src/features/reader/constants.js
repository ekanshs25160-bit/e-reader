export const READER_PALETTES = {
  paper: {
    name: 'Paper',
    bg: '#FAF9F6',
    fg: '#152A41',
    muted: '#43474D',
    border: 'rgba(21, 42, 65, 0.15)',
    accent: '#855224',
  },
  sepia: {
    name: 'Sepia',
    bg: '#F4ECD8',
    fg: '#2C2214',
    muted: '#5B472C',
    border: 'rgba(91, 71, 44, 0.20)',
    accent: '#7A491B',
  },
  night: {
    name: 'Night',
    bg: '#141824',
    fg: '#F0F2F5',
    muted: '#A0AEC0',
    border: 'rgba(255, 255, 255, 0.12)',
    accent: '#E2B170',
  },
  oled: {
    name: 'OLED',
    bg: '#000000',
    fg: '#EDEDED',
    muted: '#A0A0A0',
    border: 'rgba(255, 255, 255, 0.15)',
    accent: '#E2B170',
  },
};

export const PALETTES = [
  { id: 'paper', label: 'Paper', subtitle: 'Natural Warmth', isDark: false },
  { id: 'sepia', label: 'Sepia', subtitle: 'Warm Parchment', isDark: false },
  { id: 'night', label: 'Night', subtitle: 'Deep Charcoal', isDark: true },
  { id: 'oled', label: 'OLED', subtitle: 'Pitch Black', isDark: true },
  { id: 'auto', label: 'Auto', subtitle: 'Follow System', isDark: false, isAuto: true },
];

export const TYPEFACES = [
  {
    id: 'literata',
    label: 'Literata',
    family: "'Literata', serif",
    category: 'Editorial Serif',
    caption: '“The default. Drawn for screens, at every size.”',
  },
  {
    id: 'garamond',
    label: 'Garamond',
    family: "'EB Garamond', serif",
    category: 'Classic Renaissance',
    caption: '“Classic renaissance proportions, refined and poetic.”',
  },
  {
    id: 'source-serif',
    label: 'Source Serif',
    family: "'Source Serif 4', serif",
    category: 'Contemporary Book',
    caption: '“Rationalized forms optimized for long-form reading.”',
  },
  {
    id: 'newsreader',
    label: 'Newsreader',
    family: "'Newsreader', serif",
    category: 'Continuous Editorial',
    caption: '“Designed specifically for continuous on-screen text.”',
  },
  {
    id: 'lora',
    label: 'Lora',
    family: "'Lora', serif",
    category: 'Calligraphic Serif',
    caption: '“Contemporary serif with brushed, calligraphic curves.”',
  },
  {
    id: 'inter',
    label: 'Inter',
    family: "'Inter', sans-serif",
    category: 'Modern Sans',
    caption: '“Neutral, highly legible modern sans-serif.”',
  },
  {
    id: 'opendyslexic',
    label: 'OpenDyslexic',
    family: "'OpenDyslexic', sans-serif",
    category: 'Specialized Legibility',
    caption: '“Weighted bottoms to prevent letter inversion and confusion.”',
  },
];

export const MARGIN_STEPS = ['narrow', 'normal', 'wide'];

export const DEFAULT_READER_SETTINGS = {
  palette: 'paper',
  theme: 'paper',
  fontSize: null,
  typeface: 'literata',
  fontFamily: 'literata',
  align: 'auto',
  lineHeight: '1.75',
  margins: 'normal',
  spread: 'auto',
};

export const STATIC_GUTENBERG_BOOKS = {
  '2701': { title: 'Moby Dick', author: 'Herman Melville' },
  '345': { title: 'Dracula', author: 'Bram Stoker' },
  '1727': { title: 'The Odyssey', author: 'Homer' },
  '2680': { title: 'Meditations', author: 'Marcus Aurelius' },
  '84': { title: 'Frankenstein', author: 'Mary Shelley' },
  '2554': { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky' },
};

export const DEMO_FALLBACK_CONTENT = {
  volume: 'Volume I',
  chapter: 'CHAPTER I.',
  paragraphs: [
    'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    'However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.',
    '“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”',
    'Mr. Bennet replied that he had not.',
    '“But it is,” returned she; “for Mrs. Long has just been here, and she told me all about it.”',
    'Mr. Bennet made no answer.',
    '“Do you not want to know who has taken it?” cried his wife impatiently.',
    '“You want to tell me, and I have no objection to hearing it.”',
    'This was invitation enough.',
  ],
};
