import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  convert, parseTimed, parseLrc, parseTxt, parseClock, detectFormat, splitLong, wrapTwoLines,
} from '../src/converter.js';

const SRT = `1
00:00:01,000 --> 00:00:03,500
Welcome back to the workshop.

2
00:00:03,800 --> 00:00:06,200
Today we edit a short
product video.

3
00:00:06,500 --> 00:00:09,000
<i>First, trim the opening shot.</i>
`;

test('parseClock handles SRT, VTT and short forms', () => {
  assert.equal(parseClock('00:00:01,000'), 1000);
  assert.equal(parseClock('01:02:03.456'), 3723456);
  assert.equal(parseClock('02:03.5'), 123500);
  assert.equal(parseClock('1:00:00,05'), 3600050);
  assert.ok(Number.isNaN(parseClock('nope')));
});

test('SRT -> VTT', () => {
  const { output, count } = convert(SRT, 'srt', 'vtt');
  assert.equal(count, 3);
  assert.equal(
    output,
    `WEBVTT

00:00:01.000 --> 00:00:03.500
Welcome back to the workshop.

00:00:03.800 --> 00:00:06.200
Today we edit a short
product video.

00:00:06.500 --> 00:00:09.000
<i>First, trim the opening shot.</i>
`,
  );
});

