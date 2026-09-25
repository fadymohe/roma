import fs from 'node:fs';
import path from 'node:path';

const storeDist = path.resolve('artifacts/roma-store/dist');
const rootDist = path.resolve('dist');

if (fs.existsSync(storeDist)) {
  fs.cpSync(storeDist, rootDist, { recursive: true, force: true });
  console.log('✅ Successfully copied artifacts/roma-store/dist to root dist/');
}
