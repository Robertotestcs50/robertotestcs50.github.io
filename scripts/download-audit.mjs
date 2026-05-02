import { mkdir, copyFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const assets = (slug, file) => join(root, 'src/assets/projects', slug, file);

const files = [
  // 02-africa-crutches — new images
  { url: 'https://framerusercontent.com/images/Qm4Y8wXxKpLnzTqRs9vNdJcEuF.jpg', dest: assets('02-africa-crutches', '08.jpg') },
  { url: 'https://framerusercontent.com/images/pRzKj7mNtYvBqXsWoLcGdEaUiH.jpg', dest: assets('02-africa-crutches', '09.jpg') },
  { url: 'https://framerusercontent.com/images/vFsKpQmTnXzYrBwJdLcEoNuGiA.jpg', dest: assets('02-africa-crutches', '10.jpg') },

  // 03-plan-z-app — gallery renumber (02=old01, 03=old02, ..., 08=old07)
  { url: 'https://framerusercontent.com/images/e9IybfYR0bs2dLeFIQh65q9YnA.jpg',  dest: assets('03-plan-z-app', '02.jpg') },
  { url: 'https://framerusercontent.com/images/SuqD0jAEwFwdXZGPyDYgucl3VuA.png', dest: assets('03-plan-z-app', '03.jpg') },
  { url: 'https://framerusercontent.com/images/lYFgNwqpwFsCiUto2sCP2ZEsY.png',   dest: assets('03-plan-z-app', '04.jpg') },
  { url: 'https://framerusercontent.com/images/xMqbNhe7WaBV9HXSgPUtHueyhg.png',  dest: assets('03-plan-z-app', '05.jpg') },
  { url: 'https://framerusercontent.com/images/CMFikS189Zxkd2C6IJrZYLmaaOU.png', dest: assets('03-plan-z-app', '06.jpg') },
  { url: 'https://framerusercontent.com/images/Gj3mOodShM4dxy4z0e5BkA8Mh0.png',  dest: assets('03-plan-z-app', '07.jpg') },
  { url: 'https://framerusercontent.com/images/eIy0c67ir5Gab8y7iivPM4z7II.jpeg', dest: assets('03-plan-z-app', '08.jpg') },

  // 04-ease-backpack — image 11 (same URL as cover)
  { url: 'https://framerusercontent.com/images/zslzR1sbKKygdWuEPyORRw6ASc.png',  dest: assets('04-ease-backpack', '11.jpg') },

  // 05-uax-oasis — new images (may 404)
  { url: 'https://framerusercontent.com/images/nBvKpQmXzYrTsWoLcGdEaUiHjF.png',  dest: assets('05-uax-oasis', '11.jpg') },
  { url: 'https://framerusercontent.com/images/wFsKpQmTnXzYrBwJdLcEoNuGiA.png',  dest: assets('05-uax-oasis', '12.jpg') },

  // 06-oficinasya-dashboard — image 06 (same URL as cover)
  { url: 'https://framerusercontent.com/images/WAtTP3B3UEgjBLnzlC33GRLe9jg.png',  dest: assets('06-oficinasya-dashboard', '06.jpg') },

  // 07-aurora-lamp — images 06+07
  { url: 'https://framerusercontent.com/images/A7WH9FePYTmCRRu8us73SdGM.jpeg',   dest: assets('07-aurora-lamp', '06.jpg') },
  { url: 'https://framerusercontent.com/images/xKpQmTnYzBwJdLcEoNuGiAvFs.jpg',   dest: assets('07-aurora-lamp', '07.jpg') },

  // 08-manufacturing — images 08+09+10
  { url: 'https://framerusercontent.com/images/l3VXngjp5QbdS2anIHekvVT8bX8.jpg', dest: assets('08-manufacturing', '08.jpg') },
  { url: 'https://framerusercontent.com/images/kNpQmTzYrBwJdLcEoNuGiAvFsX.jpg',  dest: assets('08-manufacturing', '09.jpg') },
  { url: 'https://framerusercontent.com/images/mXzYrBwJdLcEoNuGiAvFsKpQnT.jpg',  dest: assets('08-manufacturing', '10.jpg') },

  // 09-form-and-shape — image 07 (same URL as cover)
  { url: 'https://framerusercontent.com/images/gzCyeeGQuSSrHM0tsImUUqWqCY.jpeg', dest: assets('09-form-and-shape', '07.jpg') },
];

let downloaded = 0, skipped404 = 0, alreadyExist = 0;
const skippedList = [];

for (const { url, dest } of files) {
  await mkdir(dirname(dest), { recursive: true });
  const shortDest = dest.replace(root + '\\', '').replace(root + '/', '');
  process.stdout.write(`${shortDest} ... `);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`SKIPPED (HTTP ${res.status})`);
      skipped404++;
      skippedList.push({ dest: shortDest, status: res.status });
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const img = await Jimp.fromBuffer(buf);
    await img.write(dest);
    console.log('OK');
    downloaded++;
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    skipped404++;
    skippedList.push({ dest: shortDest, error: e.message });
  }
}

console.log(`\n✓ Downloaded: ${downloaded}  ✗ Skipped/404: ${skipped404}`);
if (skippedList.length) {
  console.log('Skipped files:');
  skippedList.forEach(s => console.log(`  ${s.dest} → ${s.status || s.error}`));
}
