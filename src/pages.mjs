// Page content. Each tool page targets one search phrase and explains the
// conversion honestly. Strings marked html are trusted markup.

export const SITE_NAME = 'Subtitle Converter';

const PRIVATE_FAQ = {
  q: 'Is my file uploaded anywhere?',
  a: 'No. The conversion runs entirely in your browser with JavaScript. Your subtitles never leave your device, and once the page has loaded it keeps working even if you go offline.',
};

const ENCODING_FAQ = {
  q: 'Does it work with other languages?',
  a: 'Yes. Files saved as UTF-8, UTF-16 or Windows-1252 are read correctly, which covers almost every subtitle file. If the text looks garbled after loading, open the file in a text editor, save it as UTF-8 and try again.',
};

export const tools = [
  {
    slug: 'srt-to-txt',
    from: 'srt',
    to: 'txt',
    accept: '.srt,.vtt,.txt',
    title: 'SRT to TXT Converter – Remove Timestamps from Subtitles',
    description:
      'Convert SRT subtitles to plain text online. Removes numbers, timestamps and tags, can merge lines into paragraphs, and never uploads your file.',
    h1: 'SRT to TXT Converter',
    card: 'Strip numbers and timestamps to get clean, readable text.',
    lead:
      'Turn an SRT subtitle file into clean, readable text. Sequence numbers, timestamps and formatting tags are removed, so you are left with just the words – ready for a transcript, an article or your notes.',
    options: [
      {
        type: 'select', id: 'mode', label: 'Layout',
        choices: [['lines', 'One subtitle per line'], ['paragraphs', 'Merge into paragraphs']],
      },
      { type: 'checkbox', id: 'timestamps', label: 'Keep start times' },
      { type: 'checkbox', id: 'dedupe', label: 'Remove repeated lines', checked: true },
    ],
    steps: [
      'Paste your subtitles into the left box or upload an .srt file. WebVTT (.vtt) files work too.',
      'Pick a layout: one subtitle per line, or flowing paragraphs.',
      'Copy the text or download it as a .txt file.',
    ],
    sections: [
      {
        h: 'What gets removed',
        html:
          '<p>An SRT file stores each subtitle as a small block: a sequence number, a time range such as <code>00:01:02,500 --&gt; 00:01:05,000</code>, and one or two lines of text. This converter keeps only the text. It also strips tags like <code>&lt;i&gt;</code> and <code>&lt;font&gt;</code>, positioning codes such as <code>{\\an8}</code>, and turns entities like <code>&amp;amp;</code> back into normal characters.</p>',
      },
      {
        h: 'Paragraph mode',
        html:
          '<p>Subtitles are short by design, so a straight copy reads like a list. Paragraph mode joins them into running sentences and starts a new paragraph when the speaker pauses for two seconds or more, or when a long stretch of text reaches the end of a sentence. It is a quick way to turn a video&rsquo;s captions into a transcript people can actually read.</p>',
      },
      {
        h: 'Repeated lines',
        html:
          '<p>Automatic captions often &ldquo;roll&rdquo;: each new subtitle repeats the line before it, so the same sentence appears two or three times. With <strong>Remove repeated lines</strong> switched on, a line that matches one of the two lines just before it is dropped. Switch it off if your text really does repeat, for example a chorus.</p>',
      },
    ],
    faq: [
      PRIVATE_FAQ,
      {
        q: 'Can I convert a VTT caption file to text?',
        a: 'Yes. This page also reads WebVTT files, including the rolling captions YouTube Studio lets you download for your own videos. Paste or upload the .vtt file the same way.',
      },
      {
        q: 'Why are some lines missing from the text?',
        a: 'Most likely they were exact repeats of the line before, which the Remove repeated lines option drops. Subtitles that contain only formatting tags and no words are skipped as well.',
      },
      {
        q: 'Can I keep the timestamps?',
        a: 'Tick Keep start times and every line starts with its time in [hh:mm:ss] form. That is handy for interview notes or for finding a quote in the video later.',
      },
      ENCODING_FAQ,
    ],
    related: ['txt-to-srt', 'vtt-to-srt', 'srt-to-vtt'],
  },
  {
    slug: 'txt-to-srt',
    from: 'txt',
    to: 'srt',
    accept: '.txt,.text,.md',
    title: 'TXT to SRT Converter – Turn Text into Timed Subtitles',
    description:
      'Convert plain text or a transcript into an SRT subtitle file. Timings are estimated from reading speed, long lines are split, and nothing is uploaded.',
    h1: 'TXT to SRT Converter',
    card: 'Turn a script or transcript into an SRT file with estimated timings.',
    lead:
      'Paste a script or transcript and get an SRT file you can drop into your editor. Each line becomes a subtitle, timed by how long it takes to read.',
    options: [
      {
        type: 'select', id: 'split', label: 'Split',
        choices: [['line', 'Each line is a subtitle'], ['block', 'Blank lines separate subtitles']],
      },
      {
        type: 'select', id: 'timing', label: 'Timing',
        choices: [['speed', 'By reading speed'], ['fixed', 'Same length for each']],
      },
      { type: 'number', id: 'cps', label: 'Characters per second', value: 17, min: 5, max: 40, step: 1, showWhen: 'timing=speed' },
      { type: 'number', id: 'fixedSeconds', label: 'Seconds per subtitle', value: 3, min: 0.5, max: 30, step: 0.5, showWhen: 'timing=fixed' },
      { type: 'time', id: 'startMs', label: 'Start at', value: '00:00:00' },
      { type: 'number', id: 'maxChars', label: 'Max characters per subtitle', value: 84, min: 20, max: 200, step: 1, showWhen: 'split=line' },
    ],
    steps: [
      'Paste your text into the left box or upload a .txt file.',
      'Choose how the text is split into subtitles and how long each one stays on screen.',
      'Download the .srt file and fine-tune the timing in your video editor.',
    ],
    sections: [
      {
        h: 'How the timings are estimated',
        html:
          '<p>Plain text has no timing information, so the converter estimates it. In <strong>reading speed</strong> mode each subtitle stays on screen for its length divided by the characters-per-second value, never shorter than one second and never longer than seven. Subtitles follow each other back to back from the start time you choose. The default of 17 characters per second sits in the middle of the 15&ndash;20 range that common subtitling guidelines recommend.</p>',
      },
      {
        h: 'Line length',
        html:
          '<p>In &ldquo;Each line is a subtitle&rdquo; mode, a line longer than the maximum is split into several subtitles &ndash; at the end of a sentence where possible, otherwise at a comma, otherwise at a space. Any subtitle longer than 42 characters is wrapped onto two lines, the line length most broadcast and streaming style guides use. If you have already written your subtitles line by line, choose &ldquo;Blank lines separate subtitles&rdquo; and every block is kept exactly as you wrote it.</p>',
      },
      {
        h: 'Syncing with your video',
        html:
          '<p>Estimated timings are a starting point, not a perfect sync. Import the SRT into your editor, play it back and nudge subtitles to match the speech. If you know when the first line is spoken, set <strong>Start at</strong> to that time first &ndash; it saves shifting every subtitle later.</p>',
      },
    ],
    faq: [
      {
        q: 'Will the subtitles match my video exactly?',
        a: 'No. The converter only knows your text, not your audio, so the timings are estimates based on reading speed. They are usually close enough to adjust quickly in an editor, but plan on a review pass.',
      },
      {
        q: 'Which programs can open the SRT file?',
        a: 'SRT is the most widely supported subtitle format. Premiere Pro, DaVinci Resolve, YouTube and VLC all read it, along with most other video editors, video platforms and media players.',
      },
      {
        q: 'What is a good reading speed?',
        a: 'Around 15 to 20 characters per second suits most adult audiences. Use a lower value for children, for fast-paced content, or when viewers are reading in a second language.',
      },
      PRIVATE_FAQ,
      ENCODING_FAQ,
    ],
    related: ['srt-to-txt', 'srt-to-vtt', 'lrc-to-srt'],
  },
  {
    slug: 'srt-to-vtt',
    from: 'srt',
    to: 'vtt',
    accept: '.srt',
    title: 'SRT to VTT Converter – Convert Subtitles to WebVTT',
    description:
      'Convert SRT subtitles to WebVTT (.vtt) for HTML5 video, web players and course platforms. Free, instant and private – files never leave your browser.',
    h1: 'SRT to VTT Converter',
    card: 'Get WebVTT captions for HTML5 video and web players.',
    lead:
      'Convert SubRip subtitles to WebVTT, the caption format browsers use for HTML5 video. Timings are kept to the millisecond and basic styling carries over.',
    options: [],
    steps: [
      'Paste your SRT subtitles or upload an .srt file.',
      'The WebVTT version appears instantly on the right.',
      'Download the .vtt file or copy it.',
    ],
    sections: [
      {
        h: 'What changes between SRT and VTT',
        html:
          '<ul>' +
          '<li>A <code>WEBVTT</code> header is added at the top of the file.</li>' +
          '<li>Commas in timestamps become dots: <code>00:00:01,000</code> becomes <code>00:00:01.000</code>.</li>' +
          '<li>Sequence numbers are left out &ndash; they are optional in WebVTT.</li>' +
          '<li>Bold, italic and underline tags are kept. <code>&lt;font&gt;</code> tags and <code>{\\an8}</code>-style codes are removed because WebVTT does not support them.</li>' +
          '<li>Characters WebVTT treats specially, <code>&amp;</code> and <code>&lt;</code>, are escaped so players display them correctly.</li>' +
          '</ul>',
      },
      {
        h: 'Why you need VTT for web video',
        html:
          '<p>The HTML <code>&lt;track&gt;</code> element only understands WebVTT, so a .vtt file is what you need to add captions to a video on your own website. Many web players and online course platforms ask for VTT for the same reason. Add it like this:</p>' +
          '<pre><code>&lt;video controls src="video.mp4"&gt;\n  &lt;track kind="captions" src="captions.vtt" srclang="en" label="English" default&gt;\n&lt;/video&gt;</code></pre>' +
          '<p>Serve the .vtt file from the same site as the page, or browsers will refuse to load it.</p>',
      },
    ],
    faq: [
      {
        q: 'Will my subtitle styling be kept?',
        a: 'Bold, italic and underline are kept. Font colours and positioning codes are not part of WebVTT, so they are removed. You can style captions on your site with the ::cue CSS selector instead.',
      },
      {
        q: 'Do I need to change anything for YouTube?',
        a: 'No. YouTube accepts both SRT and VTT uploads, so either file works there. VTT matters most for players you control yourself.',
      },
      PRIVATE_FAQ,
      ENCODING_FAQ,
    ],
    related: ['vtt-to-srt', 'srt-to-txt', 'txt-to-srt'],
  },
  {
    slug: 'vtt-to-srt',
    from: 'vtt',
    to: 'srt',
    accept: '.vtt',
    title: 'VTT to SRT Converter – Convert WebVTT Subtitles to SRT',
    description:
      'Convert WebVTT (.vtt) captions to SRT for video editors and media players. Cleans up cue settings, voice tags and comments. Runs fully in your browser.',
    h1: 'VTT to SRT Converter',
    card: 'Make WebVTT captions work in editors, TVs and media players.',
    lead:
      'Turn a WebVTT caption file into an SRT that video editors, TVs and media players can open. Cues are renumbered and WebVTT-only markup is cleaned up.',
    options: [],
    steps: [
      'Paste your WebVTT captions or upload a .vtt file.',
      'The SRT version appears instantly on the right.',
      'Download the .srt file or copy it.',
    ],
    sections: [
      {
        h: 'What the converter cleans up',
        html:
          '<ul>' +
          '<li>The <code>WEBVTT</code> header and any <code>NOTE</code>, <code>STYLE</code> and <code>REGION</code> blocks are removed.</li>' +
          '<li>Cue identifiers are replaced with sequence numbers starting at 1.</li>' +
          '<li>Timestamps get hours where they were missing and commas instead of dots: <code>01:02.500</code> becomes <code>00:01:02,500</code>.</li>' +
          '<li>Cue settings such as <code>align:start position:10%</code> are dropped.</li>' +
          '<li>Voice, class and language tags and karaoke timestamps are removed while their text is kept. Bold, italic and underline stay.</li>' +
          '<li>Entities such as <code>&amp;amp;</code> are turned back into normal characters.</li>' +
          '</ul>',
      },
      {
        h: 'About rolling auto-captions',
        html:
          '<p>Automatically generated captions often show each line twice while it scrolls up the screen. The SRT keeps every cue exactly as it appears in the original file, so the scrolling effect becomes repeated lines. If you only need the words, use the <a href="/srt-to-txt">subtitle to text converter</a> &ndash; it reads VTT files and removes the repeats.</p>',
      },
    ],
    faq: [
      {
        q: 'Is caption positioning preserved?',
        a: 'No. SRT has no standard way to position text, so WebVTT cue settings like align, line and position are removed. Most players show SRT subtitles centred at the bottom.',
      },
      {
        q: 'My file has no WEBVTT header. Will it still work?',
        a: 'Yes. The converter looks for the timing lines themselves, so files with a missing or unusual header still convert.',
      },
      PRIVATE_FAQ,
      ENCODING_FAQ,
    ],
    related: ['srt-to-vtt', 'srt-to-txt', 'lrc-to-srt'],
  },
  {
    slug: 'lrc-to-srt',
    from: 'lrc',
    to: 'srt',
    accept: '.lrc,.txt',
    title: 'LRC to SRT Converter – Turn Lyrics into Subtitles',
    description:
      'Convert LRC lyric files to SRT subtitles for lyric videos and karaoke edits. Handles offsets, repeated timestamps and word-level timing. Free and private.',
    h1: 'LRC to SRT Converter',
    card: 'Turn synced lyrics into subtitles for a lyric video.',
    lead:
      'Turn a synced lyrics file into subtitles you can drop onto a video timeline. Each lyric line becomes a subtitle that stays on screen until the next line starts.',
    options: [
      { type: 'number', id: 'lastDuration', label: 'Last line duration (seconds)', value: 4, min: 0.5, max: 60, step: 0.5, scale: 1000 },
    ],
    steps: [
      'Paste the contents of your .lrc file or upload it.',
      'Set how long the final line should stay on screen.',
      'Download the .srt file and add it to your video.',
    ],
    sections: [
      {
        h: 'How lyric timings become subtitles',
        html:
          '<p>An LRC line starts with a timestamp such as <code>[01:23.45]</code> but has no end time. The converter ends each line when the next one begins, so the lyrics flow without gaps. LRC files often use an empty timestamp line to clear the screen during an instrumental break; that empty line becomes the end of the subtitle before it. The final line lasts as long as you set in <strong>Last line duration</strong>.</p>',
      },
      {
        h: 'What else is handled',
        html:
          '<ul>' +
          '<li>The <code>[offset:]</code> tag is applied. A positive offset makes every line appear earlier, as the LRC format defines.</li>' +
          '<li>Lines with several timestamps, like <code>[00:30.00][01:45.00]</code> for a repeated chorus, become one subtitle at each time.</li>' +
          '<li>Word-level timestamps from enhanced LRC files, such as <code>&lt;00:12.30&gt;</code>, are removed and the words kept.</li>' +
          '<li>Lines that share a timestamp &ndash; often a lyric and its translation &ndash; are combined into one two-line subtitle.</li>' +
          '<li>Information tags such as <code>[ti:]</code>, <code>[ar:]</code> and <code>[al:]</code> are ignored.</li>' +
          '</ul>',
      },
    ],
    faq: [
      {
        q: 'Why does a line stay on screen through an instrumental break?',
        a: 'Because the LRC file has no empty timestamp at the start of the break, so the line lasts until the next lyric. Add a line with only a timestamp, like [01:10.00], where the break begins and convert again.',
      },
      {
        q: 'Can I convert subtitles back to LRC?',
        a: 'Yes, use the SRT to LRC converter. It uses each subtitle’s start time and marks pauses with empty lines.',
      },
      PRIVATE_FAQ,
      ENCODING_FAQ,
    ],
    related: ['srt-to-lrc', 'txt-to-srt', 'srt-to-vtt'],
  },
  {
    slug: 'srt-to-lrc',
    from: 'srt',
    to: 'lrc',
    accept: '.srt,.vtt',
    title: 'SRT to LRC Converter – Create Synced Lyrics from Subtitles',
    description:
      'Convert SRT subtitles to an LRC lyrics file for music players and karaoke apps. Multi-line subtitles are merged and pauses are marked. Free and private.',
    h1: 'SRT to LRC Converter',
    card: 'Create a synced lyrics file from subtitles.',
    lead:
      'Make a synced lyrics file from subtitles. Each subtitle’s start time becomes an LRC timestamp, so the words appear in time with the audio.',
    options: [{ type: 'checkbox', id: 'endMarkers', label: 'Mark pauses with an empty line', checked: true }],
    steps: [
      'Paste your SRT subtitles or upload an .srt file.',
      'Choose whether pauses should clear the current line.',
      'Download the .lrc file or copy it.',
    ],
    sections: [
      {
        h: 'How the conversion works',
        html:
          '<p>Each subtitle&rsquo;s start time becomes a timestamp in LRC&rsquo;s <code>[mm:ss.xx]</code> form, accurate to a hundredth of a second. Two-line subtitles are merged onto one line and formatting tags are removed, because LRC is plain text. LRC has no end times, so when there is a pause of half a second or more before the next subtitle &ndash; and after the last one &ndash; an empty timestamp line is added. Players then clear the lyric at the right moment instead of leaving it on screen.</p>',
      },
      {
        h: 'Long recordings',
        html:
          '<p>LRC timestamps have no hours field, so minutes simply keep counting: a line at 1 hour 15 minutes is written as <code>[75:00.00]</code>. Most players handle this fine.</p>',
      },
    ],
    faq: [
      {
        q: 'Will it create word-by-word timing?',
        a: 'No. Subtitles only carry timing for whole lines, so the LRC file is line-synced. Word-level (enhanced LRC) timing has to be added by hand or with a dedicated karaoke tool.',
      },
      {
        q: 'Can I use a VTT file instead of SRT?',
        a: 'Yes. Paste or upload a .vtt file and it converts the same way.',
      },
      PRIVATE_FAQ,
      ENCODING_FAQ,
    ],
    related: ['lrc-to-srt', 'srt-to-txt', 'srt-to-vtt'],
  },
];

