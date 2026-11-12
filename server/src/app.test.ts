import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { createApp } from './app.js';

// These checks run without a database: every guard below rejects before touching MongoDB.
let base = '';
let close: () => void;
before(async () => {
  const server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});
after(() => close());

test('health reports the database state', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.status, 503);
});

test('content requires sign-in', async () => {
  for (const path of ['/api/modules', '/api/search/index', '/api/users', '/api/audit']) {
    const r = await fetch(base + path);
    assert.equal(r.status, 401, path);
  }
});

test('state-changing requests need the CSRF header', async () => {
  const r = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403);
});

test('login validates input before any lookup', async () => {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'cms-guide' },
    body: JSON.stringify({ email: 'not-an-email', password: '' }),
  });
  assert.equal(r.status, 422);
});

test('security headers are set', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.ok(r.headers.get('content-security-policy')?.includes("default-src 'self'"));
  assert.equal(r.headers.get('x-powered-by'), null);
});
