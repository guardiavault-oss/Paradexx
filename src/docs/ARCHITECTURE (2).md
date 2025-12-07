# Paradex Architecture

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Motion (Framer Motion)** for animations
- **Three.js** for WebGL effects
- **GSAP** for complex animations
- **Recharts** for data visualization

### Backend
- **Supabase** (PostgreSQL database, Auth, Storage)
- **Hono** web server running on Deno
- Edge functions for serverless API

### Build Tools
- **Vite** for development and bundling
- **PostCSS** for CSS processing

## Project Structure

```
paradex/
├── App.tsx                     # Main application entry
├── components/
│   ├── dashboard/             # Dashboard-specific components
│   ├── effects/               # Visual effect components
│   ├── features/              # Feature-specific components
│   ├── figma/                 # Figma import utilities
│   ├── landing/               # Landing page components
│   ├── layout/                # Layout components
│   ├── modals/                # Modal dialogs
│   ├── security/              # Security feature components
│   ├── tokens/                # Token management components
│   ├── transaction/           # Transaction components
│   └── ui/                    # Core UI components
├── data/                      # Static data files
├── docs/                      # Documentation
├── hooks/                     # Custom React hooks
├── imports/                   # Figma imports
├── lib/                       # Utility libraries
├── public/                    # Static assets
├── styles/                    # Global styles
├── supabase/                  # Supabase functions
└── utils/                     # Utility functions
```

## Key Components

### Core Flow
1. **SplashScreen** → Initial loading screen with logo animation
2. **WalletEntry** → Entry point for wallet connection
3. **GlassOnboarding** → Onboarding flow selection
4. **TribeOnboarding** → Degen/Regen identity selection
5. **TunnelLanding** → 3D tunnel with feature cards
6. **Assessment** → User assessment questionnaire
7. **Dashboard** → Main application dashboard

### State Management
- React hooks (useState, useEffect, useContext)
- Local component state
- No global state management library (intentionally kept simple)

### Routing
- Client-side routing using conditional rendering
- State-based navigation
- Smooth transitions between views

## Data Flow

### Authentication
```
Frontend → Supabase Auth → Session Management → Protected Routes
```

### API Requests
```
Frontend → Hono Server → Supabase Client → PostgreSQL
                       ↓
                  Storage/Auth
```

### KV Store
```
Frontend → kv_store.tsx → PostgreSQL (kv_store_50a0f5e4 table)
```

## Performance Optimizations

1. **Lazy Loading**: Heavy components loaded on-demand
2. **Code Splitting**: Automatic chunk splitting via Vite
3. **Memoization**: Strategic use of useMemo/useCallback
4. **Image Optimization**: Figma assets with fallbacks
5. **WebGL**: Optimized shaders with performance monitoring

## Security

1. **Environment Variables**: API keys stored securely
2. **CORS**: Proper CORS headers on server
3. **Auth**: Supabase Auth with JWT tokens
4. **Input Validation**: Client and server-side validation
5. **XSS Protection**: React's built-in escaping

## Deployment

- **Frontend**: Static site deployment (Vercel, Netlify)
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage for user files
