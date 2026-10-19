/**
 * Minimal GIF89a decoder for the GIF quality tests: no dependencies, no I/O.
 * It decodes the exact bytes the encoder writes (global palette, transparent
 * delta frames, disposal 1) so tests measure the real artifact, not the
 * pre-quantisation canvas.
 */

export interface DecodedFrame {
  width: number;
  height: number;
  /** Composed RGB pixels, 3 bytes per pixel. */
  rgb: Uint8Array;
}

export interface DecodedGif {
  width: number;
  height: number;
  frames: DecodedFrame[];
  delays: number[];
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}

function interlaceRows(height: number): number[] {
  const rows: number[] = [];
  for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]] as const) {
    for (let y = start; y < height; y += step) rows.push(y);
  }
  return rows;
}

/** GIF LZW: variable code size, LSB-first bit packing, dictionary from 2^n. */
function decodeLzw(data: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  const out = new Uint8Array(pixelCount);
  let outPos = 0;
  let dict: number[][] = [];
  let codeSize = minCodeSize + 1;
  let previous: number[] | null = null;
  let bitBuffer = 0;
  let bitCount = 0;
  let bytePos = 0;

  const reset = (): void => {
    dict = [];
    for (let index = 0; index < clearCode; index += 1) dict.push([index]);
    dict.push([], []);
    codeSize = minCodeSize + 1;
    previous = null;
  };
  reset();

  const readCode = (): number => {
    while (bitCount < codeSize && bytePos < data.length) {
      bitBuffer |= data[bytePos]! << bitCount;
      bitCount += 8;
      bytePos += 1;
    }
    if (bitCount < codeSize) return eoiCode;
    const code = bitBuffer & ((1 << codeSize) - 1);
    bitBuffer >>>= codeSize;
    bitCount -= codeSize;
    return code;
  };

  while (outPos < pixelCount) {
    const code = readCode();
    if (code === clearCode) {
      reset();
      continue;
    }
    if (code === eoiCode) break;
    let entry: number[];
    if (code < dict.length) entry = dict[code]!;
    else if (code === dict.length && previous) entry = [...previous, previous[0]!];
    else throw new Error(`invalid LZW code ${code}`);
    for (const value of entry) {
      if (outPos >= pixelCount) break;
      out[outPos] = value;
      outPos += 1;
    }
    if (previous) {
      dict.push([...previous, entry[0]!]);
      if (dict.length === 1 << codeSize && codeSize < 12) codeSize += 1;
    }
    previous = entry;
  }
  return out;
}

export function decodeGif(bytes: Uint8Array): DecodedGif {
  const signature = String.fromCharCode(...bytes.subarray(0, 6));
  if (signature !== 'GIF89a' && signature !== 'GIF87a') throw new Error(`not a GIF: "${signature}"`);
  const width = readUint16(bytes, 6);
  const height = readUint16(bytes, 8);
  const packed = bytes[10]!;
  let offset = 13;
  let globalPalette: Uint8Array | undefined;
  if (packed & 0x80) {
    const size = 3 * 2 ** ((packed & 0x07) + 1);
    globalPalette = bytes.subarray(offset, offset + size);
    offset += size;
  }
  const canvas = new Uint8Array(width * height * 3);
  const frames: DecodedFrame[] = [];
  const delays: number[] = [];
  let transparentIndex = -1;
  let disposal = 0;

  while (offset < bytes.length) {
    const marker = bytes[offset]!;
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = bytes[offset + 1]!;
      offset += 2;
      if (label === 0xf9) {
        const size = bytes[offset]!;
        const flags = bytes[offset + 1]!;
        delays.push(readUint16(bytes, offset + 2));
        transparentIndex = flags & 1 ? bytes[offset + 4]! : -1;
        disposal = (flags >> 2) & 7;
        offset += 1 + size;
      }
      while (bytes[offset] !== 0) offset += 1 + bytes[offset]!;
      offset += 1;
      continue;
    }
    if (marker !== 0x2c) throw new Error(`unknown GIF block 0x${marker.toString(16)} at ${offset}`);
    const left = readUint16(bytes, offset + 1);
    const top = readUint16(bytes, offset + 3);
    const frameWidth = readUint16(bytes, offset + 5);
    const frameHeight = readUint16(bytes, offset + 7);
    const descriptor = bytes[offset + 9]!;
    const interlaced = (descriptor & 0x40) !== 0;
    let palette = globalPalette;
    offset += 10;
    if (descriptor & 0x80) {
      const size = 3 * 2 ** ((descriptor & 0x07) + 1);
      palette = bytes.subarray(offset, offset + size);
      offset += size;
    }
    if (!palette) throw new Error('image block without a palette');
    const minCodeSize = bytes[offset]!;
    offset += 1;
    const chunks: Uint8Array[] = [];
    while (bytes[offset] !== 0) {
      const size = bytes[offset]!;
      chunks.push(bytes.subarray(offset + 1, offset + 1 + size));
      offset += 1 + size;
    }
    offset += 1;
    const indices = decodeLzw(concatChunks(chunks), minCodeSize, frameWidth * frameHeight);
    const rowOrder = interlaced ? interlaceRows(frameHeight) : null;
    for (let y = 0; y < frameHeight; y += 1) {
      const sourceRow = rowOrder ? rowOrder[y]! : y;
      for (let x = 0; x < frameWidth; x += 1) {
        const value = indices[sourceRow * frameWidth + x]!;
        if (value === transparentIndex) continue;
        const source = value * 3;
        const target = ((top + y) * width + left + x) * 3;
        canvas[target] = palette[source]!;
        canvas[target + 1] = palette[source + 1]!;
        canvas[target + 2] = palette[source + 2]!;
      }
    }
    frames.push({ width, height, rgb: canvas.slice() });
    if (disposal === 2) {
      for (let y = top; y < top + frameHeight; y += 1) {
        canvas.fill(0, (y * width + left) * 3, (y * width + left + frameWidth) * 3);
      }
    }
    transparentIndex = -1;
    disposal = 0;
  }
  return { width, height, frames, delays };
}

/** Mean absolute channel difference between two composed frames (0..255). */
export function meanFrameDiff(a: DecodedFrame, b: DecodedFrame): number {
  if (a.rgb.length !== b.rgb.length) throw new Error('frame sizes differ');
  let sum = 0;
  for (let index = 0; index < a.rgb.length; index += 1) sum += Math.abs(a.rgb[index]! - b.rgb[index]!);
  return sum / a.rgb.length;
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
  const parsed = Number.parseInt(full.slice(0, 6), 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

/** Fraction of pixels that differ from `background` by more than `tolerance` per channel. */
export function backgroundCoverage(frame: DecodedFrame, background: [number, number, number], tolerance = 12): number {
  let different = 0;
  const pixels = frame.width * frame.height;
  for (let index = 0; index < pixels; index += 1) {
    const o = index * 3;
    if (
      Math.abs(frame.rgb[o]! - background[0]) > tolerance ||
      Math.abs(frame.rgb[o + 1]! - background[1]) > tolerance ||
      Math.abs(frame.rgb[o + 2]! - background[2]) > tolerance
    ) {
      different += 1;
    }
  }
  return different / pixels;
}
