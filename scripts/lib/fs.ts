import { mkdir, writeFile } from 'node:fs/promises';

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export function writeTextFile(file: string, contents: string): Promise<void> {
  return writeFile(file, contents, 'utf8');
}
