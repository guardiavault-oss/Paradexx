/**
 * App Icon Generator Script
 * 
 * Prerequisites:
 * npm install sharp
 * 
 * Usage:
 * 1. Place your 1024x1024 source icon as 'icon-source.png' in project root
 * 2. Run: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source icon path (1024x1024 PNG)
const SOURCE_ICON = path.join(__dirname, '..', 'icon-source.png');

// iOS icon sizes
const IOS_ICONS = [
    { size: 20, scales: [1, 2, 3], name: 'AppIcon-20' },
    { size: 29, scales: [1, 2, 3], name: 'AppIcon-29' },
    { size: 40, scales: [1, 2, 3], name: 'AppIcon-40' },
    { size: 60, scales: [2, 3], name: 'AppIcon-60' },
    { size: 76, scales: [1, 2], name: 'AppIcon-76' },
    { size: 83.5, scales: [2], name: 'AppIcon-83.5' },
    { size: 1024, scales: [1], name: 'AppIcon-1024' },
];

// Android icon sizes
const ANDROID_ICONS = [
    { size: 48, folder: 'mipmap-mdpi' },
    { size: 72, folder: 'mipmap-hdpi' },
    { size: 96, folder: 'mipmap-xhdpi' },
    { size: 144, folder: 'mipmap-xxhdpi' },
    { size: 192, folder: 'mipmap-xxxhdpi' },
];

// Android adaptive icon sizes (foreground)
const ANDROID_ADAPTIVE_ICONS = [
    { size: 108, folder: 'mipmap-mdpi' },
    { size: 162, folder: 'mipmap-hdpi' },
    { size: 216, folder: 'mipmap-xhdpi' },
    { size: 324, folder: 'mipmap-xxhdpi' },
    { size: 432, folder: 'mipmap-xxxhdpi' },
];

// Output directories
const IOS_OUTPUT = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const ANDROID_OUTPUT = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

async function generateIcons() {
    console.log('🎨 Generating app icons...\n');

    // Check if source icon exists
    if (!fs.existsSync(SOURCE_ICON)) {
        console.error('❌ Source icon not found!');
        console.log('   Please place a 1024x1024 PNG file named "icon-source.png" in the project root.');
        console.log('   Then run this script again.\n');

        // Create a placeholder icon for development
        console.log('📝 Creating placeholder icon...');
        await createPlaceholderIcon();
        return;
    }

    // Generate iOS icons
    console.log('📱 Generating iOS icons...');
    await generateIOSIcons();

    // Generate Android icons
    console.log('🤖 Generating Android icons...');
    await generateAndroidIcons();

    console.log('\n✅ All icons generated successfully!');
}

async function generateIOSIcons() {
    // Ensure output directory exists
    if (!fs.existsSync(IOS_OUTPUT)) {
        fs.mkdirSync(IOS_OUTPUT, { recursive: true });
    }

    const contents = { images: [], info: { author: 'xcode', version: 1 } };

    for (const icon of IOS_ICONS) {
        for (const scale of icon.scales) {
            const pixelSize = Math.round(icon.size * scale);
            const filename = `${icon.name}@${scale}x.png`;
            const outputPath = path.join(IOS_OUTPUT, filename);

            await sharp(SOURCE_ICON)
                .resize(pixelSize, pixelSize)
                .png()
                .toFile(outputPath);

            contents.images.push({
                filename,
                idiom: icon.size >= 76 ? 'ipad' : 'iphone',
                scale: `${scale}x`,
                size: `${icon.size}x${icon.size}`,
            });

            console.log(`   ✓ ${filename} (${pixelSize}x${pixelSize})`);
        }
    }

    // Write Contents.json
    fs.writeFileSync(
        path.join(IOS_OUTPUT, 'Contents.json'),
        JSON.stringify(contents, null, 2)
    );
}

async function generateAndroidIcons() {
    // Generate standard launcher icons
    for (const icon of ANDROID_ICONS) {
        const outputDir = path.join(ANDROID_OUTPUT, icon.folder);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, 'ic_launcher.png');
        await sharp(SOURCE_ICON)
            .resize(icon.size, icon.size)
            .png()
            .toFile(outputPath);

        // Round icon
        const roundPath = path.join(outputDir, 'ic_launcher_round.png');
        await sharp(SOURCE_ICON)
            .resize(icon.size, icon.size)
            .png()
            .toFile(roundPath);

        console.log(`   ✓ ${icon.folder}/ic_launcher.png (${icon.size}x${icon.size})`);
    }

    // Generate adaptive icon foreground
    for (const icon of ANDROID_ADAPTIVE_ICONS) {
        const outputDir = path.join(ANDROID_OUTPUT, icon.folder);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, 'ic_launcher_foreground.png');
        await sharp(SOURCE_ICON)
            .resize(icon.size, icon.size)
            .png()
            .toFile(outputPath);
    }
}

async function createPlaceholderIcon() {
    // Create a simple gradient placeholder icon
    const size = 1024;
    const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#A855F7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#6366F1;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="200"/>
      <text x="512" y="580" font-family="Arial, sans-serif" font-size="400" font-weight="bold" 
            fill="white" text-anchor="middle">P</text>
    </svg>
  `;

    await sharp(Buffer.from(svg))
        .resize(1024, 1024)
        .png()
        .toFile(SOURCE_ICON);

    console.log('   ✓ Created placeholder icon-source.png');
    console.log('   Replace this with your actual app icon and run the script again.\n');

    // Now generate icons with the placeholder
    await generateIOSIcons();
    await generateAndroidIcons();
}

// Run the generator
generateIcons().catch(console.error);
