import sharp from 'sharp';

const files = ['img/pohutukawa-hero.jpg', 'img/og-panda-engineer.jpg', 'img/panda-logo.jpg', 'pohu.JPG'];
const failures = [];

for (const file of files) {
  const metadata = await sharp(file).metadata();
  if (metadata.exif || metadata.icc || metadata.iptc || metadata.xmp) {
    failures.push(file);
  }
}

if (failures.length > 0) {
  throw new Error(`Brand images still contain metadata: ${failures.join(', ')}`);
}

console.log(`Checked ${files.length} brand images: no EXIF/IPTC/XMP/ICC metadata.`);
