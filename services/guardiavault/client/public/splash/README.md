# Apple Splash Screens

This directory should contain Apple splash screen images for iOS devices.

## Required Splash Screens

- `apple-splash-2048-2732.jpg` - iPad Pro 12.9" (1024x1366 @2x)
- `apple-splash-1668-2388.jpg` - iPad Pro 11" (834x1194 @2x)
- `apple-splash-1536-2048.jpg` - iPad (768x1024 @2x)
- `apple-splash-1125-2436.jpg` - iPhone X/XS (375x812 @3x)
- `apple-splash-1242-2688.jpg` - iPhone XS Max (414x896 @3x)
- `apple-splash-750-1334.jpg` - iPhone 8/SE (375x667 @2x)
- `apple-splash-640-1136.jpg` - iPhone 5/SE (320x568 @2x)

## Generating Splash Screens

You can generate splash screens using:

### Using PWA Asset Generator:
```bash
npx pwa-asset-generator source-image.png splash/ --splash-only --background "#0a0a0a"
```

### Using online tools:
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- [App Icon Generator](https://appicon.co/)

## Splash Screen Design

- **Background**: Should match your app's background color (#0a0a0a)
- **Content**: Can include your logo, app name, or loading indicator
- **Format**: JPG or PNG
- **Orientation**: Portrait only (as specified in manifest)

## Temporary Solution

Until splash screens are generated, you can create simple colored images:

```bash
# Using ImageMagick to create solid color splash screens
convert -size 2048x2732 xc:"#0a0a0a" splash/apple-splash-2048-2732.jpg
convert -size 1668x2388 xc:"#0a0a0a" splash/apple-splash-1668-2388.jpg
convert -size 1536x2048 xc:"#0a0a0a" splash/apple-splash-1536-2048.jpg
convert -size 1125x2436 xc:"#0a0a0a" splash/apple-splash-1125-2436.jpg
convert -size 1242x2688 xc:"#0a0a0a" splash/apple-splash-1242-2688.jpg
convert -size 750x1334 xc:"#0a0a0a" splash/apple-splash-750-1334.jpg
convert -size 640x1136 xc:"#0a0a0a" splash/apple-splash-640-1136.jpg
```

Note: These are placeholder images. For production, use properly designed splash screens with your branding.

