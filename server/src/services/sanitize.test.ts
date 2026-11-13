import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAllowedEmbedHost, toEmbedUrl } from '@cms/shared';
import { htmlToText, sanitizeRich } from './sanitize.js';
import { changedFields } from './versioning.js';

test('sanitizeRich strips scripts, handlers and javascript: links', () => {
  const out = sanitizeRich('<p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><img src="x" onerror="y">');
  assert.ok(!out.includes('script'));
  assert.ok(!out.includes('onclick'));
  assert.ok(!out.includes('onerror'));
  assert.ok(!out.includes('javascript:'));
});

test('sanitizeRich keeps callouts with known types only', () => {
  assert.equal(sanitizeRich('<div data-callout="tip"><p>a</p></div>'), '<div data-callout="tip"><p>a</p></div>');
  assert.equal(sanitizeRich('<div data-callout="evil" class="x"><p>a</p></div>'), '<div><p>a</p></div>');
});

test('links open in a new tab safely', () => {
  assert.match(sanitizeRich('<a href="https://x.com">x</a>'), /rel="noopener noreferrer nofollow"/);
});

test('htmlToText flattens markup', () => {
  assert.equal(htmlToText('<h3>Title</h3><p>Body &amp; more</p>'), 'Title Body & more');
});

test('embed URLs are normalised and restricted', () => {
  assert.equal(toEmbedUrl('https://www.youtube.com/watch?v=abc123'), 'https://www.youtube-nocookie.com/embed/abc123');
  assert.equal(toEmbedUrl('https://youtu.be/abc123'), 'https://www.youtube-nocookie.com/embed/abc123');
  assert.equal(toEmbedUrl('https://vimeo.com/12345'), 'https://player.vimeo.com/video/12345');
  assert.equal(toEmbedUrl('https://evil.com/watch?v=1'), null);
  assert.equal(isAllowedEmbedHost('https://notyoutube.com'), false);
  assert.equal(isAllowedEmbedHost('https://airtel.sharepoint.com/x'), true);
});

test('changedFields reports top-level differences', () => {
  assert.deepEqual(changedFields({ a: 1, b: [1] }, { a: 1, b: [2], c: 'x' }), ['b', 'c']);
});

test('modulePath sends lifecycle stages to the lifecycle page', async () => {
  const { modulePath, withPreview } = await import('@cms/shared');
  assert.equal(modulePath('lifecycle', 'plan-inventory-validation'), '/lifecycle?stage=plan-inventory-validation');
  assert.equal(modulePath(undefined, 'mop-creation'), '/lifecycle?stage=mop-creation');
  assert.equal(modulePath('lifecycle', 'mop-creation', 'attach-rollback-plan'), '/modules/mop-creation/attach-rollback-plan');
  assert.equal(modulePath('configuration', 'roster'), '/configuration/roster');
  assert.equal(modulePath('configuration', 'roster', 'view-the-team-roster'), '/configuration/roster/view-the-team-roster');
  assert.equal(withPreview('/lifecycle?stage=x'), '/lifecycle?stage=x&preview=1');
  assert.equal(withPreview('/configuration/roster#faq-1'), '/configuration/roster?preview=1#faq-1');
  assert.equal(withPreview('/a', false), '/a');
});
