import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const files = [
  // Personal photos
  { url: 'https://framerusercontent.com/images/U5gqeyQrPkB29uwDb9kOraOqJNI.jpeg', dest: 'src/assets/about-photo.jpg' },
  { url: 'https://framerusercontent.com/images/qzEGQAuwPiLIaDWnzVTqovLjUXE.jpeg', dest: 'src/assets/hero-walking.jpg' },

  // Plan Z Phase 1
  { url: 'https://framerusercontent.com/images/SuqD0jAEwFwdXZGPyDYgucl3VuA.png', dest: 'src/assets/projects/03-plan-z-app/phase1-01.jpg' },
  { url: 'https://framerusercontent.com/images/lYFgNwqpwFsCiUto2sCP2ZEsY.png',    dest: 'src/assets/projects/03-plan-z-app/phase1-02.jpg' },
  { url: 'https://framerusercontent.com/images/xMqbNhe7WaBV9HXSgPUtHueyhg.png',   dest: 'src/assets/projects/03-plan-z-app/phase1-03.jpg' },
  { url: 'https://framerusercontent.com/images/CMFikS189Zxkd2C6IJrZYLmaaOU.png',  dest: 'src/assets/projects/03-plan-z-app/phase1-04.jpg' },
  { url: 'https://framerusercontent.com/images/PoOftKoBO5OtNpz4fyZcYw.png',       dest: 'src/assets/projects/03-plan-z-app/phase1-05.jpg' },
  { url: 'https://framerusercontent.com/images/OkOIkpMiFncc1Ms4i2uEpN4ItTs.png',  dest: 'src/assets/projects/03-plan-z-app/phase1-06.jpg' },
  { url: 'https://framerusercontent.com/images/cPyxHMzJODFD12vj73YYZcEo3I.png',   dest: 'src/assets/projects/03-plan-z-app/phase1-07.jpg' },
  { url: 'https://framerusercontent.com/images/Y9CFUYCFFd3MGGnSMPFg2fEjUk.png',   dest: 'src/assets/projects/03-plan-z-app/phase1-08.jpg' },

  // Plan Z Phase 2
  { url: 'https://framerusercontent.com/images/mSQOEsp5V8YRvHJtUktFyKwqbU8.png',  dest: 'src/assets/projects/03-plan-z-app/phase2-01.jpg' },
  { url: 'https://framerusercontent.com/images/BzfvUIcjNF7Uosqk3BhecRigAc.png',   dest: 'src/assets/projects/03-plan-z-app/phase2-02.jpg' },
  { url: 'https://framerusercontent.com/images/Md8C8Kx2hC871Cgcc4n21vKmbw.png',   dest: 'src/assets/projects/03-plan-z-app/phase2-03.jpg' },
  { url: 'https://framerusercontent.com/images/yxkLliAnfaHUoK1e21BoPqJgnd8.png',  dest: 'src/assets/projects/03-plan-z-app/phase2-04.jpg' },
  { url: 'https://framerusercontent.com/images/cCCX7ym3Rwrjlih4pifG0VRPzw.png',   dest: 'src/assets/projects/03-plan-z-app/phase2-05.jpg' },
  { url: 'https://framerusercontent.com/images/AyAK7BibX5zH8GwkeAcjKyKE.png',     dest: 'src/assets/projects/03-plan-z-app/phase2-06.jpg' },
  { url: 'https://framerusercontent.com/images/XtM9eAAQgzBzzEinc5midCXZbY.png',   dest: 'src/assets/projects/03-plan-z-app/phase2-07.jpg' },
  { url: 'https://framerusercontent.com/images/MLleSXsr0eMNE9K49iDIEJ9WVk.png',   dest: 'src/assets/projects/03-plan-z-app/phase2-08.jpg' },
  { url: 'https://framerusercontent.com/images/shYIqNIYHD6vYeJLWQ1H0D2QNNQ.png',  dest: 'src/assets/projects/03-plan-z-app/phase2-09.jpg' },
  { url: 'https://framerusercontent.com/images/qEaXo0ejbmUBA4KML9GPUtEVjHE.png',  dest: 'src/assets/projects/03-plan-z-app/phase2-10.jpg' },

  // Plan Z Phase 3
  { url: 'https://framerusercontent.com/images/WvSkARYsGZzgbCggKdhL94PBgyY.png',  dest: 'src/assets/projects/03-plan-z-app/phase3-01.jpg' },
  { url: 'https://framerusercontent.com/images/7UoOGLngHNnoHcAhL7pQng2de0.png',   dest: 'src/assets/projects/03-plan-z-app/phase3-02.jpg' },
  { url: 'https://framerusercontent.com/images/egq2IZrh8LWumMm81jTRqCfD8xc.png',  dest: 'src/assets/projects/03-plan-z-app/phase3-03.jpg' },
  { url: 'https://framerusercontent.com/images/8RfcA8yL5xAjgccgSMSdNGfMdo.png',   dest: 'src/assets/projects/03-plan-z-app/phase3-04.jpg' },
  { url: 'https://framerusercontent.com/images/DkpVC4fTVQssCUCQzcAy2GJXw.png',    dest: 'src/assets/projects/03-plan-z-app/phase3-05.jpg' },
  { url: 'https://framerusercontent.com/images/pJzW5oO3dL1wRg4lBPVUKfIcDc.png',   dest: 'src/assets/projects/03-plan-z-app/phase3-06.jpg' },
  { url: 'https://framerusercontent.com/images/8SWAMxZM2z6TtM7oM5cycrBGY.png',    dest: 'src/assets/projects/03-plan-z-app/phase3-07.jpg' },
  { url: 'https://framerusercontent.com/images/kaaD7n7oXxKLDEyztBnBrEALJg.png',   dest: 'src/assets/projects/03-plan-z-app/phase3-08.jpg' },
  { url: 'https://framerusercontent.com/images/dhI1wyrfmiMyIVexEwYcYiYE.png',     dest: 'src/assets/projects/03-plan-z-app/phase3-09.jpg' },

  // Plan Z Phase 4
  { url: 'https://framerusercontent.com/images/rpu4TARzwgO4XDx8EQ0FdHPZY.png',    dest: 'src/assets/projects/03-plan-z-app/phase4-01.jpg' },
  { url: 'https://framerusercontent.com/images/oRRoLb1jQjVoPvBta35kYeaBc.png',    dest: 'src/assets/projects/03-plan-z-app/phase4-02.jpg' },
  { url: 'https://framerusercontent.com/images/HGXKyHj7RjWt27IE0ZuLtSaMdaE.png',  dest: 'src/assets/projects/03-plan-z-app/phase4-03.jpg' },
  { url: 'https://framerusercontent.com/images/fWBKGGKIApnyZayFoXScbIjVq4.png',   dest: 'src/assets/projects/03-plan-z-app/phase4-04.jpg' },
  { url: 'https://framerusercontent.com/images/otk6vrE6o4ZbCVDd1R8FYHlXSk.png',   dest: 'src/assets/projects/03-plan-z-app/phase4-05.jpg' },
  { url: 'https://framerusercontent.com/images/PcNVEZHkHo8iF0laAP9YVaa8tSg.png',  dest: 'src/assets/projects/03-plan-z-app/phase4-06.jpg' },
  { url: 'https://framerusercontent.com/images/0AhWVS8pZoWOjeNQ3e4FoEoVVKU.png',  dest: 'src/assets/projects/03-plan-z-app/phase4-07.jpg' },
];

let ok = 0, err = 0;

for (const { url, dest } of files) {
  const fullPath = join(root, dest);
  await mkdir(dirname(fullPath), { recursive: true });
  process.stdout.write(`${dest} ... `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const img = await Jimp.fromBuffer(buf);
    await img.write(fullPath);
    console.log('OK');
    ok++;
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    err++;
  }
}

console.log(`\nDone: ${ok} OK, ${err} errors.`);
