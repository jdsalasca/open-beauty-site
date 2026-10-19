import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface VerifiedGifFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  delayMs: number;
  disposal: number;
  transparent: boolean;
}

export interface VerifiedGifPixelFrame {
  index: number;
  /** Full composited RGB raster decoded from the exported GIF. */
  rgb: Uint8Array;
}

export interface VerifiedGif {
  width: number;
  height: number;
  frames: VerifiedGifFrame[];
  delaysMs: number[];
  durationMs: number;
  loopCount: number | null;
  integrity: { valid: boolean; errors: string[] };
  sampledFrames: VerifiedGifPixelFrame[];
}

export interface FfprobeCrosscheck {
  available: boolean;
  passed: boolean | null;
  detail: string;
}

/** Cross-checks container metadata independently; an absent ffprobe is reported, not treated as a failure. */
export async function crossCheckWithFfprobe(file: string, expected: VerifiedGif): Promise<FfprobeCrosscheck> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,duration', '-of', 'json', file],
      { encoding: 'utf8', windowsHide: true, timeout: 5_000, maxBuffer: 1_048_576 },
    ));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { available: false, passed: null, detail: 'ffprobe is not installed; independent LZW decode remains the integrity check.' };
    }
    return { available: true, passed: false, detail: `ffprobe could not read the encoded GIF: ${(error as Error).message}` };
  }

  try {
    const parsed = JSON.parse(stdout) as { streams?: Array<Record<string, unknown>> };
    const stream = parsed.streams?.[0];
    const width = Number(stream?.width);
    const height = Number(stream?.height);
    const frameCount = Number(stream?.nb_frames);
    const durationMs = Number(stream?.duration) * 1000;
    const complete = [width, height, frameCount, durationMs].every(Number.isFinite);
    const passed = complete
      && width === expected.width
      && height === expected.height
      && frameCount === expected.frames.length
      && Math.abs(durationMs - expected.durationMs) <= 10;
    return {
      available: true,
      passed,
      detail: complete
        ? `ffprobe ${width}×${height}; ${frameCount} frames; ${Math.round(durationMs)}ms; ${passed ? 'matches' : 'does not match'} the independent LZW decode.`
        : 'ffprobe did not report dimensions, frame count and duration needed for a complete cross-check.',
    };
  } catch (error) {
    return { available: true, passed: false, detail: `ffprobe returned invalid metadata: ${(error as Error).message}` };
  }
}

function u16(data: Uint8Array, at: number): number {
  return (data[at] ?? 0) | ((data[at + 1] ?? 0) << 8);
}

function readSubBlocks(data: Uint8Array, start: number): { bytes: Uint8Array; next: number } {
  const chunks: Uint8Array[] = [];
  let length = 0;
  let at = start;
  while (at < data.length && data[at] !== 0) {
    const size = data[at]!;
    if (at + 1 + size > data.length) throw new Error('truncated GIF data sub-block');
    const chunk = data.subarray(at + 1, at + 1 + size);
    chunks.push(chunk);
    length += size;
    at += size + 1;
  }
  if (at >= data.length) throw new Error('GIF data sub-block terminator is missing');
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return { bytes, next: at + 1 };
}

