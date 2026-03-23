import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

function findPages(dir) {
  const results = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) results.push(...findPages(full));
    else if (item === 'page.tsx') results.push(full);
  }
  return results;
}

const adminDir = new URL('../app/[locale]/admin', import.meta.url).pathname.slice(1).replace(/\//g, '\\');
const pages = findPages(adminDir);
console.log('Found', pages.length, 'page files');

let updated = 0;
const EXPORT_DYNAMIC = `export const dynamic = 'force-dynamic';`;

for (const p of pages) {
  let content = readFileSync(p, 'utf8');
  if (content.includes('export const dynamic')) {
    console.log('Skip (already set):', relative(adminDir, p));
    continue;
  }
  const useClientMarker = '"use client";';
  let replacement;
  if (content.includes(useClientMarker)) {
    replacement = content.replace(useClientMarker, `${useClientMarker}\n\n${EXPORT_DYNAMIC}`);
  } else {
    replacement = `${EXPORT_DYNAMIC}\n\n${content}`;
  }
  writeFileSync(p, replacement);
  updated++;
  console.log('Updated:', relative(adminDir, p));
}
console.log(`\nDone. Updated ${updated} of ${pages.length} files.`);
