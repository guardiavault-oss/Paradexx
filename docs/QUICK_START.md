# Paradox Wallet - Quick Start Guide

Get up and running with Paradox in under 5 minutes!

---

## 🚀 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** and **pnpm 8+**
- ✅ **Python 3.12+** and **uv 0.5+**
- ✅ **Docker** and **Docker Compose**
- ✅ **Git**

---

## ⚡ 5-Minute Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/paradox-wallet.git
cd paradox-wallet

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd src/backend
pnpm install
cd ../..
```

### 2. Configure Environment

```bash
# Copy environment templates
cp .env.example .env
cp src/backend/.env.example src/backend/.env

# Edit .env files with your API keys (optional for local dev)
```

### 3. Start Services

```bash
# Start Docker services (PostgreSQL & Redis)
docker-compose up -d

# Start all application servers
./start-platform.ps1
```

That's it! 🎉

---

## 🌐 Access Your App

Once started, open:

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:3001
- **FastAPI**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🧪 Test Your Setup

```bash
# Test API endpoints
python scripts/test-all-api-endpoints.py

# Run frontend tests
pnpm test
```

---

## 🎮 Try It Out

1. **Open** http://localhost:5000
2. **Click** "Try Demo" to explore without signup
3. **Or** create a wallet:
   - Choose "Easy Setup" (seed phrase)
   - Or "Advanced Setup" (guardian recovery)
4. **Explore** the dashboard, AI assistant, and features

---

## 🛠️ Common Commands

```bash
# Start all services
./start-platform.ps1

# Stop Docker services
docker-compose down

# Restart frontend only
cd paradox && pnpm run dev

# Restart backend only
cd src/backend && pnpm run dev

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :3001
netstat -ano | findstr :8000

# Kill the process (Windows)
taskkill /PID <process-id> /F
```

### Docker Issues

```bash
# Reset Docker
docker-compose down -v
docker-compose up -d
```

### Database Connection Failed

```bash
# Ensure PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres
```

---

## 📚 Next Steps

- [Full Setup Guide](guides/SETUP_GUIDE.md) — Detailed configuration
- [Architecture](ARCHITECTURE.md) — System design
- [API Documentation](API.md) — API reference
- [Design System](design/DESIGN-SYSTEM.md) — UI components

---

## 💡 Tips

- Use **Dev Mode** buttons to skip onboarding during development
- Enable **Demo Mode** in settings to test without real transactions
- Check `docs/guides/COMMAND_CHEATSHEET.md` for useful commands

---

**Need help?** Open an issue on [GitHub](https://github.com/your-org/paradox-wallet/issues)


