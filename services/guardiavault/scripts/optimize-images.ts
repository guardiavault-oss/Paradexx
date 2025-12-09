/**
 * Image Optimization Script
 * Converts PNGs to WebP, generates responsive sizes, and optimizes images
 */

import sharp from 'sharp';
import { readdir, stat, mkdir, copyFile, writeFile } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { existsSync } from 'fs';

interface OptimizationStats {
  originalSize: number;
  webpSize: number;
  optimizedPngSize: number;
  savings: number;
  savingsPercent: number;
}

interface ImageStats {
  filename: string;
  before: number;
  after: number;
  savings: number;
  savingsPercent: number;
}

const RESPONSIVE_SIZES = [
  { width: 320, suffix: '320w' },
  { width: 768, suffix: '768w' },
  { width: 1024, suffix: '1024w' },
  { width: 1920, suffix: '1920w' },
];

const OPTIMIZATION_QUALITY = 85;
const WEBP_QUALITY = 85;

async function optimizeImage(
  inputPath: string,
  outputDir: string,
  filename: string
): Promise<OptimizationStats> {
  const stats = await stat(inputPath);
  const originalSize = stats.size;
  const baseName = basename(filename, extname(filename));
  const ext = extname(filename).toLowerCase();

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const results: OptimizationStats = {
    originalSize,
    webpSize: 0,
    optimizedPngSize: 0,
    savings: 0,
    savingsPercent: 0,
  };

  // Generate WebP version (main size)
  const webpPath = join(outputDir, `${baseName}.webp`);
  const webpBuffer = await image
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toBuffer();
  await writeFile(webpPath, webpBuffer);
  results.webpSize = webpBuffer.length;

  // Generate optimized PNG version (fallback)
  const optimizedPngPath = join(outputDir, `${baseName}-optimized.png`);
  const optimizedPngBuffer = await image
    .png({ quality: OPTIMIZATION_QUALITY, compressionLevel: 9 })
    .toBuffer();
  await writeFile(optimizedPngPath, optimizedPngBuffer);
  results.optimizedPngSize = optimizedPngBuffer.length;

  // Generate responsive WebP sizes
  for (const size of RESPONSIVE_SIZES) {
    const responsiveWebpPath = join(outputDir, `${baseName}-${size.suffix}.webp`);
    
    // Only resize if image is larger than target size
    if (metadata.width && metadata.width > size.width) {
      const responsiveBuffer = await image
        .resize(size.width, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: WEBP_QUALITY, effort: 6 })
        .toBuffer();
      
      await writeFile(responsiveWebpPath, responsiveBuffer);
    } else {
      // If image is smaller, just copy the main WebP
      await copyFile(webpPath, responsiveWebpPath);
    }
  }

  // Generate responsive optimized PNG sizes (fallback)
  for (const size of RESPONSIVE_SIZES) {
    const responsivePngPath = join(outputDir, `${baseName}-${size.suffix}.png`);
    
    if (metadata.width && metadata.width > size.width) {
      const responsiveBuffer = await image
        .resize(size.width, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .png({ quality: OPTIMIZATION_QUALITY, compressionLevel: 9 })
        .toBuffer();
      
      await writeFile(responsivePngPath, responsiveBuffer);
    } else {
      // If image is smaller, just copy the optimized PNG
      await copyFile(optimizedPngPath, responsivePngPath);
    }
  }

  // Calculate savings (use WebP as primary, PNG as fallback)
  const smallestSize = Math.min(results.webpSize, results.optimizedPngSize);
  results.savings = originalSize - smallestSize;
  results.savingsPercent = (results.savings / originalSize) * 100;

  return results;
}

