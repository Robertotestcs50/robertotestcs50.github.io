import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'src', 'assets', 'projects');

const projects = [
  {
    slug: '01-cor-petit',
    cover: 'https://framerusercontent.com/images/euBXNLbzRRFW74MTYHkk6jW5TQ.png',
    gallery: [
      'https://framerusercontent.com/images/FYREpAaWdBzg2a5kwAzsgLsixc.png',
      'https://framerusercontent.com/images/w0al4BXyPmGhstjs45y4zkW9peo.png',
      'https://framerusercontent.com/images/4YqeCWytSW9ox2Stx6EKM3EsUX8.png',
      'https://framerusercontent.com/images/dFqfaxbARMGKCK6yLZByD7G8uds.png',
      'https://framerusercontent.com/images/nAkat5KRx3fNbzhOJNWRcUx2k.png',
      'https://framerusercontent.com/images/KgRuGZPiSWeBQe8KMWcy8JViHxQ.png',
      'https://framerusercontent.com/images/EKkqxkL8vDIqb0QCoDkOE1FJvgM.png',
      'https://framerusercontent.com/images/mbf38tYicAabUZD64nczq614FI.jpg',
    ],
  },
  {
    slug: '02-africa-crutches',
    cover: 'https://framerusercontent.com/images/jLWiCj4Slbm2Q3kbD2ZnJJIvrE.jpg',
    gallery: [
      'https://framerusercontent.com/images/tusmzSlTAv2Nr0OTXdiUGQylqYA.jpg',
      'https://framerusercontent.com/images/4a57Mx2NFkyTYh8zYxHJYQ4I7Q.jpg',
      'https://framerusercontent.com/images/iQGJtvHH7ZEcuK9PEPA09vf6nY.jpg',
      'https://framerusercontent.com/images/aVzIZ0Dlr6PMsf3dmaE2NsjxM.jpg',
      'https://framerusercontent.com/images/OE5US9T7Kf2w68BJqnjp9h48Uo.png',
      'https://framerusercontent.com/images/rBQgy9WqQnrZZCBezA2EUjEl7w.png',
      'https://framerusercontent.com/images/hIOqlMClxZhQFW30hshVs9rG1o.jpg',
    ],
  },
  {
    slug: '03-plan-z-app',
    cover: 'https://framerusercontent.com/images/uIQjhkz4Mymg4hq9PVQhKStzg.png',
    gallery: [
      'https://framerusercontent.com/images/e9IybfYR0bs2dLeFIQh65q9YnA.jpg',
      'https://framerusercontent.com/images/SuqD0jAEwFwdXZGPyDYgucl3VuA.png',
      'https://framerusercontent.com/images/lYFgNwqpwFsCiUto2sCP2ZEsY.png',
      'https://framerusercontent.com/images/xMqbNhe7WaBV9HXSgPUtHueyhg.png',
      'https://framerusercontent.com/images/CMFikS189Zxkd2C6IJrZYLmaaOU.png',
      'https://framerusercontent.com/images/Gj3mOodShM4dxy4z0e5BkA8Mh0.png',
      'https://framerusercontent.com/images/eIy0c67ir5Gab8y7iivPM4z7II.jpeg',
    ],
  },
  {
    slug: '04-ease-backpack',
    cover: 'https://framerusercontent.com/images/zslzR1sbKKygdWuEPyORRw6ASc.png',
    gallery: [
      'https://framerusercontent.com/images/zJvdW5555vMd1nQqcdgaPmIE.jpg',
      'https://framerusercontent.com/images/vck0cTxIxssKH2PIXCtJIFKlSY.png',
      'https://framerusercontent.com/images/hBaGl2X50H0ohfcy2z3GIHV97U.png',
      'https://framerusercontent.com/images/w6FUaEBTIALioKOEaJlHF5XM.png',
      'https://framerusercontent.com/images/qoQK8UX93Pa0CnrpVWzeG22c5jQ.png',
      'https://framerusercontent.com/images/pGSOEcZw5hHU7bF79x6JehOwpY.png',
      'https://framerusercontent.com/images/XhaLx1WwfQrxhwkdO3iT069hvKE.png',
      'https://framerusercontent.com/images/Klx5DRn6afEGNI3p5w56sHgzsB8.png',
      'https://framerusercontent.com/images/kyg1PIE95Huoy3Lhj193JPgQca0.png',
      'https://framerusercontent.com/images/TWGTiQv5n1bakVLee8NgD4wIuc.png',
    ],
  },
  {
    slug: '05-uax-oasis',
    cover: 'https://framerusercontent.com/images/np49USY37lBy8HYuJh6GpsTzl8.png',
    gallery: [
      'https://framerusercontent.com/images/TbSOJPbIIolZEiUDZneY6ZuXsXM.png',
      'https://framerusercontent.com/images/LB581Dc5zc2UOcDEjkYEfc90Q.png',
      'https://framerusercontent.com/images/vu90bIC0Y2PoQo0LaFTfRU3txd0.png',
      'https://framerusercontent.com/images/Am7UxLcuvVTnO3lu7HISPbcCKbo.png',
      'https://framerusercontent.com/images/pRSFABDe3Avrd3MRgWKXXcEVg.png',
      'https://framerusercontent.com/images/oVkZJsHLkq27JmSnd6hP1mdlbQ.png',
      'https://framerusercontent.com/images/m0nO1954FN5iQdrbbiGlEmr8g.png',
      'https://framerusercontent.com/images/cLPbTc1OliQcX0pgwlYuEHvFHmU.png',
      'https://framerusercontent.com/images/rpxFmU7mGLw0OV2S6oTY9EwAduY.png',
      'https://framerusercontent.com/images/0sND21BxUoTia4I58elzLXZsS8.png',
    ],
  },
  {
    slug: '06-oficinasya-dashboard',
    cover: 'https://framerusercontent.com/images/WAtTP3B3UEgjBLnzlC33GRLe9jg.png',
    gallery: [
      'https://framerusercontent.com/images/iW091crJRwT33Spc8kr7EQzFZnY.png',
      'https://framerusercontent.com/images/i72TD1MPw6mMRG2e2laTqRbzCtE.png',
      'https://framerusercontent.com/images/3fL0mWxzkTk6chWZ6VMChDUf4ug.png',
      'https://framerusercontent.com/images/8BKbsPiMDM24ngso3A8NJNHNzg4.png',
      'https://framerusercontent.com/images/Ya0nTohk44NIgKcq86mxpf8LxM.png',
    ],
  },
  {
    slug: '07-aurora-lamp',
    cover: 'https://framerusercontent.com/images/A7WH9FePYTmCRRu8us73SdGM.jpeg',
    gallery: [
      'https://framerusercontent.com/images/N1lvzSgMlYu52IJhL4aV5hUgag.jpeg',
      'https://framerusercontent.com/images/qtS6RFuREciZ8sS8buLA00RqRQ.png',
      'https://framerusercontent.com/images/TdzqANPr2iWBOVyOPjK4Ymevmw.jpeg',
      'https://framerusercontent.com/images/h8bjDCoUCYqUn2whcQ79ISyDzo.jpg',
      'https://framerusercontent.com/images/tsnp40otEPBolaOhzZLGuh72rYs.jpeg',
    ],
  },
  {
    slug: '08-manufacturing',
    cover: 'https://framerusercontent.com/images/l3VXngjp5QbdS2anIHekvVT8bX8.jpg',
    gallery: [
      'https://framerusercontent.com/images/LA95LRvkGQfuaGYsz7NlB6lXOU.jpg',
      'https://framerusercontent.com/images/nzK1YbULmdGn9yIfLMvHFrXoFM.jpg',
      'https://framerusercontent.com/images/emKKfD18VTT36bL5enYS3Bl4bI.jpg',
      'https://framerusercontent.com/images/rPoiClGPd91VLZZJTzxSPPTvIE.jpg',
      'https://framerusercontent.com/images/dZw4sdqX0mp3HxHiNxBiSRfaJ4.jpg',
      'https://framerusercontent.com/images/PJXHMEvyfesBcLQlosP9rzmHj94.jpg',
      'https://framerusercontent.com/images/Z2R9ECnl3XTyijnD8iFpzN4Wag.jpg',
    ],
  },
  {
    slug: '09-form-and-shape',
    cover: 'https://framerusercontent.com/images/gzCyeeGQuSSrHM0tsImUUqWqCY.jpeg',
    gallery: [
      'https://framerusercontent.com/images/VTfik6Rk1bTLluXIHbw1A3ST8.jpeg',
      'https://framerusercontent.com/images/LdopYGZFeGwbb8wq986kOWxtSA.jpeg',
      'https://framerusercontent.com/images/nEiTHeNpHpXmawkwzwtwud0cZvw.jpeg',
      'https://framerusercontent.com/images/JQwt4wZMHC2O00SqGfHlbZn0A.jpeg',
      'https://framerusercontent.com/images/9rHzPl9wnqqHUZ2sXIykPtwd7U.jpeg',
      'https://framerusercontent.com/images/7cI33EWT5NRedKo2IE5AvD2aoTM.jpg',
    ],
  },
];

async function downloadAndConvert(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const img = await Jimp.fromBuffer(buf);
  await img.write(destPath);
}

let totalFiles = 0;
let totalErrors = 0;

for (const project of projects) {
  const dir = join(assetsDir, project.slug);
  await mkdir(dir, { recursive: true });

  process.stdout.write(`[${project.slug}] cover ... `);
  try {
    await downloadAndConvert(project.cover, join(dir, 'cover.jpg'));
    console.log('OK');
    totalFiles++;
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    totalErrors++;
  }

  for (let i = 0; i < project.gallery.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    process.stdout.write(`[${project.slug}] ${num}.jpg ... `);
    try {
      await downloadAndConvert(project.gallery[i], join(dir, `${num}.jpg`));
      console.log('OK');
      totalFiles++;
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      totalErrors++;
    }
  }
}

console.log(`\nDone: ${totalFiles} files saved, ${totalErrors} errors.`);