/** Independent LZW decoder used for integrity checks on the encoded file. */
function decodeLzw(data: Uint8Array, minimumCodeSize: number, expectedPixels: number, keepPixels: boolean): { count: number; pixels?: Uint8Array } {
  if (minimumCodeSize < 2 || minimumCodeSize > 8) throw new Error(`invalid GIF LZW minimum code size ${minimumCodeSize}`);
  const clear = 1 << minimumCodeSize;
  const end = clear + 1;
  let dictionary: Uint8Array[] = [];
  let codeSize = minimumCodeSize + 1;
  let previous: Uint8Array | undefined;
  let bitOffset = 0;
  let outputPixels = 0;
  const pixels = keepPixels ? new Uint8Array(expectedPixels) : undefined;
  const reset = () => {
    dictionary = Array.from({ length: clear }, (_, index) => Uint8Array.of(index));
    dictionary.push(new Uint8Array(), new Uint8Array());
    codeSize = minimumCodeSize + 1;
    previous = undefined;
  };
  const readCode = (): number => {
    let value = 0;
    for (let bit = 0; bit < codeSize; bit += 1) {
      const byteAt = bitOffset >> 3;
      if (byteAt >= data.length) throw new Error('truncated GIF LZW stream');
      value |= ((data[byteAt]! >> (bitOffset & 7)) & 1) << bit;
      bitOffset += 1;
    }
    return value;
  };
  reset();
  let ended = false;
  while (bitOffset < data.length * 8) {
    const code = readCode();
    if (code === clear) {
      reset();
      continue;
    }
    if (code === end) {
      ended = true;
      break;
    }
    let word: Uint8Array;
    if (code < dictionary.length) word = dictionary[code]!;
    else if (code === dictionary.length && previous) {
      word = new Uint8Array(previous.length + 1);
      word.set(previous);
      word[word.length - 1] = previous[0]!;
    } else {
      throw new Error(`invalid GIF LZW code ${code}`);
    }
    const writeAt = outputPixels;
    outputPixels += word.length;
    if (outputPixels > expectedPixels) throw new Error(`GIF LZW produced more than ${expectedPixels} pixels`);
    pixels?.set(word, writeAt);
    if (previous) {
      const entry = new Uint8Array(previous.length + 1);
      entry.set(previous);
      entry[entry.length - 1] = word[0]!;
      dictionary.push(entry);
      if (dictionary.length === 1 << codeSize && codeSize < 12) codeSize += 1;
    }
    previous = word;
  }
  if (!ended) throw new Error('GIF LZW end code is missing');
  return { count: outputPixels, ...(pixels ? { pixels } : {}) };
}

function paletteColor(palette: Uint8Array, index: number, errors: string[], frameIndex: number): [number, number, number] {
  const offset = index * 3;
  if (offset + 2 >= palette.length) {
    errors.push(`frame ${frameIndex} references color index ${index} outside its palette`);
    return [0, 0, 0];
  }
  return [palette[offset]!, palette[offset + 1]!, palette[offset + 2]!];
}