async function optimizeVideo(
  inputPath: string,
  outputDir: string,
  filename: string
): Promise<{ posterPath: string; size: number } | null> {
  try {
    // For videos, we'll generate a poster image from the first frame
    // Note: This requires ffmpeg, but we'll use sharp to process the frame if available
    
    const baseName = basename(filename, extname(filename));
    const posterPath = join(outputDir, `${baseName}-poster.webp`);
    
    // Try to extract first frame using sharp (if video format is supported)
    // Otherwise, we'll skip and let the user handle it manually
    try {
      const image = sharp(inputPath, { 
        failOn: 'none',
        pages: 1, // Just first frame
      });
      
      const metadata = await image.metadata();
      
      if (metadata.width && metadata.height) {
        // Extract first frame and optimize
        const posterBuffer = await image
          .resize(1920, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: 85, effort: 6 })
          .toBuffer();
        
        await writeFile(posterPath, posterBuffer);
        
        return {
          posterPath: posterPath.replace(process.cwd(), '').replace(/\\/g, '/'),
          size: posterBuffer.length,
        };
      }
    } catch (error) {
      console.warn(`⚠️  Could not extract poster from ${filename}:`, error);
      // Continue without poster
    }
    
    return null;
  } catch (error) {
    console.error(`Error processing video ${filename}:`, error);
    return null;
  }
}

async function main() {
  const publicDir = join(process.cwd(), 'client/public');
  const optimizedDir = join(process.cwd(), 'client/public/optimized');
  
  console.log('🖼️  Starting image optimization...\n');
  console.log(`📁 Input directory: ${publicDir}`);
  console.log(`📁 Output directory: ${optimizedDir}\n`);

  // Ensure optimized directory exists
  if (!existsSync(optimizedDir)) {
    await mkdir(optimizedDir, { recursive: true });
  }

  const files = await readdir(publicDir);
  const imageFiles = files.filter(
    (f) => /\.(png|jpg|jpeg)$/i.test(f) && !f.includes('-optimized') && !f.includes('-poster')
  );
  const videoFiles = files.filter((f) => /\.(mp4|webm)$/i.test(f));

  console.log(`📸 Found ${imageFiles.length} images to optimize`);
  console.log(`🎬 Found ${videoFiles.length} videos to process\n`);

  const imageStats: ImageStats[] = [];
  let totalBefore = 0;
  let totalAfter = 0;

  // Process images
  for (const file of imageFiles) {
    try {
      const inputPath = join(publicDir, file);
      const stats = await stat(inputPath);
      const beforeSize = stats.size;
      
      console.log(`⏳ Processing ${file}...`);
      
      const result = await optimizeImage(inputPath, optimizedDir, file);
      
      imageStats.push({
        filename: file,
        before: beforeSize,
        after: Math.min(result.webpSize, result.optimizedPngSize),
        savings: result.savings,
        savingsPercent: result.savingsPercent,
      });
      
      totalBefore += beforeSize;
      totalAfter += Math.min(result.webpSize, result.optimizedPngSize);
      
      console.log(
        `✅ ${file}: ${(beforeSize / 1024).toFixed(2)}KB → ${(Math.min(result.webpSize, result.optimizedPngSize) / 1024).toFixed(2)}KB (${result.savingsPercent.toFixed(1)}% savings)`
      );
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  // Process videos
  const videoPosters: Array<{ video: string; poster: string }> = [];
  for (const file of videoFiles) {
    try {
      const inputPath = join(publicDir, file);
      console.log(`⏳ Processing video ${file}...`);
      
      const poster = await optimizeVideo(inputPath, optimizedDir, file);
      if (poster) {
        videoPosters.push({ video: file, poster: poster.posterPath });
        console.log(`✅ Generated poster for ${file}: ${poster.posterPath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing video ${file}:`, error);
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n📸 Image Optimization:');
  console.log(`   Total images: ${imageFiles.length}`);
  console.log(`   Total size before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total size after: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total savings: ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} MB (${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%)`);
  
  console.log('\n📋 Individual Image Results:');
  imageStats
    .sort((a, b) => b.savings - a.savings)
    .forEach((stat) => {
      console.log(
        `   ${stat.filename.padEnd(40)} ${(stat.before / 1024).toFixed(2).padStart(10)}KB → ${(stat.after / 1024).toFixed(2).padStart(8)}KB (${stat.savingsPercent.toFixed(1)}% savings)`
      );
    });
  
  if (videoPosters.length > 0) {
    console.log('\n🎬 Video Posters Generated:');
    videoPosters.forEach(({ video, poster }) => {
      console.log(`   ${video} → ${poster}`);
    });
  }
  
  console.log('\n✅ Optimization complete!');
  console.log(`📁 Optimized images saved to: ${optimizedDir}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Update image references to use OptimizedImage component');
  console.log('   2. Test responsive images on different devices');
  console.log('   3. Verify WebP support in target browsers\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

