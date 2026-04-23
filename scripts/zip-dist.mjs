import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import archiver from 'archiver';

const DIST = 'dist';
const OUT_DIR = 'release';
const OUT = join(OUT_DIR, 'dalgeumi-desk.zip');

if (!existsSync(DIST)) {
  console.error('dist 폴더가 없습니다. `npm run build` 먼저 실행하세요.');
  process.exit(1);
}
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const output = createWriteStream(OUT);
const archive = archiver('zip', { zlib: { level: 9 } });
archive.pipe(output);
archive.directory(DIST, false);
await archive.finalize();
console.log(`zipped → ${OUT}`);
