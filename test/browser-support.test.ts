import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_BROWSER_TIMEOUT_MS,
  browserTimeoutMs,
  isBrowserTimeoutError,
  launchWithRetry,
} from '../src/browser.js';

test('browserTimeoutMs defaults to the documented value and honours BEAUTY_BROWSER_TIMEOUT_MS', () => {
  const previous = process.env.BEAUTY_BROWSER_TIMEOUT_MS;
  try {
    delete process.env.BEAUTY_BROWSER_TIMEOUT_MS;
    assert.equal(browserTimeoutMs(), DEFAULT_BROWSER_TIMEOUT_MS);
    process.env.BEAUTY_BROWSER_TIMEOUT_MS = '12345';
    assert.equal(browserTimeoutMs(), 12345);
    process.env.BEAUTY_BROWSER_TIMEOUT_MS = 'not-a-number';
    assert.equal(browserTimeoutMs(), DEFAULT_BROWSER_TIMEOUT_MS);
    process.env.BEAUTY_BROWSER_TIMEOUT_MS = '0';
    assert.equal(browserTimeoutMs(), DEFAULT_BROWSER_TIMEOUT_MS);
  } finally {
    if (previous === undefined) delete process.env.BEAUTY_BROWSER_TIMEOUT_MS;
    else process.env.BEAUTY_BROWSER_TIMEOUT_MS = previous;
  }
});

test('isBrowserTimeoutError flags timeouts but never assertion failures', () => {
  assert.equal(isBrowserTimeoutError(new Error('browserType.launch: Timeout 30000ms exceeded.')), true);
  assert.equal(isBrowserTimeoutError(new Error('page.goto: Timeout 15000ms exceeded.')), true);
  assert.equal(isBrowserTimeoutError(new Error('Navigation timed out')), true);
  assert.equal(isBrowserTimeoutError(new Error('Expected values to be strictly equal')), false);
  assert.equal(isBrowserTimeoutError('plain string error'), false);
});

test('launchWithRetry retries exactly once on a launch timeout', async () => {
  let calls = 0;
  const chromium = {
    async launch(): Promise<{ id: number }> {
      calls += 1;
      if (calls === 1) throw new Error('browserType.launch: Timeout 30000ms exceeded.');
      return { id: calls };
    },
  };
  const browser = await launchWithRetry(chromium, { headless: true });
  assert.equal(calls, 2);
  assert.deepEqual(browser, { id: 2 });
});

test('launchWithRetry does not retry a non-timeout launch failure', async () => {
  let calls = 0;
  const chromium = {
    async launch(): Promise<never> {
      calls += 1;
      throw new Error("Executable doesn't exist at C:\\missing\\chrome.exe");
    },
  };
  await assert.rejects(() => launchWithRetry(chromium, {}), /Executable doesn't exist/);
  assert.equal(calls, 1);
});
