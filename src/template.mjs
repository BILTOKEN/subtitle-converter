import { SITE_NAME, tools } from './pages.mjs';

const FORMAT_NAMES = { srt: 'SRT', vtt: 'VTT', lrc: 'LRC', txt: 'TXT', auto: 'Subtitle' };

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function optionHtml(o) {
  const show = o.showWhen ? ` data-show-when="${esc(o.showWhen)}"` : '';
  const id = `opt-${o.id}`;
  if (o.type === 'checkbox') {
    return `<label class="opt opt-check"${show}><input type="checkbox" id="${id}" data-opt="${o.id}"${o.checked ? ' checked' : ''}> <span>${esc(o.label)}</span></label>`;
  }
  if (o.type === 'select') {
    const choices = o.choices.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
    return `<label class="opt"${show}><span>${esc(o.label)}</span><select id="${id}" data-opt="${o.id}">${choices}</select></label>`;
  }
  if (o.type === 'number') {
    const scale = o.scale ? ` data-scale="${o.scale}"` : '';
    return `<label class="opt"${show}><span>${esc(o.label)}</span><input type="number" id="${id}" data-opt="${o.id}" value="${o.value}" min="${o.min}" max="${o.max}" step="${o.step}" inputmode="decimal"${scale}></label>`;
  }
  if (o.type === 'time') {
    return `<label class="opt"${show}><span>${esc(o.label)}</span><input type="text" id="${id}" data-opt="${o.id}" data-kind="time" value="${esc(o.value)}" placeholder="hh:mm:ss" inputmode="numeric" size="9"></label>`;
  }
  return '';
}

function toolHtml(page) {
  const isHome = page.from === 'auto';
  const fromName = FORMAT_NAMES[page.from];
  const toName = FORMAT_NAMES[page.to];
  const inputLabel = isHome ? 'Input' : `${fromName} input`;
  const outputLabel = isHome ? 'Output' : `${toName} output`;
  const placeholder = isHome
    ? 'Paste SRT, VTT, LRC or plain text here, or drop a file'
    : `Paste ${fromName === 'TXT' ? 'your text' : fromName + ' subtitles'} here, or drop a file`;

  let options = (page.options || []).map(optionHtml).join('');
  if (isHome) {
    const sel = (id, label, list, selected) =>
      `<label class="opt"><span>${label}</span><select id="sel-${id}" data-select="${id}">${list
        .map(([v, l]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${l}</option>`)
        .join('')}</select></label>`;
    options =
      sel('from', 'From', [['auto', 'Auto-detect'], ['srt', 'SRT'], ['vtt', 'VTT'], ['lrc', 'LRC'], ['txt', 'TXT']], 'auto') +
      sel('to', 'To', [['srt', 'SRT'], ['vtt', 'VTT'], ['txt', 'TXT'], ['lrc', 'LRC']], 'srt');
  }
  const optionsBar = options
    ? `<div class="options" aria-label="Options">${options}</div>`
    : `<p class="options options-note">No settings needed – the conversion follows the format rules.</p>`;

  return `
<section class="tool" data-tool data-from="${page.from}" data-to="${page.to}" aria-label="Converter">
  ${optionsBar}
  <div class="panes">
    <div class="pane">
      <div class="pane-head">
        <label for="input" data-input-label>${esc(inputLabel)}</label>
        <span class="pane-actions">
          <button type="button" class="link-btn" data-action="sample">Try a sample</button>
          <button type="button" class="link-btn" data-action="clear">Clear</button>
        </span>
      </div>
      <div class="drop" data-drop>
        <textarea id="input" spellcheck="false" autocomplete="off" placeholder="${esc(placeholder)}"></textarea>
        <div class="drop-hint" aria-hidden="true">Drop the file to load it</div>
      </div>
      <div class="pane-foot">
        <label class="btn btn-secondary file-btn">
          <input type="file" accept="${esc(page.accept)}" data-file>
          <span>Upload file</span>
        </label>
        <span class="file-name" data-file-name></span>
      </div>
    </div>
    <div class="pane">
      <div class="pane-head">
        <label for="output" data-output-label>${esc(outputLabel)}</label>
      </div>
      <textarea id="output" readonly spellcheck="false" placeholder="The converted result appears here"></textarea>
      <div class="pane-foot">
        <button type="button" class="btn btn-primary" data-action="download" disabled>Download${isHome ? '' : ' .' + page.to}</button>
        <button type="button" class="btn btn-secondary" data-action="copy" disabled>Copy</button>
      </div>
    </div>
  </div>
  <p class="status" role="status" aria-live="polite" data-status></p>
