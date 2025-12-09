import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'figma:asset/e5c480cc2d10ccec69eb117a5a22c6ba31694a3a.png': path.resolve(
        __dirname,
        './src/assets/e5c480cc2d10ccec69eb117a5a22c6ba31694a3a.png'
      ),
      'figma:asset/d5cd4cb5e94aeb3e9321610d787fd524308d0061.png': path.resolve(
        __dirname,
        './src/assets/d5cd4cb5e94aeb3e9321610d787fd524308d0061.png'
      ),
      'figma:asset/c6eddb4fd4d2599dd1d441337c279378a015bdc8.png': path.resolve(
        __dirname,
        './src/assets/c6eddb4fd4d2599dd1d441337c279378a015bdc8.png'
      ),
      'figma:asset/c27a305f775121206c0bccbc9e190e3e21bc5ee3.png': path.resolve(
        __dirname,
        './src/assets/c27a305f775121206c0bccbc9e190e3e21bc5ee3.png'
      ),
      'figma:asset/b76fb21d3f59d4bf8c6ea63b2dccad8c3f6b772f.png': path.resolve(
        __dirname,
        './src/assets/b76fb21d3f59d4bf8c6ea63b2dccad8c3f6b772f.png'
      ),
      'figma:asset/a51b0759a884eb7e9d14d2f96d1b06e4a025bd77.png': path.resolve(
        __dirname,
        './src/assets/a51b0759a884eb7e9d14d2f96d1b06e4a025bd77.png'
      ),
      'figma:asset/a2d7129efa488fcbdac8cf8c291ceb0d0a9abf7d.png': path.resolve(
        __dirname,
        './src/assets/a2d7129efa488fcbdac8cf8c291ceb0d0a9abf7d.png'
      ),
      'figma:asset/9fa9b12965601318cbffe057cc0859be1adc986c.png': path.resolve(
        __dirname,
        './src/assets/9fa9b12965601318cbffe057cc0859be1adc986c.png'
      ),
      'figma:asset/9c318caeae9555de029a418ebcff2fa1f0efd135.png': path.resolve(
        __dirname,
        './src/assets/9c318caeae9555de029a418ebcff2fa1f0efd135.png'
      ),
      'figma:asset/89c058f66b59bb5340c6f05ee3fc36761daf9a5a.png': path.resolve(
        __dirname,
        './src/assets/89c058f66b59bb5340c6f05ee3fc36761daf9a5a.png'
      ),
      'figma:asset/80681928285c15bfcb142df3c9cc076dcb0a090c.png': path.resolve(
        __dirname,
        './src/assets/80681928285c15bfcb142df3c9cc076dcb0a090c.png'
      ),
      'figma:asset/7738355c5b5b76d279efb31ea1c1781f8b8acf7f.png': path.resolve(
        __dirname,
        './src/assets/7738355c5b5b76d279efb31ea1c1781f8b8acf7f.png'
      ),
      'figma:asset/3a7be8f7e3921a7608a38dce25f052dccfcaa7b0.png': path.resolve(
        __dirname,
        './src/assets/3a7be8f7e3921a7608a38dce25f052dccfcaa7b0.png'
      ),
      'figma:asset/2340eecfd964ff9ee695d6ef64137faa0205abe9.png': path.resolve(
        __dirname,
        './src/assets/2340eecfd964ff9ee695d6ef64137faa0205abe9.png'
      ),
      'figma:asset/1e5d029d62744ccb5c7b74a499ee57acaf8bba68.png': path.resolve(
        __dirname,
        './src/assets/1e5d029d62744ccb5c7b74a499ee57acaf8bba68.png'
      ),
      'figma:asset/1c61b47440c93f91e20df0bd9c3210c63ea856d4.png': path.resolve(
        __dirname,
        './src/assets/1c61b47440c93f91e20df0bd9c3210c63ea856d4.png'
      ),
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
          ],
          'vendor-charts': ['recharts'],
          'vendor-three': ['three'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