export const home = {
  slug: '',
  from: 'auto',
  to: 'srt',
  accept: '.srt,.vtt,.lrc,.txt',
  title: 'Subtitle Converter – SRT, VTT, TXT & LRC Online, Free',
  description:
    'Free online subtitle converter for SRT, WebVTT, plain text and LRC lyrics. Detects the input format automatically and runs entirely in your browser.',
  h1: 'Subtitle Converter',
  lead:
    'Convert between SRT, VTT, TXT and LRC in one place. Paste or upload a file, pick the output format and download. Nothing is uploaded – it all happens in your browser.',
  sections: [
    {
      h: 'Supported formats',
      html:
        '<table><thead><tr><th>Format</th><th>Extension</th><th>Typical use</th></tr></thead><tbody>' +
        '<tr><td>SubRip</td><td><code>.srt</code></td><td>Video editors, YouTube, media players and TVs</td></tr>' +
        '<tr><td>WebVTT</td><td><code>.vtt</code></td><td>HTML5 video, web players and course platforms</td></tr>' +
        '<tr><td>Plain text</td><td><code>.txt</code></td><td>Transcripts, scripts and notes</td></tr>' +
        '<tr><td>LRC lyrics</td><td><code>.lrc</code></td><td>Synced lyrics in music players and karaoke apps</td></tr>' +
        '</tbody></table>',
    },
    {
      h: 'Private by design',
      html:
        '<p>Subtitles often contain unreleased scripts, interviews or client work. Every conversion on this site runs locally in your browser, so your files are never sent to a server, stored or logged. There is no sign-up and no limit on how many files you convert.</p>',
    },
  ],
  faq: [
    {
      q: 'Is the converter free?',
      a: 'Yes. Every converter on this site is free to use with no account and no limit on the number of files.',
    },
    {
      q: 'How does format detection work?',
      a: 'With Auto-detect selected, the converter looks at the text: a WEBVTT header or dotted timestamps means VTT, comma timestamps mean SRT, [mm:ss.xx] lines mean LRC, and anything else is treated as plain text. You can always pick the input format yourself.',
    },
    {
      q: 'Does it work on a phone?',
      a: 'Yes. The converters work in any modern mobile browser. Use the upload button to pick a file from your phone, then download or copy the result.',
    },
    PRIVATE_FAQ,
  ],
};

export const notFound = {
  slug: '404',
  title: 'Page not found',
  description: 'This page does not exist.',
  h1: 'Page not found',
  lead: 'The page you were looking for does not exist. Pick a converter below.',
};
