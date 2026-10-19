import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createNarrativeGallery } from '../src/narrative/gallery.js';

test('generated gallery shows review state and open feedback links from manifest data', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'beauty-review-gallery-'));
  try {
    const packDir = path.join(root, 'pack');
    await mkdir(path.join(packDir, 'example.frames'), { recursive: true });
    for (const name of ['example.gif', 'example.png', 'example-contact-sheet.png', 'example.frames/frame-0001.png', 'example.frames/feedback-note-1-crop.png']) {
      await writeFile(path.join(packDir, name), Buffer.from('placeholder'));
    }
    await writeFile(path.join(packDir, 'example.manifest.json'), JSON.stringify({
      schemaVersion: 3,
      brief: { style: 'papercraft', title: 'Fila pendiente', phases: [{ visual: { kind: 'table-rows' } }] },
      workflowStatus: 'in-review', dimensions: { width: 640, height: 360 },
      files: { gif: 'example.gif', png: 'example.png', contactSheet: 'example-contact-sheet.png' },
      reviewState: 'revise', openFeedbackCount: 1,
      feedbackFrames: [{ id: 'note-1', phaseId: 'before', frameIndex: 1, problem: 'Fila duplicada difícil de leer.', severity: 'major', framePath: 'example.frames/frame-0001.png', cropPath: 'example.frames/feedback-note-1-crop.png' }],
      evaluation: { 'visual-review': { status: 'revise' } },
    }), 'utf8');

    const output = path.join(root, 'review.html');
    await createNarrativeGallery({ directory: packDir, output });
    const html = await readFile(output, 'utf8');
    assert.match(html, /Revisión visual: Requiere ajustes/);
    assert.match(html, /Fila duplicada difícil de leer\./);
    assert.match(html, /example\.frames\/frame-0001\.png/);
    assert.match(html, /example\.frames\/feedback-note-1-crop\.png/);
    assert.match(html, /1 comentario abierto/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
