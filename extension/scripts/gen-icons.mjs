// Generates placeholder PNG icons (16/32/48/128) for the extension without any
// native image deps. Produces a rounded brand-colored tile with a "page + text"
// glyph. Replace with real artwork before publishing.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', 'public', 'icons');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < stride; x++) raw[p++] = rgba[y * stride + x];
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function makeIcon(size) {
  const rgba = new Uint8Array(size * size * 4);
  const r = Math.round(size * 0.2);
  const pageX0 = Math.round(size * 0.27);
  const pageX1 = Math.round(size * 0.73);
  const pageY0 = Math.round(size * 0.18);
  const pageY1 = Math.round(size * 0.82);
  const lineXs = pageX0 + Math.round(size * 0.06);
  const lineXe = pageX1 - Math.round(size * 0.06);
  const lh = Math.max(2, Math.round(size * 0.12));
  const lt = Math.max(1, Math.round(size * 0.035));
  const l1 = pageY0 + Math.round(size * 0.14);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const cx = Math.min(Math.max(x, r), size - 1 - r);
      const cy = Math.min(Math.max(y, r), size - 1 - r);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r * r) {
        rgba[i + 3] = 0;
        continue;
      }
      const t = y / (size - 1);
      let R = Math.round(51 + (26 - 51) * t);
      let G = Math.round(102 + (59 - 102) * t);
      let B = Math.round(242 + (173 - 242) * t);
      if (x >= pageX0 && x <= pageX1 && y >= pageY0 && y <= pageY1) {
        R = 245;
        G = 247;
        B = 250;
      }
      for (let li = 0; li < 3; li++) {
        const ly = l1 + li * lh;
        const xe = li === 2 ? lineXs + Math.round((lineXe - lineXs) * 0.6) : lineXe;
        if (x >= lineXs && x <= xe && y >= ly && y < ly + lt) {
          R = 51;
          G = 102;
          B = 242;
        }
      }
      rgba[i] = R;
      rgba[i + 1] = G;
      rgba[i + 2] = B;
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

mkdirSync(OUT, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  writeFileSync(resolve(OUT, `icon-${size}.png`), encodePng(size, makeIcon(size)));
}
console.log('PaperLens icons written to', OUT);
