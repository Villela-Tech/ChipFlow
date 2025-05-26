import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const sizes = [16, 32, 48, 64, 128, 256];
const publicDir = './public';

async function generateFavicons() {
  try {
    // Ensure the SVG exists
    const svgBuffer = await fs.readFile('./public/favicon.svg');
    
    // Generate PNG favicons
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `favicon-${size}.png`));
    }

    // Generate the main favicon.png
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));

    // Generate apple-icon.png
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-icon.png'));

    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 