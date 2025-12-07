# PWA Icons

This directory should contain the following icon files for the PWA:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (required)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (required)
- `apple-touch-icon.png` - 180x180 pixels (for iOS)

## Generating Icons

You can generate all sizes from a single 512x512 source image using:

### Using sharp-cli (recommended):
```bash
npm install -g sharp-cli

# Generate all sizes from your source icon
sharp -i source-icon.png -o icons/icon-72x72.png resize 72 72
sharp -i source-icon.png -o icons/icon-96x96.png resize 96 96
sharp -i source-icon.png -o icons/icon-128x128.png resize 128 128
sharp -i source-icon.png -o icons/icon-144x144.png resize 144 144
sharp -i source-icon.png -o icons/icon-152x152.png resize 152 152
sharp -i source-icon.png -o icons/icon-192x192.png resize 192 192
sharp -i source-icon.png -o icons/icon-384x384.png resize 384 384
sharp -i source-icon.png -o icons/icon-512x512.png resize 512 512
sharp -i source-icon.png -o icons/apple-touch-icon.png resize 180 180
```

### Using ImageMagick:
```bash
convert source-icon.png -resize 72x72 icons/icon-72x72.png
convert source-icon.png -resize 96x96 icons/icon-96x96.png
convert source-icon.png -resize 128x128 icons/icon-128x128.png
convert source-icon.png -resize 144x144 icons/icon-144x144.png
convert source-icon.png -resize 152x152 icons/icon-152x152.png
convert source-icon.png -resize 192x192 icons/icon-192x192.png
convert source-icon.png -resize 384x384 icons/icon-384x384.png
convert source-icon.png -resize 512x512 icons/icon-512x512.png
convert source-icon.png -resize 180x180 icons/apple-touch-icon.png
```

### Using online tools:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)

## Icon Requirements

- **Format**: PNG
- **Purpose**: Should support both "maskable" and "any" purposes
- **Maskable icons**: Should have safe zone (80% of icon area) with important content
- **Background**: Can be transparent or solid color matching theme (#6366f1)

## Temporary Solution

Until icons are generated, you can temporarily copy your existing logo.png to all icon sizes:

```bash
# Copy logo.png to all required sizes (temporary)
cp ../logo.png icon-72x72.png
cp ../logo.png icon-96x96.png
cp ../logo.png icon-128x128.png
cp ../logo.png icon-144x144.png
cp ../logo.png icon-152x152.png
cp ../logo.png icon-192x192.png
cp ../logo.png icon-384x384.png
cp ../logo.png icon-512x512.png
cp ../logo.png apple-touch-icon.png
```

Note: This is a temporary solution. For production, use properly sized icons.

