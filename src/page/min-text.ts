/**
 * Static readability guard: raises computed text below the phone minimum with
 * one trailing media block, so desktop micro-labels keep their designed size
 * while a 360px viewport never renders copy under `minPx`.
 *
 * The parser walks flat CSS rules (recursing into width media queries that can
 * apply at 360px) and looks at `font-size` declarations and the size token of
 * the `font` shorthand. It resolves px, rem/em against a 16px root, the minimum
 * of `clamp()`, `min()`/`max()` and simple `calc()` arithmetic. Keyframes, print
 * queries and desktop-only media queries are ignored, and the effective value
 * follows cascade order (a later phone rule above the minimum wins).
 */

export interface MinTextOptions {
  minPx?: number;
  maxWidth?: number;
}

const ROOT_PX = 16;
const VIEWPORT_PX = 360;
const MAX_LETTER_SPACING_EM = 0.08;
const EPSILON = 0.001;

type SizeKey = 'size' | 'spacing';

interface Declaration {
  selector: string;
  key: SizeKey;
  /** Resolved px for `size`, em for `spacing`; null when it cannot be resolved. */
  value: number | null;
  /** True when the containing media queries can apply at a 360px viewport. */
  applies: boolean;
  order: number;
}

interface WalkState {
  order: number;
  declarations: Declaration[];
}

function stringEnd(css: string, start: number): number {
  const quote = css[start];
  let index = start + 1;
  while (index < css.length) {
    const char = css[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === quote) return index + 1;
    index += 1;
  }
  return css.length;
}

function matchingBrace(css: string, open: number): number {
  let depth = 0;
  let index = open;
  while (index < css.length) {
    const char = css[index];
    if (char === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2);
      index = end < 0 ? css.length : end + 2;
      continue;
    }
    if (char === '"' || char === "'") {
      index = stringEnd(css, index);
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
    index += 1;
  }
  return css.length;
}

function splitTopLevel(value: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let index = 0;
  while (index < value.length) {
    const char = value[index]!;
    if (char === '"' || char === "'") {
      const end = stringEnd(value, index);
      current += value.slice(index, end);
      index = end;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    const isSeparator = separator === ' ' ? /\s/.test(char) : char === separator;
    if (depth === 0 && isSeparator) {
      if (current) parts.push(current);
      current = '';
    } else {
      current += char;
    }
    index += 1;
  }
  if (current) parts.push(current);
  return parts;
}

function cleanValue(raw: string): string {
  return raw.replace(/!important/gi, '').trim().toLowerCase();
}

function plainLength(value: string): number | null {
  const match = /^(-?\d*\.?\d+)(px|rem|em|pt)?$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  switch (match[2]) {
    case 'px':
      return amount;
    case 'rem':
    case 'em':
      return amount * ROOT_PX;
    case 'pt':
      return (amount * 4) / 3;
    default:
      // A unitless font-size is only valid as 0.
      return amount === 0 ? 0 : null;
  }
}

interface CalcToken {
  value: number;
  unit: boolean;
}

function calcTokens(expr: string): Array<{ type: 'number'; token: CalcToken } | { type: 'op'; op: string } | { type: 'paren'; paren: '(' | ')' }> | null {
  const tokens: ReturnType<typeof calcTokens> = [];
  let index = 0;
  while (index < expr.length) {
    const char = expr[index]!;
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'op', op: char });
      index += 1;
      continue;
    }
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', paren: char });
      index += 1;
      continue;
    }
    const match = /^(\d*\.?\d+)(px|rem|em|pt)?/.exec(expr.slice(index));
    if (!match) return null;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return null;
    const unit = match[2];
    const value = unit === undefined ? amount : unit === 'px' ? amount : unit === 'pt' ? (amount * 4) / 3 : amount * ROOT_PX;
    tokens.push({ type: 'number', token: { value, unit: unit !== undefined } });
    index += match[0].length;
  }
  return tokens;
}

