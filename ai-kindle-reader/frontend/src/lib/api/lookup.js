import { apiGet } from './client';

const dictCache = new Map();

export function normalizeDictionaryEntries(entries, fallbackWord) {
  const first = entries?.[0] || {};
  const phoneticsAll = entries.flatMap((e) => e.phonetics || []);
  const phonetic =
    entries.find((e) => e.phonetic)?.phonetic ||
    phoneticsAll.find((p) => p?.text)?.text ||
    '';
  const audio = phoneticsAll.find((p) => p?.audio)?.audio || '';

  const partsOfSpeech = [];
  const definition = [];
  for (const entry of entries) {
    for (const meaning of entry.meanings || []) {
      if (meaning.partOfSpeech && !partsOfSpeech.includes(meaning.partOfSpeech)) {
        partsOfSpeech.push(meaning.partOfSpeech);
      }
      for (const d of meaning.definitions || []) {
        if (d?.definition) definition.push(d.definition);
      }
    }
  }

  return {
    word: first.word || fallbackWord,
    phonetic,
    audio,
    partsOfSpeech,
    definition,
    entries,
  };
}

export async function lookupWord(word) {
  const clean = String(word || '')
    .trim()
    .replace(/^[^a-zA-Z0-9-]+|[^a-zA-Z0-9-]+$/g, '')
    .toLowerCase();

  const empty = (w) => ({
    word: w,
    phonetic: '',
    audio: '',
    partsOfSpeech: [],
    definition: [],
    entries: [],
  });

  if (!clean || (/\s/.test(clean) && clean.split(/\s+/).length > 3)) return empty(clean);

  const term = clean.split(/\s+/)[0];

  if (dictCache.has(term)) return dictCache.get(term);

  try {
    const data = await apiGet(`/api/lookup/define?word=${encodeURIComponent(term)}`);
    let result;
    if (Array.isArray(data) && data.length > 0) {
      result = normalizeDictionaryEntries(data, term);
    } else if (data && Array.isArray(data.definition) && data.definition.length > 0) {
      result = { ...empty(term), ...data, entries: data.entries || [] };
    } else {
      result = empty(term);
    }
    dictCache.set(term, result);
    return result;
  } catch {
    return empty(term);
  }
}
