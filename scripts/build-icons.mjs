import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#3b82f6"/>
  <circle cx="64" cy="64" r="38" fill="#fef3c7"/>
  <circle cx="80" cy="52" r="32" fill="#3b82f6"/>
</svg>`;

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon.svg', SVG);

for (const size of [16, 48, 128]) {
  await sharp(Buffer.from(SVG))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`generated public/icons/icon-${size}.png`);
}
