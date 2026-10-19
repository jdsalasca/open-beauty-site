import { createCanvas } from '@napi-rs/canvas';
import type { NarrativeScene } from '../../src/types/narrative.js';

/** Deliberately small harness fixture; it is never registered or exported as a production style. */
export const testNarrativeScene: NarrativeScene = {
  style: 'papercraft',
  version: 'test-paper-object/1',
  supportsAspect: (ratio) => [16 / 9, 1, 9 / 16].some((target) => Math.abs(ratio - target) / target < 0.015),
  createObject: (_brief, rng) => ({ identity: 'same-paper-document', variation: Math.floor(rng() * 1_000) }),
  renderFrame: ({ brief, frame, object, safeBoxes }) => {
    const width = brief.output.width;
    const height = brief.output.height;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const stampColor = ['#AF3F2F', '#2D5D53', '#B58432'][frame.phaseIndex % 3]!;
    const variation = (object as { variation: number }).variation % 4;
    const art = safeBoxes.art;
    const x = art.x + art.width * (0.18 + variation * 0.01) + (frame.kind === 'transition' || frame.kind === 'loop-bridge' ? frame.progress * 8 : 0);
    const y = art.y + art.height * 0.16;
    const cardWidth = art.width * 0.62;
    const cardHeight = art.height * 0.64;
    ctx.fillStyle = '#FFF8EA';
    ctx.fillRect(x, y, cardWidth, cardHeight);
    ctx.strokeStyle = '#2B211B';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardWidth, cardHeight);
    ctx.fillStyle = `${stampColor}99`;
    ctx.fillRect(x + cardWidth * 0.18, y + cardHeight * 0.32, cardWidth * 0.64, cardHeight * 0.28);
    ctx.fillStyle = stampColor;
    ctx.beginPath();
    ctx.arc(x + cardWidth * 0.5, y + cardHeight * 0.46, 12 + variation, 0, Math.PI * 2);
    ctx.fill();
    return ctx.getImageData(0, 0, width, height).data;
  },
};