/** Simple `calc()` evaluator: + and - of terms with optional * and / by unitless numbers. */
function evalCalc(expr: string): number | null {
  const tokens = calcTokens(expr);
  if (!tokens) return null;
  let cursor = 0;

  const peek = (): (typeof tokens)[number] | undefined => tokens[cursor];
  const next = (): (typeof tokens)[number] | undefined => tokens[cursor++];

  const factor = (): CalcToken | null => {
    const token = next();
    if (!token) return null;
    if (token.type === 'number') return token.token;
    if (token.type === 'paren' && token.paren === '(') {
      const inner = sum();
      const close = next();
      if (!inner || !close || close.type !== 'paren' || close.paren !== ')') return null;
      return inner;
    }
    return null;
  };

  const product = (): CalcToken | null => {
    let left = factor();
    if (!left) return null;
    for (;;) {
      const token = peek();
      if (!token || token.type !== 'op' || (token.op !== '*' && token.op !== '/')) return left;
      next();
      const right = factor();
      if (!right) return null;
      if (token.op === '*') {
        if (left.unit && right.unit) return null;
        left = { value: left.value * right.value, unit: left.unit || right.unit };
      } else {
        if (right.unit) return null;
        left = { value: left.value / right.value, unit: left.unit };
      }
      if (!Number.isFinite(left.value)) return null;
    }
  };

  const sum = (): CalcToken | null => {
    let left = product();
    if (!left) return null;
    for (;;) {
      const token = peek();
      if (!token || token.type !== 'op' || (token.op !== '+' && token.op !== '-')) return left;
      next();
      const right = product();
      if (!right) return null;
      left = { value: token.op === '+' ? left.value + right.value : left.value - right.value, unit: left.unit };
      if (!Number.isFinite(left.value)) return null;
    }
  };

  const result = sum();
  if (!result || cursor !== tokens.length) return null;
  return result.unit ? result.value : null;
}

/** Resolve a length expression to px, or null when it depends on the viewport. */
function resolveLength(value: string): number | null {
  const lowered = cleanValue(value);
  if (!lowered) return null;
  const fn = /^(calc|clamp|min|max)\(([\s\S]*)\)$/.exec(lowered);
  if (fn) {
    const name = fn[1]!;
    if (name === 'calc') return evalCalc(fn[2]!);
    const args = splitTopLevel(fn[2]!, ',');
    if (name === 'clamp') return args.length ? resolveLength(args[0]!) : null;
    const values = args.map(resolveLength).filter((item): item is number => item !== null);
    if (!values.length) return null;
    return name === 'min' ? Math.min(...values) : Math.max(...values);
  }
  return plainLength(lowered);
}

