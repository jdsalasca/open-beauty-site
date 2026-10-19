/**
 * Shared browser policy for the visual/geometry audits and the browser test
 * suites. `BEAUTY_BROWSER_TIMEOUT_MS` overrides the documented default and
 * bounds every Playwright launch and navigation, so a loaded machine reports a
 * real timeout instead of hanging. `launchWithRetry` retries a launch exactly
 * once when the launch itself times out; assertion failures happen later and
 * are never retried.
 */
export const DEFAULT_BROWSER_TIMEOUT_MS = 60_000;

export function browserTimeoutMs(): number {
  const raw = process.env.BEAUTY_BROWSER_TIMEOUT_MS;
  if (raw === undefined || raw.trim() === '') return DEFAULT_BROWSER_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BROWSER_TIMEOUT_MS;
}

const TIMEOUT_MESSAGE = /timeout|timed out|ETIMEDOUT/i;

export function isBrowserTimeoutError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TIMEOUT_MESSAGE.test(message);
}

export interface Launchable<B> {
  launch(options?: { headless?: boolean; timeout?: number }): Promise<B>;
}

/** Launches Chromium, retrying exactly once when the launch itself times out. */
export async function launchWithRetry<B>(
  chromium: Launchable<B>,
  options: { headless?: boolean; timeout?: number } = {},
): Promise<B> {
  const launchOptions = {
    headless: options.headless ?? true,
    timeout: options.timeout ?? browserTimeoutMs(),
  };
  try {
    return await chromium.launch(launchOptions);
  } catch (error) {
    if (!isBrowserTimeoutError(error)) throw error;
    return await chromium.launch(launchOptions);
  }
}
