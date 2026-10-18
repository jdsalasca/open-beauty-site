import assert from 'node:assert/strict';

/**
 * Shared contract helpers for the generated HTML. The generator is a string
 * template system, so instead of pulling an HTML parser dependency the tests
 * use a small, strict tag-balance checker plus document-level assertions.
 */

export const XSS_SCRIPT = '<script>alert(1)</script>';
export const XSS_TITLE = `"${XSS_SCRIPT}"`;
export const XSS_ATTR = '"><img src=x onerror=alert(2)>';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const RAW_TEXT_ELEMENTS = /<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/** Removes comments and raw-text element bodies (script/style/textarea). */
export function stripRawText(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(RAW_TEXT_ELEMENTS, '<$1 data-stripped></$1>');
}

/**
 * Returns a list of markup problems: unclosed or mismatched tags and stray
 * "<" in text. Void HTML elements and self-closing SVG/HTML tags are allowed.
 */
export function checkTagBalance(html: string): string[] {
  const source = stripRawText(html).replace(/<!doctype[^>]*>/gi, '');
  const errors: string[] = [];
  const stack: string[] = [];
  const tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(source))) {
    const between = source.slice(lastIndex, match.index);
    lastIndex = tagPattern.lastIndex;
    if (between.includes('<')) errors.push(`stray "<" in text: ${JSON.stringify(between.slice(0, 60))}`);
    const closing = match[1] === '/';
    const name = match[2]!.toLowerCase();
    const selfClosing = match[4] === '/';
    if (closing) {
      const open = stack.pop();
      if (open !== name) errors.push(`mismatched </${name}> (open: <${open ?? 'none'}>)`);
    } else if (!selfClosing && !VOID_ELEMENTS.has(name)) {
      stack.push(name);
    }
  }
  const tail = source.slice(lastIndex);
  if (tail.includes('<')) errors.push(`stray "<" after the last tag: ${JSON.stringify(tail.slice(0, 60))}`);
  if (stack.length) errors.push(`unclosed tags: ${stack.join(', ')}`);
  return errors;
}

export interface DocumentFacts {
  htmlCount: number;
  lang: string | null;
  title: string | null;
  viewportCount: number;
  viewport: string | null;
  h1Count: number;
}

export function documentFacts(html: string): DocumentFacts {
  return {
    htmlCount: (html.match(/<html[\s>]/gi) ?? []).length,
    lang: /<html\b[^>]*\blang="([^"]*)"/i.exec(html)?.[1] ?? null,
    title: /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? null,
    viewportCount: (html.match(/<meta\s+name="viewport"/gi) ?? []).length,
    viewport: /<meta\s+name="viewport"\s+content="([^"]*)"/i.exec(html)?.[1] ?? null,
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
  };
}

/** Template placeholders that would mean a generator left data unresolved. */
export function findTemplateLeaks(html: string): string[] {
  return ['{{', '${', 'undefined', 'NaN', '[object Object]'].filter((token) => html.includes(token));
}

/** Empty href/src attributes, scanned outside script/style bodies. */
export function findEmptyUrls(html: string): string[] {
  const markup = stripRawText(html);
  const found: string[] = [];
  for (const match of markup.matchAll(/\b(href|src)\s*=\s*"([^"]*)"/gi)) {
    if (match[2]!.trim().length === 0) found.push(match[0]);
  }
  return found;
}

export interface ContractOptions {
  label: string;
  locale?: string;
}

/** Asserts the shared document contract for standalone generated pages. */
export function assertDocumentContract(html: string, { label, locale }: ContractOptions): void {
  assert.match(html, /^<!doctype html>/i, `${label}: missing doctype`);
  const facts = documentFacts(html);
  assert.equal(facts.htmlCount, 1, `${label}: expected exactly one <html> tag`);
  assert.ok(facts.lang, `${label}: missing <html lang>`);
  if (locale) assert.equal(facts.lang, locale, `${label}: wrong lang`);
  assert.ok(facts.title && facts.title.trim().length > 0, `${label}: missing or empty <title>`);
  assert.equal(facts.viewportCount, 1, `${label}: expected exactly one viewport meta`);
  assert.match(facts.viewport ?? '', /width=device-width/, `${label}: viewport without width=device-width`);
  assert.equal(facts.h1Count, 1, `${label}: expected exactly one <h1>, got ${facts.h1Count}`);
  assert.deepEqual(checkTagBalance(html), [], `${label}: malformed markup`);
  assert.deepEqual(findTemplateLeaks(html), [], `${label}: unresolved template placeholders`);
  assert.deepEqual(findEmptyUrls(html), [], `${label}: empty href/src attributes`);
}

/** Asserts that none of the injected payloads survived unescaped. */
export function assertInjectionSafe(html: string, label: string): void {
  assert.ok(!html.includes(XSS_SCRIPT), `${label}: raw <script> payload leaked`);
  assert.ok(!/onmouseover\s*=\s*["']?alert/i.test(html), `${label}: event-handler injection leaked`);
  assert.ok(!/<img\s+src=x\s+onerror/i.test(html), `${label}: img onerror injection leaked`);
  assert.ok(!html.includes('javascript:'), `${label}: javascript: href leaked`);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), `${label}: payload was not escaped in the document`);
}
