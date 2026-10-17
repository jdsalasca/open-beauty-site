import { presets, styleSlugs } from './styles/presets.js';
import type { StyleSlug } from './types.js';

export const SKILL_FALLBACK = `# open-beauty-site skill

Use this workflow whenever you need to produce a beautiful HTML page, an animated 16:9 presentation or a GIF.

1. Call \`beauty_list_styles\` and choose one style. Do not mix styles.
2. Call \`beauty_get_style\` for that style and read the typography, palette and hard rules.
3. For a page, call \`beauty_create_page\` with a real title, tagline and 2–3 sections. For a presentation, call \`beauty_create_deck\` with 4–8 content slides and one subfamily. Never invent colors, fonts or border widths.
4. Call \`beauty_validate\` on the generated file. If the grade is below A, read the fixes and regenerate.
5. For motion, call \`beauty_create_gif\` with the same style and a short text.

Hard rules: no lorem ipsum, no emoji, no stock photos, no extra fonts, no purple gradients, one accent per screen, and every headline must be readable at 360px wide.
`;

export function styleGuideMarkdown(slug: StyleSlug): string {
  const preset = presets[slug];
  const colorRows = Object.entries(preset.palette)
    .map(([role, hex]) => `| ${role} | \`${hex}\` |`)
    .join('\n');
  const bullets = (items: string[]) => items.map((item) => `- ${item}`).join('\n');
  return `# ${preset.name} — ${preset.epithet}

${preset.description}

**Use it for:** ${preset.bestFor.join(', ')}.
**Avoid it for:** ${preset.avoid.join(', ')}.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | \`${preset.fonts.display}\` |
| Body font | \`${preset.fonts.body}\` |
| Mono/label font | \`${preset.fonts.mono}\` |
| Border widths | ${preset.rules.borderWidths.join(', ')} px |
| Border radius | ${preset.rules.radius[0]}–${preset.rules.radius[1]} px |
| Motion window | ${preset.rules.motion[0]}–${preset.rules.motion[1]} s |
| Shadow rule | ${preset.rules.shadow} |

## Palette (exact)

| Role | Hex |
| --- | --- |
${colorRows}

## Typography

${bullets(preset.guidance.typography)}

## Colour

${bullets(preset.guidance.color)}

## Layout

${bullets(preset.guidance.layout)}

## Motion

${bullets(preset.guidance.motion)}

## Imagery

${bullets(preset.guidance.imagery)}

## Copy voice

${bullets(preset.guidance.copy)}

## Never

${bullets(preset.guidance.dont)}

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
${(preset.subfamilies ?? []).map((sub) => `| \`${sub.slug}\` | ${sub.name} | ${sub.composition ?? 'sala'} | \`${sub.accent}\` | ${sub.description} |`).join('\n')}

## Signature moves

${bullets(preset.signature)}
`;
}

export function stylesOverview(): string {
  const lines = styleSlugs.map((slug) => {
    const preset = presets[slug];
    return `## ${preset.name} (\`${slug}\`)\n${preset.epithet}. ${preset.description}\n- Display: ${preset.fonts.display}\n- Use for: ${preset.bestFor.join(', ')}\n- Avoid for: ${preset.avoid.join(', ')}
- Subfamilies: ${(preset.subfamilies ?? []).map((sub) => `\`${sub.slug}\` (${sub.composition ?? 'sala'})`).join(', ')}`;
  });
  return `# open-beauty-site styles\n\n${lines.join('\n\n')}\n\nNext: call beauty_get_style with one slug.`;
}
