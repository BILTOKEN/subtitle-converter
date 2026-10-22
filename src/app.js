import { convert, detectFormat, parseClock, FORMATS } from './converter.js';

const TOOL_SLUGS = new Set(['srt-to-txt', 'txt-to-srt', 'srt-to-vtt', 'vtt-to-srt', 'lrc-to-srt', 'srt-to-lrc']);

// Original sample content, one per input format.
const SAMPLES = {
  srt: `1
00:00:01,000 --> 00:00:03,400
Welcome back to the studio.

2
00:00:03,700 --> 00:00:06,500
Today we're shooting a short
product video for a coffee grinder.

3
00:00:07,000 --> 00:00:09,800
<i>Start with a wide shot of the counter.</i>

4
00:00:10,200 --> 00:00:13,000
Then move in slowly on the handle.
`,
  vtt: `WEBVTT

00:00:01.000 --> 00:00:03.400
Welcome back to the studio.

00:00:03.700 --> 00:00:06.500
Today we're shooting a short
product video for a coffee grinder.

00:00:07.000 --> 00:00:09.800
<i>Start with a wide shot of the counter.</i>

00:00:10.200 --> 00:00:13.000
Then move in slowly on the handle.
`,
  lrc: `[ti:Sample Track]
[ar:Demo Artist]
[00:01.00]Morning light across the counter
[00:04.50]Steam is rising from the cup
[00:08.20]Every frame a little slower
[00:12.00]Hold the shot and look up
[00:16.00]
`,
  txt: `Welcome back to the studio.
Today we're shooting a short product video for a coffee grinder.
Start with a wide shot of the counter, then move in slowly on the handle.
Finish on the beans falling into the cup.
`,
};

const root = document.querySelector('[data-tool]');
if (root) init(root);

