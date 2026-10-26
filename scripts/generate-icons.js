import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw pixel scanlines (filter type 0 for each line)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;

  // Maskable safe zone margin
  const padding = isMaskable ? width * 0.12 : 0;
  const cornerRadius = isMaskable ? 0 : 70 * scale;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // No filter
    for (let x = 0; x < width; x++) {
      let r = 9, g = 9, b = 11, a = 255; // #09090b base

      // Corner rounding if not maskable
      if (!isMaskable) {
        const dx = Math.min(x, width - 1 - x);
        const dy = Math.min(y, height - 1 - y);
        if (dx < cornerRadius && dy < cornerRadius) {
          const dist = Math.hypot(cornerRadius - dx, cornerRadius - dy);
          if (dist > cornerRadius) {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // Red subtle ambient glow circle
        const distFromCenter = Math.hypot(x - cx, y - cy);
        if (distFromCenter < 140 * scale) {
          const glow = (1 - distFromCenter / (140 * scale)) * 0.25;
          r = Math.min(255, Math.round(r + 220 * glow));
          g = Math.min(255, Math.round(g + 20 * glow));
          b = Math.min(255, Math.round(b + 20 * glow));
        }

        // TV / Screen bounding box
        const screenLeft = cx - (160 - (isMaskable ? 20 : 0)) * scale;
        const screenRight = cx + (160 - (isMaskable ? 20 : 0)) * scale;
        const screenTop = cy - (110 - (isMaskable ? 15 : 0)) * scale;
        const screenBottom = cy + (90 - (isMaskable ? 10 : 0)) * scale;
        const strokeW = 10 * scale;

        const inScreenOuter = x >= screenLeft && x <= screenRight && y >= screenTop && y <= screenBottom;
        const inScreenInner =
          x >= screenLeft + strokeW &&
          x <= screenRight - strokeW &&
          y >= screenTop + strokeW &&
          y <= screenBottom - strokeW;

        if (inScreenOuter && !inScreenInner) {
          // Red border gradient
          const borderGrad = (y - screenTop) / (screenBottom - screenTop);
          r = Math.round(239 - 54 * borderGrad); // #ef4444 -> #b91c1c
          g = Math.round(68 - 40 * borderGrad);
          b = Math.round(68 - 40 * borderGrad);
        } else if (inScreenInner) {
          // Screen interior dark tone
          r = 15;
          g = 15;
          b = 18;
        }

        // Play Triangle
        // Triangle vertices: (cx - 30 * scale, cy - 50 * scale), (cx - 30 * scale, cy + 30 * scale), (cx + 50 * scale, cy - 10 * scale)
        const tYOffset = -10 * scale;
        const p1x = cx - 25 * scale;
        const p1y = cy - 45 * scale + tYOffset;
        const p2x = cx - 25 * scale;
        const p2y = cy + 45 * scale + tYOffset;
        const p3x = cx + 50 * scale;
        const p3y = cy + tYOffset;

        // Point-in-triangle check using barycentric coords
        const dX = x - p3x;
        const dY = y - p3y;
        const dX21 = p3x - p2x;
        const dY12 = p1y - p3y;
        const D = dY12 * (p1x - p3x) + dX21 * (p1y - p3y);
        const s = (dY12 * dX + dX21 * dY) / (D || 1);
        const t = ((p3y - p1y) * dX + (p1x - p3x) * dY) / (D || 1);

        if (s >= 0 && t >= 0 && (s + t) <= 1) {
          // Inside triangle: vibrant red gradient
          r = 239;
          g = 35;
          b = 35;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate files
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
// 64x64 for favicon
const favPng = createPng(64, 64, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favPng);
console.log('Icons generated successfully!');