</section>`;
}

function stepsHtml(page) {
  if (!page.steps) return '';
  return `<h2>How to convert ${FORMAT_NAMES[page.from]} to ${FORMAT_NAMES[page.to]}</h2>
<ol class="steps">${page.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`;
}

function sectionsHtml(page) {
  return (page.sections || []).map((s) => `<h2>${esc(s.h)}</h2>\n${s.html}`).join('\n');
}

function faqHtml(page) {
  if (!page.faq || !page.faq.length) return '';
  return `<h2>Frequently asked questions</h2>
<div class="faq">${page.faq
    .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join('')}</div>`;
}

function cardsHtml(slugs, heading) {
  const list = slugs.map((s) => tools.find((t) => t.slug === s)).filter(Boolean);
  if (!list.length) return '';
  return `<h2 id="converters">${esc(heading)}</h2>
<ul class="cards">${list
    .map((t) => `<li><a href="/${t.slug}"><strong>${esc(t.h1)}</strong><span>${esc(t.card)}</span></a></li>`)
    .join('')}</ul>`;
}

function faqJsonLd(page) {
  if (!page.faq || !page.faq.length) return '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export function renderPage(page, ctx) {
  const { siteUrl, assets, verification = {} } = ctx;
  const path = page.slug ? `/${page.slug}` : '/';
  const canonical = siteUrl + (page.slug ? `/${page.slug}` : '/');
  const isTool = page.from && page.to;
  const isHome = page.slug === '';
  const is404 = page.slug === '404';

  const verify = [
    verification.google ? `<meta name="google-site-verification" content="${esc(verification.google)}">` : '',
    verification.bing ? `<meta name="msvalidate.01" content="${esc(verification.bing)}">` : '',
  ].join('');

  const main = is404
    ? `<div class="hero"><h1>${esc(page.h1)}</h1><p class="lead">${esc(page.lead)}</p></div>
       <article class="content">${cardsHtml(tools.map((t) => t.slug), 'Converters')}</article>`
    : `<div class="hero"><h1>${esc(page.h1)}</h1><p class="lead">${esc(page.lead)}</p></div>
       ${isTool ? toolHtml(page) : ''}
       <article class="content">
         ${isHome ? cardsHtml(tools.map((t) => t.slug), 'Converters') : stepsHtml(page)}
         ${sectionsHtml(page)}
         ${faqHtml(page)}
         ${page.related ? cardsHtml(page.related, 'Related converters') : ''}
       </article>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${is404 ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
${is404 ? '' : `<meta property="og:url" content="${canonical}">`}
<meta name="theme-color" content="#f7f7f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141517" media="(prefers-color-scheme: dark)">
${verify}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${assets.css}">
<script defer src="https://site-dashboard-iota.vercel.app/t.js" data-site="subtitle-converter-jade"></script>
${is404 ? '' : faqJsonLd(page)}
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/"${path === '/' ? ' aria-current="page"' : ''}>
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><rect x="2" y="5" width="28" height="22" rx="5" fill="var(--accent)"/><rect x="7" y="16" width="11" height="3" rx="1.5" fill="var(--accent-ink)"/><rect x="20" y="16" width="5" height="3" rx="1.5" fill="var(--accent-ink)" opacity=".7"/><rect x="7" y="21" width="6" height="3" rx="1.5" fill="var(--accent-ink)" opacity=".7"/><rect x="15" y="21" width="10" height="3" rx="1.5" fill="var(--accent-ink)"/></svg>
      <span>${esc(SITE_NAME)}</span>
    </a>
    <nav class="header-nav" aria-label="Converters">
      ${tools.map((t) => `<a href="/${t.slug}"${path === '/' + t.slug ? ' aria-current="page"' : ''}>${FORMAT_NAMES[t.from]} → ${FORMAT_NAMES[t.to]}</a>`).join('')}
    </nav>
  </div>
</header>
<main class="wrap">
${main}
</main>
<footer class="site-footer">
  <div class="wrap footer-inner">
    <p><strong>${esc(SITE_NAME)}</strong> – conversions run in your browser. Your files are never uploaded.</p>
    <p class="footer-links">${tools.map((t) => `<a href="/${t.slug}">${esc(t.h1.replace(' Converter', ''))}</a>`).join('')}</p>
    <p class="muted">© ${new Date().getFullYear()} ${esc(SITE_NAME)}</p>
  </div>
</footer>
${isTool ? `<script type="module" src="${assets.js}"></script>` : ''}
</body>
</html>
`;
}
