import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function generateIco() {
  try {
    const svgBuffer = await fs.readFile('./public/favicon.svg');
    
    // Generate a 32x32 PNG first
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile('./public/favicon.ico');

    console.log('Favicon.ico generated successfully!');
  } catch (error) {
    console.error('Error generating favicon.ico:', error);
  }
}

generateIco(); 