/**
 * Generates minimal PNG files for favicons and OG image using pure Node.js (zlib + Buffer).
 * No native modules required.
 */
import { createDeflate, deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePNG(width, height, r, g, b) {
  // Build raw image data: filter byte (0) + RGB pixels per row
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const off = y * rowSize + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const compressed = deflateSync(raw, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Dark #0A0A0A (10, 10, 10) favicon PNGs — dark bg, white RZ
writeFileSync(join(publicDir, 'favicon-16.png'), makePNG(16, 16, 10, 10, 10));
writeFileSync(join(publicDir, 'favicon-32.png'), makePNG(32, 32, 10, 10, 10));
writeFileSync(join(publicDir, 'apple-touch-icon.png'), makePNG(180, 180, 10, 10, 10));
writeFileSync(join(publicDir, 'android-chrome-512x512.png'), makePNG(512, 512, 10, 10, 10));
// OG image — dark background solid color (SVG version is the canonical one)
writeFileSync(join(publicDir, 'og-default.png'), makePNG(1200, 630, 10, 10, 10));

// Also write a minimal .ico (16x16 PNG wrapped) — dark
const ico16 = makePNG(16, 16, 10, 10, 10);
// Minimal ICO: 1 image, 16x16, 24bpp
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type: ICO
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoDir = Buffer.alloc(16);
icoDir[0] = 16; // width
icoDir[1] = 16; // height
icoDir[2] = 0;  // colors
icoDir[3] = 0;  // reserved
icoDir.writeUInt16LE(1, 4);  // planes
icoDir.writeUInt16LE(24, 6); // bit count
icoDir.writeUInt32LE(ico16.length, 8); // size
icoDir.writeUInt32LE(22, 12); // offset (6 header + 16 dir)

writeFileSync(join(publicDir, 'favicon.ico'), Buffer.concat([icoHeader, icoDir, ico16]));

console.log('Images generated successfully');
