import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const a = (slug, file) => join(root, 'src/assets/projects', slug, file);

const files = [
  // 01-cor-petit new images (09-15)
  { d: a('01-cor-petit','09.jpg'), u: 'https://framerusercontent.com/images/ydnWOPbEpEKSLqU86mHRtZQ2ZY.png' },
  { d: a('01-cor-petit','10.jpg'), u: 'https://framerusercontent.com/images/HmvHQlpmCxKWLg66Lqbov4USS4.png' },
  { d: a('01-cor-petit','11.jpg'), u: 'https://framerusercontent.com/images/Rzcxdzpv2K6dreZJK4IJJeYfafg.png' },
  { d: a('01-cor-petit','12.jpg'), u: 'https://framerusercontent.com/images/4jCQMDWRUxrZJ6grLkU8OXtgOs.png' },
  { d: a('01-cor-petit','13.jpg'), u: 'https://framerusercontent.com/images/a5kg9kGbZSWUgVzHnH8GA2WRM.png' },
  { d: a('01-cor-petit','14.jpg'), u: 'https://framerusercontent.com/images/lNvdDlh2KTTYJGEMqINNBC12BE.png' },
  { d: a('01-cor-petit','15.jpg'), u: 'https://framerusercontent.com/images/emuQY6uXPqgCMrJQOiwcCaNqM.jpeg' },

  // 04-ease-backpack new images (12-21, from 4a)
  { d: a('04-ease-backpack','12.jpg'), u: 'https://framerusercontent.com/images/43vcQoZntkIjM2emjO6iYy74nuE.png' },
  { d: a('04-ease-backpack','13.jpg'), u: 'https://framerusercontent.com/images/rkgObAb6KQnI5kzo3vcuKOyZbys.png' },
  { d: a('04-ease-backpack','14.jpg'), u: 'https://framerusercontent.com/images/xp6N3YJz9O64sCbqzS9jzKVauU.png' },
  { d: a('04-ease-backpack','15.jpg'), u: 'https://framerusercontent.com/images/h3EP9QqerTnlTemDY8SeIxF4.png' },
  { d: a('04-ease-backpack','16.jpg'), u: 'https://framerusercontent.com/images/ZCKpKO8kVWFs2l4bA4e4vtcKM.png' },
  { d: a('04-ease-backpack','17.jpg'), u: 'https://framerusercontent.com/images/83bR0u4ViyfTSGw0VYlzyWU3Ko.png' },
  { d: a('04-ease-backpack','18.jpg'), u: 'https://framerusercontent.com/images/K1j7ATSHyTCx6rfojn05p6BfsE.png' },
  { d: a('04-ease-backpack','19.jpg'), u: 'https://framerusercontent.com/images/Wa58fh0DCpeZJchq8snBpFH8IQ.png' },
  { d: a('04-ease-backpack','20.jpg'), u: 'https://framerusercontent.com/images/UvifOn0J2uv4JKPHPxXePGeiA0.png' },
  { d: a('04-ease-backpack','21.jpg'), u: 'https://framerusercontent.com/images/fA75YRfUr5ZkrUqHIz5xmtRmoG0.png' },

  // 05-uax-oasis new images (11-19, from 4b)
  { d: a('05-uax-oasis','11.jpg'), u: 'https://framerusercontent.com/images/uWq8VnCrBNU32c6p1rajI0jBCo.png' },
  { d: a('05-uax-oasis','12.jpg'), u: 'https://framerusercontent.com/images/pjiipGhshdAWTEjuURlv7FdFXIM.png' },
  { d: a('05-uax-oasis','13.jpg'), u: 'https://framerusercontent.com/images/m5OwCi22YUqqywFoAV0f0V3qY.png' },
  { d: a('05-uax-oasis','14.jpg'), u: 'https://framerusercontent.com/images/BHjO07t1QQYCuIHdPiYgaeuroFM.png' },
  { d: a('05-uax-oasis','15.jpg'), u: 'https://framerusercontent.com/images/3sbCUAgcFl5SxtPDT9UyYRmJLA.png' },
  { d: a('05-uax-oasis','16.jpg'), u: 'https://framerusercontent.com/images/hOOR9Q6e1HgvAPJQmppmL63j0o.png' },
  { d: a('05-uax-oasis','17.jpg'), u: 'https://framerusercontent.com/images/eQt7CzPLTBGXhlsdPUGhiSa8Co.png' },
  { d: a('05-uax-oasis','18.jpg'), u: 'https://framerusercontent.com/images/wTpgt5yB0yxBN5XPDK0e7ODCyGg.png' },
  { d: a('05-uax-oasis','19.jpg'), u: 'https://framerusercontent.com/images/VLhLtkiibVJ5TOsVoyED1ZBbizg.png' },

  // 07-aurora-lamp new image (07)
  { d: a('07-aurora-lamp','07.jpg'), u: 'https://framerusercontent.com/images/rn8su7wkkaBiDZ4WQ7Mi9mGwy4A.png' },
];

let ok = 0, skipped = 0;
const skippedList = [];

for (const { d, u } of files) {
  await mkdir(dirname(d), { recursive: true });
  const name = d.split(/[\\/]/).slice(-2).join('/');
  process.stdout.write(`${name} ... `);
  try {
    const res = await fetch(u);
    if (!res.ok) { console.log(`SKIP ${res.status}`); skipped++; skippedList.push(`${name} → ${res.status}`); continue; }
    const img = await Jimp.fromBuffer(Buffer.from(await res.arrayBuffer()));
    await img.write(d);
    console.log('OK');
    ok++;
  } catch (e) { console.log(`ERR ${e.message}`); skipped++; skippedList.push(`${name} → ${e.message}`); }
}

console.log(`\n✓ ${ok} downloaded  ✗ ${skipped} skipped`);
if (skippedList.length) skippedList.forEach(s => console.log('  ✗', s));
