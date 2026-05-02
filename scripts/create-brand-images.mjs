import sharp from 'sharp';

const source = 'img/pohu11.jpg';
const hero = 'img/pohutukawa-hero.jpg';
const og = 'img/og-panda-engineer.jpg';

await sharp(source)
  .resize({ width: 1600 })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(hero);

const overlay = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#0c161d" stop-opacity="0.92"/>
      <stop offset="0.72" stop-color="#0c161d" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#0c161d" stop-opacity="0.18"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <text x="76" y="250" fill="#ffffff" font-size="76" font-family="Arial, 'Noto Sans TC', sans-serif" font-weight="800">大魔術熊貓工程師</text>
  <text x="82" y="330" fill="#ffffff" fill-opacity="0.92" font-size="34" font-family="Arial, sans-serif">Ko Ko · Microsoft AI MVP</text>
  <text x="82" y="392" fill="#ffffff" fill-opacity="0.86" font-size="30" font-family="Arial, 'Noto Sans TC', sans-serif">AI Agent · Azure OpenAI · LLM Application Architecture</text>
</svg>
`);

await sharp(source)
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'center' })
  .composite([{ input: overlay }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(og);

console.log(`Created ${hero} and ${og} without source metadata.`);
