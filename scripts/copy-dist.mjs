import fs from 'node:fs';
import path from 'node:path';

const storeDist = path.resolve('artifacts/roma-store/dist');
const rootDist = path.resolve('dist');
const apiServerDist = path.resolve('artifacts/api-server/dist');

if (fs.existsSync(storeDist)) {
  fs.cpSync(storeDist, rootDist, { recursive: true, force: true });
  console.log('✅ Successfully copied artifacts/roma-store/dist to root dist/');

  if (fs.existsSync(path.dirname(apiServerDist))) {
    fs.cpSync(storeDist, apiServerDist, { recursive: true, force: true });
    console.log('✅ Successfully copied artifacts/roma-store/dist to api-server/dist/');
  }
}