function init(root) {
  const $ = (sel) => root.querySelector(sel);
  const input = $('#input');
  const output = $('#output');
  const status = $('[data-status]');
  const fileInput = $('[data-file]');
  const fileName = $('[data-file-name]');
  const drop = $('[data-drop]');
  const btnDownload = $('[data-action="download"]');
  const btnCopy = $('[data-action="copy"]');
  const fromSelect = $('[data-select="from"]');
  const toSelect = $('[data-select="to"]');
  const inputLabel = $('[data-input-label]');
  const outputLabel = $('[data-output-label]');
  const isHome = root.dataset.from === 'auto';

  let baseName = 'subtitles';
  let timer = 0;
  let toTouched = false; // home page: the visitor picked an output format themselves
  const NATURAL_TARGET = { srt: 'vtt', vtt: 'srt', lrc: 'srt', txt: 'srt' };
  if (toSelect) toSelect.addEventListener('change', () => (toTouched = true));

  const getFrom = () => {
    if (!isHome) return root.dataset.from;
    return fromSelect.value === 'auto' ? detectFormat(input.value) || 'txt' : fromSelect.value;
  };
  const getTo = () => (toSelect ? toSelect.value : root.dataset.to);

  function parseTimeInput(value) {
    const v = String(value || '').trim();
    if (!v) return 0;
    if (/^\d+(\.\d+)?$/.test(v)) return Math.round(Number(v) * 1000);
    const ms = parseClock(v.split(':').length === 2 ? `00:${v}` : v);
    return Number.isNaN(ms) ? 0 : ms;
  }

  function readOptions() {
    const o = {};
    root.querySelectorAll('[data-opt]').forEach((el) => {
      const key = el.dataset.opt;
      if (el.type === 'checkbox') o[key] = el.checked;
      else if (el.dataset.kind === 'time') o[key] = parseTimeInput(el.value);
      else if (el.type === 'number') {
        const n = Number(el.value);
        if (Number.isFinite(n) && el.value !== '') o[key] = n * (Number(el.dataset.scale) || 1);
      } else o[key] = el.value;
    });
    return o;
  }

  function updateVisibility() {
    root.querySelectorAll('[data-show-when]').forEach((el) => {
      const [key, val] = el.dataset.showWhen.split('=');
      const ctl = root.querySelector(`[data-opt="${key}"]`);
      el.hidden = ctl ? ctl.value !== val : false;
    });
  }

  function setStatus(html, kind = '') {
    status.innerHTML = html;
    status.dataset.kind = kind;
  }

  function setReady(ready) {
    btnDownload.disabled = !ready;
    btnCopy.disabled = !ready;
  }

  function updateLabels(from, to) {
    if (!isHome) return;
    const detected = fromSelect.value === 'auto' && input.value.trim() ? ` (detected: ${FORMATS[from].name})` : '';
    inputLabel.textContent = `Input${detected}`;
    outputLabel.textContent = `${FORMATS[to].name} output`;
    btnDownload.textContent = `Download .${FORMATS[to].ext}`;
  }

  function suggestion(text, from, to) {
    const guess = detectFormat(text);
    if (!guess || guess === from || (guess === 'vtt' && from === 'srt') || (guess === 'srt' && from === 'vtt')) {
      return 'Check that the text contains timing lines like <code>00:00:01,000 --> 00:00:03,000</code>.';
    }
    const slug = `${guess === 'vtt' ? 'srt' : guess}-to-${to}`;
    const name = FORMATS[guess].name;
    if (TOOL_SLUGS.has(slug)) return `This looks like ${name} – try the <a href="/${slug}">${name} to ${FORMATS[to].name} converter</a>.`;
    return `This looks like ${name} – try the <a href="/">all-in-one converter</a>.`;
  }

  function run() {
    updateVisibility();
    const text = input.value;
    const from = getFrom();
    if (isHome && !toTouched && text.trim() && from === toSelect.value) toSelect.value = NATURAL_TARGET[from];
    const to = getTo();
    updateLabels(from, to);

    if (!text.trim()) {
      output.value = '';
      setStatus('');
      setReady(false);
      return;
    }
    if (from === to || (isHome && from === 'vtt' && to === 'vtt')) {
      output.value = '';
      setStatus(`The input is already ${FORMATS[from].name}. Choose a different output format.`, 'error');
      setReady(false);
      return;
    }
    try {
      const { output: result, count } = convert(text, from, to, readOptions());
      if (!count) {
        output.value = '';
        setStatus(`No subtitles found. ${suggestion(text, from, to)}`, 'error');
        setReady(false);
        return;
      }
      output.value = result;
      setStatus(`Converted ${count.toLocaleString('en-US')} ${count === 1 ? 'subtitle' : 'subtitles'}.`, 'ok');
      setReady(true);
    } catch (err) {
      output.value = '';
      setStatus('Something went wrong while converting. Please check the input.', 'error');
      setReady(false);
      console.error(err);
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  }

  async function readFile(file) {
    if (file.size > 50 * 1024 * 1024) {
      setStatus('That file is larger than 50 MB. Subtitle files are usually much smaller – is it the right file?', 'error');
      return;
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    let text;
    if (buf[0] === 0xff && buf[1] === 0xfe) text = new TextDecoder('utf-16le').decode(buf);
    else if (buf[0] === 0xfe && buf[1] === 0xff) text = new TextDecoder('utf-16be').decode(buf);
    else {
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
      } catch {
        text = new TextDecoder('windows-1252').decode(buf);
      }
    }
    baseName = file.name.replace(/\.[^.]+$/, '') || 'subtitles';
    fileName.textContent = file.name;
    input.value = text;
    run();
  }

  input.addEventListener('input', schedule);
  root.querySelectorAll('[data-opt], [data-select]').forEach((el) => {
    el.addEventListener('input', schedule);
    el.addEventListener('change', run);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) readFile(file);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((type) =>
    drop.addEventListener(type, (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    }),
  );
  ['dragleave', 'dragend', 'drop'].forEach((type) =>
    drop.addEventListener(type, () => drop.classList.remove('is-over')),
  );
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) readFile(file);
  });

  root.querySelector('[data-action="sample"]').addEventListener('click', () => {
    const fmt = isHome ? (fromSelect.value === 'auto' ? 'srt' : fromSelect.value) : root.dataset.from;
    input.value = SAMPLES[fmt];
    baseName = 'sample';
    fileName.textContent = '';
    run();
  });

  root.querySelector('[data-action="clear"]').addEventListener('click', () => {
    input.value = '';
    baseName = 'subtitles';
    fileName.textContent = '';
    run();
    input.focus();
  });

  btnCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.select();
      document.execCommand('copy');
    }
    const label = btnCopy.textContent;
    btnCopy.textContent = 'Copied';
    setTimeout(() => (btnCopy.textContent = label), 1400);
  });

  btnDownload.addEventListener('click', () => {
    const fmt = FORMATS[getTo()];
    const blob = new Blob([output.value], { type: `${fmt.mime};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName}.${fmt.ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  run();
}
