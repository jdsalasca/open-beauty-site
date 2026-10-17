import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BeautyError } from './page/common.js';

/** Resolve the package root from both src/ (tsx) and dist/ (compiled). */
export function packageRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(path.join(dir, 'fonts')) && existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new BeautyError('Could not locate the bundled fonts directory.', 'FONTS_NOT_FOUND');
}