export function verifyNarrativeGif(data: Uint8Array, sampleFrameIndices: number[] = []): VerifiedGif {
  const errors: string[] = [];
  if (data.length < 13) throw new Error('GIF is shorter than its logical screen descriptor');
  const signature = String.fromCharCode(...data.subarray(0, 6));
  if (signature !== 'GIF89a' && signature !== 'GIF87a') throw new Error(`invalid GIF header "${signature}"`);
  const width = u16(data, 6);
  const height = u16(data, 8);
  if (width === 0 || height === 0) errors.push(`invalid logical screen ${width}×${height}`);
  const packed = data[10]!;
  let offset = 13;
  let globalPaletteSize = 0;
  let globalPalette: Uint8Array<ArrayBufferLike> = new Uint8Array();
  if (packed & 0x80) {
    globalPaletteSize = 3 * 2 ** ((packed & 0x07) + 1);
    globalPalette = data.subarray(offset, offset + globalPaletteSize);
    offset += globalPaletteSize;
  }
  if (offset > data.length) throw new Error('truncated GIF global palette');
  let delayMs = 0;
  let disposal = 0;
  let transparent = false;
  let transparentIndex: number | null = null;
  let loopCount: number | null = null;
  let trailerFound = false;
  const frames: VerifiedGifFrame[] = [];
  const sampleSet = new Set(sampleFrameIndices);
  const sampledFrames: VerifiedGifPixelFrame[] = [];
  const screenPixels = sampleSet.size ? new Uint8Array(width * height * 3) : undefined;
  const background = globalPalette.length && data[11]! * 3 + 2 < globalPalette.length
    ? paletteColor(globalPalette, data[11]!, errors, -1)
    : [0, 0, 0] as [number, number, number];
  if (screenPixels) {
    for (let offset = 0; offset < screenPixels.length; offset += 3) screenPixels.set(background, offset);
  }
  let previousFrame: VerifiedGifFrame | undefined;
  let previousRestore: Uint8Array | undefined;

  while (offset < data.length) {
    const marker = data[offset]!;
    if (marker === 0x3b) {
      trailerFound = true;
      offset += 1;
      break;
    }
    if (marker === 0x21) {
      const label = data[offset + 1];
      if (label === undefined) throw new Error('truncated GIF extension');
      offset += 2;
      if (label === 0xf9) {
        const size = data[offset];
        if (size !== 4 || offset + 6 > data.length) throw new Error('invalid GIF graphic control extension');
        const flags = data[offset + 1]!;
        disposal = (flags >> 2) & 7;
        delayMs = u16(data, offset + 2) * 10;
        transparent = (flags & 1) !== 0;
        transparentIndex = transparent ? data[offset + 4]! : null;
        if (data[offset + 5] !== 0) throw new Error('invalid GIF graphic control terminator');
        offset += 6;
        continue;
      }
      if (label === 0xff) {
        const blockLength = data[offset]!;
        const application = String.fromCharCode(...data.subarray(offset + 1, offset + 1 + blockLength));
        const blocks = readSubBlocks(data, offset + 1 + blockLength);
        if (application === 'NETSCAPE2.0' && blocks.bytes.length >= 3 && blocks.bytes[0] === 1) {
          loopCount = u16(blocks.bytes, 1);
        }
        offset = blocks.next;
        continue;
      }
      const blocks = readSubBlocks(data, offset);
      offset = blocks.next;
      continue;
    }
    if (marker !== 0x2c) throw new Error(`unknown GIF marker 0x${marker.toString(16)} at ${offset}`);
    if (offset + 10 > data.length) throw new Error('truncated GIF image descriptor');
    const left = u16(data, offset + 1);
    const top = u16(data, offset + 3);
    const frameWidth = u16(data, offset + 5);
    const frameHeight = u16(data, offset + 7);
    const descriptor = data[offset + 9]!;
    offset += 10;
    let localPaletteSize = 0;
    let localPalette: Uint8Array<ArrayBufferLike> = new Uint8Array();
    if (descriptor & 0x80) {
      localPaletteSize = 3 * 2 ** ((descriptor & 0x07) + 1);
      localPalette = data.subarray(offset, offset + localPaletteSize);
      offset += localPaletteSize;
    }
    if (offset > data.length) throw new Error('truncated GIF local palette');
    if (globalPaletteSize === 0 && localPaletteSize === 0) throw new Error('GIF frame has no color table');
    const minimumCodeSize = data[offset];
    if (minimumCodeSize === undefined) throw new Error('GIF frame has no LZW code size');
    const blocks = readSubBlocks(data, offset + 1);
    if (descriptor & 0x40) errors.push('interlaced GIF frame was not expected');
    if (left + frameWidth > width || top + frameHeight > height) errors.push(`frame ${frames.length} exceeds the logical screen`);
    const expectedPixels = frameWidth * frameHeight;
    if (screenPixels && previousFrame) {
      if (previousFrame.disposal === 2) {
        for (let y = previousFrame.top; y < previousFrame.top + previousFrame.height; y += 1) {
          for (let x = previousFrame.left; x < previousFrame.left + previousFrame.width; x += 1) {
            screenPixels.set(background, (y * width + x) * 3);
          }
        }
      } else if (previousFrame.disposal === 3 && previousRestore) {
        screenPixels.set(previousRestore);
      }
    }
    const restore = screenPixels && disposal === 3 ? screenPixels.slice() : undefined;
    const decoded = decodeLzw(blocks.bytes, minimumCodeSize, expectedPixels, Boolean(screenPixels));
    if (decoded.count !== expectedPixels) errors.push(`frame ${frames.length} decoded ${decoded.count}/${expectedPixels} pixels`);
    const frameIndex = frames.length;
    const frame: VerifiedGifFrame = { left, top, width: frameWidth, height: frameHeight, delayMs, disposal, transparent };
    if (screenPixels && decoded.pixels) {
      const colorTable = localPalette.length ? localPalette : globalPalette;
      for (let pixel = 0; pixel < decoded.pixels.length; pixel += 1) {
        const index = decoded.pixels[pixel]!;
        if (transparent && index === transparentIndex) continue;
        const x = left + pixel % frameWidth;
        const y = top + Math.floor(pixel / frameWidth);
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        screenPixels.set(paletteColor(colorTable, index, errors, frameIndex), (y * width + x) * 3);
      }
      if (sampleSet.has(frameIndex)) sampledFrames.push({ index: frameIndex, rgb: screenPixels.slice() });
    }
    frames.push(frame);
    previousFrame = frame;
    previousRestore = restore;
    delayMs = 0;
    disposal = 0;
    transparent = false;
    transparentIndex = null;
    offset = blocks.next;
  }
  if (!trailerFound) errors.push('GIF trailer is missing');
  if (offset !== data.length) errors.push('trailing bytes after GIF trailer');
  if (!frames.length) errors.push('GIF contains no image frames');
  const delaysMs = frames.map((frame) => frame.delayMs);
  return {
    width,
    height,
    frames,
    delaysMs,
    durationMs: delaysMs.reduce((sum, delay) => sum + delay, 0),
    loopCount,
    integrity: { valid: errors.length === 0, errors },
    sampledFrames,
  };
}