function fontShorthandSize(value: string): number | null {
  for (const token of splitTopLevel(value, ' ')) {
    const size = token.replace(/\/.*$/, '');
    const shaped = /^(calc|clamp|min|max)\(/.test(size) || /^\d*\.?\d+(px|rem|em|pt)$/.test(size);
    if (shaped) return resolveLength(size);
  }
  return null;
}

function letterSpacingEm(value: string): number | null {
  const lowered = cleanValue(value);
  if (lowered === 'normal') return 0;
  const match = /^(-?\d*\.?\d+)em$/.exec(lowered);
  return match ? Number(match[1]) : null;
}

function ruleDeclarations(selector: string, body: string, applies: boolean, state: WalkState): void {
  const push = (key: SizeKey, value: number | null): void => {
    state.order += 1;
    state.declarations.push({ selector, key, value, applies, order: state.order });
  };
  for (const declaration of splitTopLevel(body, ';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1);
    if (property === 'font-size') push('size', resolveLength(value));
    else if (property === 'font') push('size', fontShorthandSize(value));
    else if (property === 'letter-spacing') push('spacing', letterSpacingEm(value));
  }
}

function widthMediaApplies(condition: string, viewport: number): boolean {
  const lowered = condition.toLowerCase();
  if (/\bprint\b/.test(lowered)) return false;
  for (const match of lowered.matchAll(/\(\s*(min|max)-width\s*:\s*([\d.]+)px\s*\)/g)) {
    const bound = Number(match[2]);
    if (!Number.isFinite(bound)) continue;
    if (match[1] === 'min' && bound > viewport) return false;
    if (match[1] === 'max' && bound < viewport) return false;
  }
  return true;
}

function mediaApplies(prelude: string, viewport: number): boolean {
  const condition = prelude.replace(/^@media\s*/i, '');
  return splitTopLevel(condition, ',').some((query) => widthMediaApplies(query, viewport));
}

function walk(css: string, applies: boolean, state: WalkState): void {
  let index = 0;
  let preludeStart = 0;
  while (index < css.length) {
    const char = css[index]!;
    if (char === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2);
      index = end < 0 ? css.length : end + 2;
      continue;
    }
    if (char === '"' || char === "'") {
      index = stringEnd(css, index);
      continue;
    }
    if (char === '{') {
      const prelude = css.slice(preludeStart, index).replace(/\s+/g, ' ').trim();
      const close = matchingBrace(css, index);
      const body = css.slice(index + 1, close);
      if (prelude.startsWith('@')) {
        const lowered = prelude.toLowerCase();
        const skipped = /^@(-\w+-)?keyframes\b/.test(lowered) || /^@(font-face|page|property|counter-style|viewport|charset|namespace|import)\b/.test(lowered);
        if (!skipped) {
          const nested = lowered.startsWith('@media') ? applies && mediaApplies(prelude, VIEWPORT_PX) : applies;
          walk(body, nested, state);
        }
      } else if (prelude) {
        ruleDeclarations(prelude, body, applies, state);
      }
      index = close + 1;
      preludeStart = index;
      continue;
    }
    if (char === ';' || char === '}') {
      index += 1;
      preludeStart = index;
      continue;
    }
    index += 1;
  }
}

/**
 * Append one `@media (max-width:maxWidth)` block raising every selector whose
 * effective font-size would render below `minPx`. Returns the input untouched
 * when nothing needs raising, so the transform is idempotent.
 */
export function ensureMinTextSize(css: string, options: MinTextOptions = {}): string {
  const minPx = options.minPx ?? 12;
  const maxWidth = options.maxWidth ?? 720;
  const state: WalkState = { order: 0, declarations: [] };
  walk(css, true, state);

  const effective = new Map<string, { size: number | null; spacing: number | null }>();
  for (const declaration of state.declarations) {
    if (!declaration.applies) continue;
    const entry = effective.get(declaration.selector) ?? { size: null, spacing: null };
    entry[declaration.key] = declaration.value;
    effective.set(declaration.selector, entry);
  }

  const rules: string[] = [];
  for (const [selector, entry] of effective) {
    if (entry.size === null || entry.size >= minPx - EPSILON) continue;
    // Letter-spaced uppercase micro-labels get their tracking tightened on
    // phones; the taller glyphs no longer need the global break-anywhere rule,
    // which splits hyphenated names in two lines (the validator's
    // mid-word-break). Both knobs mirror the product's own repair patches.
    const micro = (entry.spacing ?? 0) > MAX_LETTER_SPACING_EM + EPSILON;
    const compact = micro ? ';letter-spacing:.08em;overflow-wrap:normal;word-break:normal' : '';
    rules.push(`${selector}{font-size:${minPx}px${compact}}`);
  }
  if (!rules.length) return css;
  return `${css}\n@media (max-width:${maxWidth}px){${rules.join('')}}`;
}

/** Apply {@link ensureMinTextSize} to every `<style>` block of an HTML document. */
export function ensureMinTextSizeInHtml(html: string, options: MinTextOptions = {}): string {
  return html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, css: string) => {
    const next = ensureMinTextSize(css, options);
    if (next === css) return match;
    return `${match.slice(0, match.length - css.length - '</style>'.length)}${next}</style>`;
  });
}
