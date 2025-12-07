# Video Optimization Guide

Since Sharp cannot extract frames from video files, video optimization requires additional tools.

## Option 1: Use FFmpeg (Recommended)

FFmpeg can extract poster frames and optimize videos:

```bash
# Install FFmpeg (Windows)
# Download from https://ffmpeg.org/download.html

# Extract poster frame (first frame)
ffmpeg -i client/public/hero.mp4 -vf "select=eq(n\,0)" -q:v 3 client/public/optimized/hero-poster.webp

# Optimize video (reduce bitrate)
ffmpeg -i client/public/hero.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k client/public/optimized/hero-optimized.mp4

# Create preview GIF (optional)
ffmpeg -i client/public/hero.mp4 -vf "fps=10,scale=640:-1" -t 3 client/public/optimized/hero-preview.gif
```

## Option 2: Use Cloud Services

For production, consider using:
- **Cloudinary** - Automatic video optimization
- **AWS Elemental MediaConvert** - Serverless video processing
- **Vercel Image Optimization** - Built-in optimization for deployments

## Manual Optimization Steps

1. **Extract poster frames** from each video
2. **Reduce bitrate** to acceptable quality (CRF 28-32 for web)
3. **Add poster images** to `<video>` elements:
   ```tsx
   <video poster="/optimized/hero-poster.webp" ...>
   ```

## Current Videos

- `background-video.mp4`
- `hero.mp4`
- `login-background.mp4`
- `videos/firefly.mp4`

## Automated Script

Create a PowerShell script (`scripts/optimize-videos.ps1`):

```powershell
# Check if FFmpeg is installed
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "FFmpeg not found. Please install FFmpeg first."
    exit 1
}

$videos = @(
    "client/public/background-video.mp4",
    "client/public/hero.mp4",
    "client/public/login-background.mp4",
    "client/public/videos/firefly.mp4"
)

$outputDir = "client/public/optimized"

foreach ($video in $videos) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($video)
    $poster = "$outputDir/${name}-poster.webp"
    $optimized = "$outputDir/${name}-optimized.mp4"
    
    Write-Host "Processing $video..."
    
    # Extract poster
    ffmpeg -i $video -vf "select=eq(n\,0)" -q:v 3 $poster -y
    
    # Optimize video
    ffmpeg -i $video -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k $optimized -y
    
    Write-Host "✅ Completed $name"
}
```