test('SRT with BOM, CRLF, ASS overrides, font tags and stray ampersands -> VTT', () => {
  const input = '﻿1\r\n00:00:01,000 --> 00:00:02,000\r\n{\\an8}<font color="#ff0">Tom & Jerry</font> say 5 < 6\r\n';
  const { output } = convert(input, 'srt', 'vtt');
  assert.equal(output, 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nTom &amp; Jerry say 5 &lt; 6\n');
});

test('VTT -> SRT drops header, NOTE, STYLE, ids, settings, voice tags and inline stamps', () => {
  const vtt = `WEBVTT - demo
Kind: captions
Language: en

STYLE
::cue { color: yellow }

NOTE This is a comment
that spans two lines

intro
00:01.000 --> 00:04.000 align:start position:10%
<v Host>Hello &amp; welcome</v>

00:00:04.500 --> 00:00:06.000
<c.loud>Two</c> <00:00:05.000><b>words</b>
`;
  const { output, count } = convert(vtt, 'vtt', 'srt');
  assert.equal(count, 2);
  assert.equal(
    output,
    `1
00:00:01,000 --> 00:00:04,000
Hello & welcome

2
00:00:04,500 --> 00:00:06,000
Two <b>words</b>
`,
  );
});

test('missing blank line between SRT cues still parses', () => {
  const messy = `1
00:00:01,000 --> 00:00:02,000
First line
2
00:00:02,500 --> 00:00:03,000
Second line`;
  const cues = parseTimed(messy);
  assert.deepEqual(
    cues.map((c) => c.text),
    ['First line', 'Second line'],
  );
});

test('SRT -> TXT, default lines with tags removed', () => {
  const { output } = convert(SRT, 'srt', 'txt');
  assert.equal(output, 'Welcome back to the workshop.\nToday we edit a short\nproduct video.\nFirst, trim the opening shot.\n');
});

test('SRT -> TXT without dedupe joins each cue onto one line', () => {
  const { output } = convert(SRT, 'srt', 'txt', { dedupe: false });
  assert.equal(output, 'Welcome back to the workshop.\nToday we edit a short product video.\nFirst, trim the opening shot.\n');
});

test('SRT -> TXT paragraphs and timestamps', () => {
  assert.equal(
    convert(SRT, 'srt', 'txt', { mode: 'paragraphs' }).output,
    'Welcome back to the workshop. Today we edit a short product video. First, trim the opening shot.\n',
  );
  assert.equal(
    convert(SRT, 'srt', 'txt', { timestamps: true }).output,
    '[00:00:01] Welcome back to the workshop.\n[00:00:03] Today we edit a short product video.\n[00:00:06] First, trim the opening shot.\n',
  );
});

test('rolling auto-captions are de-duplicated', () => {
  const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
good morning everyone
let's get started

00:00:02.000 --> 00:00:02.010
let's get started

00:00:02.010 --> 00:00:04.000
let's get started
the first topic is lighting
`;
  assert.equal(
    convert(vtt, 'vtt', 'txt').output,
    "good morning everyone\nlet's get started\nthe first topic is lighting\n",
  );
});

test('TXT -> SRT with reading-speed timing', () => {
  const { output } = convert('Hello there.\n\nThis line is a bit longer than the first one.', 'txt', 'srt', { cps: 17 });
  assert.equal(
    output,
    `1
00:00:00,000 --> 00:00:01,000
Hello there.

2
00:00:01,000 --> 00:00:03,588
This line is a bit longer
than the first one.
`,
  );
});

test('TXT -> SRT fixed timing, start offset and block mode', () => {
  const cues = parseTxt('Line one\nline two\n\nNext block', { split: 'block', timing: 'fixed', fixedSeconds: 2, startMs: 10000 });
  assert.deepEqual(cues, [
    { start: 10000, end: 12000, text: 'Line one\nline two' },
    { start: 12000, end: 14000, text: 'Next block' },
  ]);
});

test('long lines are split at sentence ends, then wrapped', () => {
  const long = 'We start with the wide shot of the studio. Then we move closer to the product on the table and slow down the camera.';
  const parts = splitLong(long, 84);
  assert.equal(parts[0], 'We start with the wide shot of the studio.');
  assert.ok(parts.every((p) => p.length <= 84));
  assert.equal(wrapTwoLines('This line is a bit longer than the first one.', 42), 'This line is a bit longer\nthan the first one.');
  assert.equal(wrapTwoLines('短句', 42), '短句');
});

const LRC = `[ti:Sample Song]
[ar:Demo Artist]
[offset:+500]
[00:01.50]Morning light on the window
[00:05.00][00:20.00]Coffee steaming by the door
[00:09.25]<00:09.25>Every <00:10.00>step feels lighter
[00:09.25]每一步都更轻
[00:13.00]
`;

test('LRC -> cues: offset, repeated stamps, word stamps, shared stamps, end markers', () => {
  const cues = parseLrc(LRC);
  assert.deepEqual(cues, [
    { start: 1000, end: 4500, text: 'Morning light on the window' },
    { start: 4500, end: 8750, text: 'Coffee steaming by the door' },
    { start: 8750, end: 12500, text: 'Every step feels lighter\n每一步都更轻' },
    { start: 19500, end: 23500, text: 'Coffee steaming by the door' },
  ]);
});

test('LRC -> SRT uses the last-line duration option', () => {
  const { output } = convert('[00:02.00]Only line', 'lrc', 'srt', { lastDuration: 2500 });
  assert.equal(output, '1\n00:00:02,000 --> 00:00:04,500\nOnly line\n');
});

test('SRT -> LRC adds end markers only at pauses', () => {
  const { output } = convert(SRT, 'srt', 'lrc');
  assert.equal(
    output,
    '[00:01.00]Welcome back to the workshop.\n[00:03.80]Today we edit a short product video.\n[00:06.50]First, trim the opening shot.\n[00:09.00]\n',
  );
  const noMarkers = convert(SRT, 'srt', 'lrc', { endMarkers: false }).output;
  assert.ok(!noMarkers.includes('[00:09.00]'));
});

test('long durations format correctly', () => {
  const cues = [{ start: 3723456, end: 3725000, text: 'Late line' }];
  const { output } = convert('1\n01:02:03,456 --> 01:02:05,000\nLate line\n', 'srt', 'lrc');
  assert.equal(output, '[62:03.46]Late line\n[62:05.00]\n');
  assert.equal(cues.length, 1);
});

test('detectFormat', () => {
  assert.equal(detectFormat(SRT), 'srt');
  assert.equal(detectFormat('WEBVTT\n\n00:01.000 --> 00:02.000\nhi'), 'vtt');
  assert.equal(detectFormat('00:01.000 --> 00:02.000\nhi'), 'vtt');
  assert.equal(detectFormat(LRC), 'lrc');
  assert.equal(detectFormat('just some words'), 'txt');
  assert.equal(detectFormat('   '), null);
});

test('empty or wrong input gives zero cues instead of throwing', () => {
  assert.deepEqual(convert('', 'srt', 'vtt'), { output: 'WEBVTT\n\n', count: 0 });
  assert.equal(convert('[00:01.00]lyric line', 'srt', 'txt').count, 0);
  assert.equal(convert('', 'txt', 'srt').output, '');
});
