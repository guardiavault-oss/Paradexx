# Response Compression

GuardiaVault uses gzip compression to reduce response sizes and improve performance.

## Configuration

- **Compression Level**: 6 (balanced between speed and compression ratio)
- **Threshold**: 1KB (responses smaller than 1KB are not compressed)
- **Algorithm**: Gzip (standard, widely supported)

## Supported Content Types

The following content types are compressed:
- `application/json`
- `application/javascript`
- `application/xml`
- `text/html`
- `text/css`
- `text/javascript`
- `text/plain`
- `text/xml`
- `text/markdown`
- `image/svg+xml`

## Excluded Content Types

The following content types are NOT compressed (already compressed or binary):
- Images (`image/*` except SVG)
- Fonts (`font/*`)
- PDFs (`application/pdf`)
- Video/Audio (`video/*`, `audio/*`)
- Binary data (`application/octet-stream`)

## Performance Impact

### Typical Compression Ratios

| Content Type | Original Size | Compressed Size | Compression Ratio |
|-------------|---------------|-----------------|-------------------|
| JSON API Response | 10 KB | 2.5 KB | 75% reduction |
| HTML Page | 50 KB | 12 KB | 76% reduction |
| CSS Stylesheet | 30 KB | 6 KB | 80% reduction |
| JavaScript Bundle | 200 KB | 60 KB | 70% reduction |

### Transfer Time Savings

For a typical 10KB JSON response:
- **Before Compression**: 
  - 3G connection: ~340ms
  - 4G connection: ~80ms
- **After Compression** (2.5KB):
  - 3G connection: ~85ms (4x faster)
  - 4G connection: ~20ms (4x faster)

### CPU Overhead

- Compression overhead: ~2-5ms per request
- Decompression overhead (client): ~1-2ms
- **Net benefit**: Significant for most connections

## Testing

Run the compression test script:

```bash
npm run test:compression
```

This will test actual endpoints and show:
- Original vs compressed sizes
- Compression ratios
- Response times

## Browser Support

All modern browsers support gzip compression:
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

The compression middleware automatically detects browser support via the `Accept-Encoding` header.

## Adding Brotli Support

To add Brotli compression (better compression ratios, newer browsers only):

1. Install `shrink-ray-current`:
   ```bash
   pnpm add shrink-ray-current
   ```

2. Replace compression middleware in `server/index.ts`:
   ```typescript
   const shrinkRay = await import('shrink-ray-current');
   app.use(shrinkRay.default({
     level: 6,
     threshold: 1024,
     // ... same filter configuration
   }));
   ```

Brotli typically provides 15-20% better compression than gzip, but requires more CPU.

## Monitoring

Compression is automatically applied based on:
- Response size (threshold: 1KB)
- Content type (filter)
- Client support (`Accept-Encoding` header)

Check response headers:
- `Content-Encoding: gzip` - Compressed response
- No `Content-Encoding` header - Not compressed (below threshold or unsupported type)

## Disabling Compression

To disable compression for a specific request, add header:
```
X-No-Compression: true
```

This is useful for debugging or when compression causes issues.

