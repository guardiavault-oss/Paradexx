/**
 * Generate PWA Icons from Logo
 * Creates all required icon sizes from client/public/logo.png
 */

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ICON_SIZES = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const LOGO_PATH = join(process.cwd(), 'client', 'public', 'logo.png');
const ICONS_DIR = join(process.cwd(), 'client', 'public', 'icons');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Check if logo exists
  if (!existsSync(LOGO_PATH)) {
    console.error('❌ Logo not found at:', LOGO_PATH);
    process.exit(1);
  }

  // Create icons directory if it doesn't exist
  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
    console.log('✅ Created icons directory');
  }

  // Generate each icon size
  for (const icon of ICON_SIZES) {
    const outputPath = join(ICONS_DIR, icon.name);
    try {
      await sharp(LOGO_PATH)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 10, g: 10, b: 10, alpha: 1 }, // #0a0a0a background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error: any) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message);
    }
  }

  console.log('\n✅ All icons generated successfully!');
  console.log(`📁 Icons saved to: ${ICONS_DIR}`);
}

generateIcons().catch((error) => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});

