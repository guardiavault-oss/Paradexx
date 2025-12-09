# GuardiaVault - Railway Deployment

This project is configured for Railway deployment using Docker.

## Build Process
- Uses Dockerfile for consistent build environment
- Multi-stage build for optimization
- pnpm package manager
- Node.js 20

## Deployment
- Configured with railway.json and .railwayapp.json
- Health check endpoint: /health
- Automatic restart on failure
- Production-ready startup script

## Environment Variables Required
See env.example for full list of required environment variables.