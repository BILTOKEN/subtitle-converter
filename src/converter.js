// Subtitle conversion core. Runs unchanged in the browser and in Node.
// No dependencies. Every format is parsed into a list of cues
// ({ start, end, text } with times in milliseconds) and then serialized.

export const FORMATS = {
  srt: { name: 'SRT', ext: 'srt', mime: 'application/x-subrip' },
  vtt: { name: 'VTT', ext: 'vtt', mime: 'text/vtt' },
  lrc: { name: 'LRC', ext: 'lrc', mime: 'text/plain' },
  txt: { name: 'TXT', ext: 'txt', mime: 'text/plain' },
};

// ---------------------------------------------------------------- helpers

const TIMING_RE =
  /^\s*((?:\d+:)?\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)\s*-->\s*((?:\d+:)?\d{1,2}:\d{1,2}(?:[.,]\d{1,3})?)(.*)$/;

const LRC_STAMP = /\[(\d+):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

function normalize(text) {
  return String(text ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function pad(n, width = 2) {
  return String(n).padStart(width, '0');
}

function fraction(digits) {
  return digits ? Math.round(Number('0.' + digits) * 1000) : 0;
}

/** "01:02:03,456", "02:03.456" or "1:02:03.4" -> milliseconds (NaN if invalid). */
export function parseClock(str) {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(String(str).trim());
  if (!m) return NaN;
  const h = Number(m[1] || 0);
  const min = Number(m[2]);
  const s = Number(m[3]);
  return ((h * 60 + min) * 60 + s) * 1000 + fraction(m[4]);
}

function clock(ms, sep) {
  const t = Math.max(0, Math.round(ms));
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(t % 1000, 3)}`;
}

function lrcClock(ms) {
  const cs = Math.max(0, Math.round(ms / 10));
  const m = Math.floor(cs / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `[${pad(m)}:${pad(s)}.${pad(cs % 100)}]`;
}

function shortClock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: '\u00A0', lrm: '\u200E', rlm: '\u200F',
};

function decodeEntities(s) {
  return s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (all, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : all;
    }
    return ENTITIES[e.toLowerCase()] ?? all;
  });
}

// {\an8}, {\i1} ... override codes that often leak into SRT files from ASS.
function removeAssOverrides(s) {
  return s.replace(/\{\\[^}]*\}/g, '');
}

/** Plain text: no tags, no entities. Used for TXT and LRC output. */
export function stripTags(s) {
  return decodeEntities(
    removeAssOverrides(s)
      .replace(/<rt>[\s\S]*?<\/rt>/gi, '')
      .replace(/<\/?[a-z][^<>]*>|<\d+:\d[^<>]*>/gi, ''),
  );
}

/** Text for SRT: keep <b>, <i>, <u>; drop WebVTT-only markup. */
function toSrtText(s) {
  const t = s
    .replace(/<rt>[\s\S]*?<\/rt>/gi, '')
    .replace(/<\d+:\d[^<>]*>/g, '')
    .replace(/<(\/?)([a-z]+)(?:[.\s][^<>]*)?>/gi, (tag, slash, name) =>
      /^(b|i|u)$/i.test(name) ? `<${slash}${name.toLowerCase()}>` : '',
    );
  return decodeEntities(t);
}

/** Text for WebVTT: remove things the format does not allow, escape the rest. */
function toVttText(s) {
  return removeAssOverrides(s)
    .replace(/<\/?font[^<>]*>/gi, '')
    .replace(/-->/g, '\u2192')
    .replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;')
    .replace(/<(?!\/?(?:b|i|u|c|v|lang|ruby|rt)\b[^<>]*>|\d+:\d)/gi, '&lt;');
}

function plainLines(text) {
  return stripTags(text)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------- parsers

/** SRT and WebVTT (the parser is lenient and accepts either). */
export function parseTimed(input) {
  const lines = normalize(input).split('\n');
  const raw = [];
  let cur = null;
  let skipping = false; // inside the WEBVTT header or a NOTE / STYLE / REGION block

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevBlank = i === 0 || lines[i - 1].trim() === '';

    if (skipping) {
      if (line.trim() === '') skipping = false;
      continue;
    }
    if (prevBlank && /^(WEBVTT|NOTE|STYLE|REGION)(\s|$)/.test(line)) {
      skipping = true;
      continue;
    }

    const m = TIMING_RE.exec(line);
    if (m) {
      const start = parseClock(m[1]);
      const end = parseClock(m[2]);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        // The line just before a timing line is a cue number / identifier.
        if (cur && i > 0) {
          const prev = lines[i - 1];
          const prevPrevBlank = i < 2 || lines[i - 2].trim() === '';
          if (prev.trim() !== '' && (prevPrevBlank || /^\s*\d+\s*$/.test(prev))) {
            if (cur.lines[cur.lines.length - 1] === prev) cur.lines.pop();
          }
        }
        cur = { start, end: Math.max(start, end), lines: [] };
        raw.push(cur);
        continue;
      }
    }
    if (cur) cur.lines.push(line);
  }

  return raw
    .map((c) => {
      let ls = c.lines;
      while (ls.length && ls[0].trim() === '') ls = ls.slice(1);
      const blank = ls.findIndex((l) => l.trim() === '');
      if (blank !== -1) ls = ls.slice(0, blank);
      return { start: c.start, end: c.end, text: ls.map((l) => l.replace(/\s+$/, '')).join('\n') };
    })
    .filter((c) => c.text.trim() !== '');
}

/**
 * LRC lyrics. Each line lasts until the next timestamp; the last line lasts
 * `lastDuration` ms. Handles [offset:], several timestamps on one line,
 * word-level <mm:ss.xx> stamps and lines that share a timestamp.
 */
export function parseLrc(input, { lastDuration = 4000 } = {}) {
  let offset = 0;
  const entries = [];

  for (const rawLine of normalize(input).split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const meta = /^\[([a-z]+)\s*:(.*)\]$/i.exec(line);
    if (meta) {
      if (meta[1].toLowerCase() === 'offset') {
        const v = parseInt(meta[2].trim(), 10);
        if (!Number.isNaN(v)) offset = v;
      }
      continue;
    }

    const lead = /^((?:\s*\[\d+:\d{1,2}(?:[.:]\d{1,3})?\])+)(.*)$/.exec(line);
    if (!lead) continue;
    const text = lead[2]
      .replace(/<\d+:\d{1,2}(?:[.:]\d{1,3})?>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    for (const t of lead[1].matchAll(LRC_STAMP)) {
      entries.push({ time: (Number(t[1]) * 60 + Number(t[2])) * 1000 + fraction(t[3]), text });
    }
  }

  // A positive offset makes lyrics appear sooner.
  for (const e of entries) e.time = Math.max(0, e.time - offset);
  entries.sort((a, b) => a.time - b.time);

  const groups = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && last.time === e.time) {
      if (e.text) last.texts.push(e.text);
    } else {
      groups.push({ time: e.time, texts: e.text ? [e.text] : [] });
    }
  }

  const cues = [];
  groups.forEach((g, i) => {
    if (!g.texts.length) return; // empty lines only mark where the previous line ends
    const next = groups[i + 1];
    cues.push({ start: g.time, end: next ? next.time : g.time + lastDuration, text: g.texts.join('\n') });
  });
  return cues;
}

function lastMatchEnd(re, str, min, max) {
  let cut = -1;
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(str))) {
    const pos = m.index + m[0].length;
    if (pos >= min && pos <= max) cut = pos;
  }
  return cut;
}

/** Break a long line into pieces of at most `max` characters, preferring sentence ends. */
export function splitLong(text, max) {
  const out = [];
  let rest = text.trim();
  const min = Math.floor(max * 0.4);
  while (rest.length > max) {
    const win = rest.slice(0, max + 1);
    let cut = lastMatchEnd(/[.!?](?=\s)|[。！？]/g, win, min, max);
    if (cut === -1) cut = lastMatchEnd(/[,;:](?=\s)|[，；：、]/g, win, min, max);
    if (cut === -1) {
      const sp = win.lastIndexOf(' ');
      cut = sp >= min ? sp : max;
    }
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/** Wrap a subtitle onto two lines when it is longer than `lineChars`. */
export function wrapTwoLines(text, lineChars) {
  if (text.length <= lineChars || text.includes('\n')) return text;
  const mid = Math.floor(text.length / 2);
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ' && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  if (best === -1) return text.slice(0, Math.ceil(text.length / 2)) + '\n' + text.slice(Math.ceil(text.length / 2));
  return text.slice(0, best) + '\n' + text.slice(best + 1);
}

/** Plain text -> cues with estimated timings. */
export function parseTxt(input, opts = {}) {
  const {
    split = 'line', // 'line': every line is a subtitle; 'block': blank lines separate subtitles
    timing = 'speed', // 'speed': characters per second; 'fixed': same duration for each subtitle
    cps = 17,
    fixedSeconds = 3,
    startMs = 0,
    maxChars = 84,
    lineChars = 42,
    gapMs = 0,
    minMs = 1000,
    maxMs = 7000,
  } = opts;

  const pieces = [];
  const text = normalize(input);
  if (split === 'block') {
    for (const block of text.split(/\n\s*\n/)) {
      const ls = block.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (ls.length) pieces.push(ls.join('\n'));
    }
  } else {
    for (const rawLine of text.split('\n')) {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (line) pieces.push(...splitLong(line, Math.max(10, maxChars)).map((p) => wrapTwoLines(p, lineChars)));
    }
  }

  const speed = Math.max(1, Number(cps) || 17);
  let t = Math.max(0, Number(startMs) || 0);
  return pieces.map((piece) => {
    const len = piece.replace(/\n/g, '').length;
    const dur = Math.round(
      timing === 'fixed'
        ? Math.max(100, (Number(fixedSeconds) || 3) * 1000)
        : Math.min(maxMs, Math.max(minMs, (len / speed) * 1000)),
    );
    const cue = { start: t, end: t + dur, text: piece };
    t += dur + Math.max(0, Number(gapMs) || 0);
    return cue;
  });
}

// ---------------------------------------------------------------- writers

export function toSrt(cues) {
  const body = cues
    .map((c, i) => `${i + 1}\n${clock(c.start, ',')} --> ${clock(c.end, ',')}\n${toSrtText(c.text)}`)
    .join('\n\n');
  return cues.length ? body + '\n' : '';
}

export function toVtt(cues) {
  const body = cues.map((c) => `${clock(c.start, '.')} --> ${clock(c.end, '.')}\n${toVttText(c.text)}`).join('\n\n');
  return 'WEBVTT\n\n' + (cues.length ? body + '\n' : '');
}

/** endMarkers: add an empty timestamp where a line should disappear before a pause. */
export function toLrc(cues, { endMarkers = true, gapThreshold = 500 } = {}) {
  const out = [];
  cues.forEach((c, i) => {
    out.push(lrcClock(c.start) + plainLines(c.text).join(' '));
    const next = cues[i + 1];
    if (endMarkers && (!next || next.start - c.end >= gapThreshold)) out.push(lrcClock(c.end));
  });
  return out.length ? out.join('\n') + '\n' : '';
}

/**
 * mode: 'lines' (one subtitle per line) or 'paragraphs'.
 * dedupe: drop lines that repeat the previous one or two (rolling auto-captions).
 */
export function toTxt(cues, { mode = 'lines', timestamps = false, dedupe = true } = {}) {
  if (timestamps) {
    const rows = cues
      .map((c) => ({ start: c.start, text: plainLines(c.text).join(' ') }))
      .filter((r) => r.text);
    const kept = dedupe ? rows.filter((r, i) => i === 0 || r.text !== rows[i - 1].text) : rows;
    return kept.length ? kept.map((r) => `[${shortClock(r.start)}] ${r.text}`).join('\n') + '\n' : '';
  }

  // Each item: { text, start, end } at line level when deduping, cue level otherwise.
  let items = [];
  for (const c of cues) {
    const ls = plainLines(c.text);
    if (!ls.length) continue;
    if (dedupe) for (const l of ls) items.push({ text: l, start: c.start, end: c.end });
    else items.push({ text: ls.join(' '), start: c.start, end: c.end });
  }
  if (dedupe) {
    const kept = [];
    for (const it of items) {
      const a = kept[kept.length - 1];
      const b = kept[kept.length - 2];
      if ((a && a.text === it.text) || (b && b.text === it.text)) {
        if (a && a.text === it.text) a.end = Math.max(a.end, it.end);
        continue;
      }
      kept.push({ ...it });
    }
    items = kept;
  }
  if (!items.length) return '';

  if (mode === 'paragraphs') {
    const paras = [];
    let para = '';
    let prevEnd = null;
    for (const it of items) {
      const longPause = prevEnd !== null && it.start - prevEnd >= 2000;
      const sentenceDone = /[.!?。！？]["'”’)\]]?$/.test(para);
      if (para && (longPause || (para.length >= 300 && sentenceDone))) {
        paras.push(para);
        para = '';
      }
      para = para ? `${para} ${it.text}` : it.text;
      prevEnd = Math.max(prevEnd ?? 0, it.end);
    }
    if (para) paras.push(para);
    return paras.join('\n\n') + '\n';
  }
  return items.map((it) => it.text).join('\n') + '\n';
}

// ---------------------------------------------------------------- api

/** Best guess at the format of a pasted text. */
export function detectFormat(text) {
  const t = normalize(text).trimStart();
  if (!t) return null;
  if (/^WEBVTT/.test(t)) return 'vtt';
  if (/-->/.test(t)) return /\d:\d{2},\d/.test(t) ? 'srt' : 'vtt';
  if (/^\s*\[\d+:\d{1,2}(?:[.:]\d{1,3})?\]/m.test(t)) return 'lrc';
  return 'txt';
}

export function parse(input, from, options = {}) {
  switch (from) {
    case 'srt':
    case 'vtt':
      return parseTimed(input);
    case 'lrc':
      return parseLrc(input, options);
    case 'txt':
      return parseTxt(input, options);
    default:
      throw new Error(`Unknown input format: ${from}`);
  }
}

export function write(cues, to, options = {}) {
  switch (to) {
    case 'srt':
      return toSrt(cues);
    case 'vtt':
      return toVtt(cues);
    case 'lrc':
      return toLrc(cues, options);
    case 'txt':
      return toTxt(cues, options);
    default:
      throw new Error(`Unknown output format: ${to}`);
  }
}

/** convert(text, 'srt', 'vtt') -> { output, count } */
export function convert(input, from, to, options = {}) {
  const cues = parse(input, from, options);
  return { output: write(cues, to, options), count: cues.length };
}
