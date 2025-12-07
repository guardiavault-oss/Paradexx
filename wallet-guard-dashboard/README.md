# 🎨 Wallet Guard Dashboard

Modern Next.js dashboard for the Wallet Guard Service.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd wallet-guard-dashboard
npm install
```

### 2. Configure API URL

The dashboard connects to the API service running on port 8003 by default.

Edit `.env.local` if your API is running on a different port:

```env
NEXT_PUBLIC_API_URL=http://localhost:8003
```

### 3. Start Development Server

```bash
npm run dev
```

The dashboard will be available at:
- **Dashboard**: http://localhost:3003
- **API**: http://localhost:8003 (must be running)

### 4. Build for Production

```bash
npm run build
npm start
```

## 🎯 Features

- ✅ Real-time service status
- ✅ Health monitoring
- ✅ Service statistics
- ✅ Quick access to API docs
- ✅ Beautiful, modern UI
- ✅ Responsive design

## 📋 Prerequisites

- Node.js 18+ installed
- Wallet Guard API service running on port 8003
- npm or yarn package manager

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8003
```

### API Connection

The dashboard automatically connects to the API service. Make sure:

1. API service is running on port 8003
2. CORS is enabled on the API service
3. API health endpoint is accessible at `/health`

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linting checks
- `npm run type-check` - Run TypeScript type checking

## 🎨 Customization

The dashboard uses:
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **Recharts** - Data visualization
- **Axios** - API client

## 🚀 Next Steps

1. Add wallet monitoring pages
2. Add threat detection visualization
3. Add transaction analysis views
4. Add user authentication
5. Add real-time updates with WebSocket

## 📝 Notes

- The dashboard is a work in progress
- More features will be added based on API capabilities
- Contributions welcome!

