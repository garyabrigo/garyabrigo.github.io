import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const projectsData = JSON.parse(fs.readFileSync('/home/tars/Proyectos/CV/portfolio-spec/projects.json', 'utf-8'));
const projects = projectsData.projects;

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

for (const project of projects) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const url = `http://127.0.0.1:4321/proyectos/${project.id}/`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  const galleryInfo = await page.evaluate(() => {
    const thumbs = document.querySelectorAll('.gallery-thumb');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-image');
    return {
      thumbCount: thumbs.length,
      lightboxExists: !!lightbox,
      lightboxImgExists: !!lightboxImg,
      firstThumbSrc: thumbs[0]?.getAttribute('data-src') || null,
      firstImgSrc: thumbs[0]?.querySelector('img')?.src || null,
      imgErrors: Array.from(document.querySelectorAll('.gallery-thumb img')).map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth
      }))
    };
  });

  console.log(`\n${project.id}`);
  console.log('  gallery JSON:', project.gallery);
  console.log('  thumbs:', galleryInfo.thumbCount);
  console.log('  lightbox:', galleryInfo.lightboxExists, 'img:', galleryInfo.lightboxImgExists);
  console.log('  first thumb data-src:', galleryInfo.firstThumbSrc);
  console.log('  first img src:', galleryInfo.firstImgSrc);
  console.log('  images loaded:', galleryInfo.imgErrors.map(i => `${i.complete && i.naturalWidth > 0 ? 'OK' : 'FAIL'} ${i.src}`).join('\n    '));

  await page.close();
}

await browser.close();
