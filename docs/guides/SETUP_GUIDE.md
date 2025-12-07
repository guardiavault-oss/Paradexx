# Setup Guide - Complete Wallet Implementation

This guide helps you set up and use the complete wallet implementation.

## 🚀 Quick Setup

### 1. Install Dependencies

#### Backend (Python):
```bash
# For HD wallet derivation (recommended)
pip install bip-utils

# Or alternatives:
pip install pycoin
# or
pip install hdwallet
```

#### Frontend (TypeScript):
```bash
# For structured logging
npm install winston glob @types/winston

# Dependencies should already be installed
npm install
```

### 2. Configure Environment Variables

Create or update `.env` file:

```bash
# Wallet Engine
WALLET_STORAGE_PATH=~/.guardianx/wallet

# Scarlette AI (optional)
ENABLE_SCARLETTE_AI=true
OPENAI_API_KEY=your-openai-key  # Optional
USE_OPENAI_FOR_SCARLETTE=true
REDIS_URL=redis://localhost:6379  # For conversation management

# Logging
LOG_LEVEL=info  # or debug, warn, error
NODE_ENV=development  # or production
```

### 3. Start Backend Server

```bash
# Python FastAPI server
cd app
uvicorn api.main_comprehensive:app --reload --port 8000

# Or TypeScript Express server
cd src/backend
npm run dev
```

### 4. Start Frontend

```bash
npm run dev
```

## 📱 Using the Wallet

### Creating a Wallet

```tsx
import { useWallet } from './contexts/WalletContext';

function CreateWalletPage() {
  const { createWallet } = useWallet();
  
  const handleCreate = async () => {
    try {
      const { mnemonic, account } = await createWallet('your-password');
      
      // IMPORTANT: Save mnemonic securely!
      console.log('Mnemonic:', mnemonic);
      console.log('First account:', account.address);
      
      // Show mnemonic to user for backup
    } catch (error) {
      console.error('Failed:', error);
    }
  };
  
  return <button onClick={handleCreate}>Create Wallet</button>;
}
```

### Using Wallet Components

```tsx
import { WalletManager } from './components/wallet';
import { AccountSwitcher } from './components/wallet';

function WalletPage() {
  return (
    <div>
      {/* Account switcher in header */}
      <AccountSwitcher />
      
      {/* Full wallet manager */}
      <WalletManager />
    </div>
  );
}
```

### Accessing Active Account

```tsx
import { useWallet } from './contexts/WalletContext';

function SendTransaction() {
  const { wallet } = useWallet();
  const activeAccount = wallet?.active_account;
  
  if (!activeAccount) {
    return <div>No account available</div>;
  }
  
  return (
    <div>
      <p>Send from: {activeAccount.address}</p>
      {/* Transaction form */}
    </div>
  );
}
```

## 🔧 API Usage

### Wallet Endpoints

```bash
# Create wallet
POST /api/wallet/create
{
  "password": "your-password"
}

# Import wallet
POST /api/wallet/import
{
  "mnemonic": "word1 word2 ... word12",
  "password": "your-password"
}

# Unlock wallet
POST /api/wallet/unlock
{
  "password": "your-password"
}

# Add account
POST /api/wallet/account/add
{
  "label": "Trading Account"  # optional
}

# Switch account
POST /api/wallet/account/switch
{
  "account_index": 1
}

# List accounts
GET /api/wallet/accounts

# Get status
GET /api/wallet/status
```

### Scarlette AI Endpoints

```bash
# Chat with AI
POST /api/scarlette/chat
{
  "message": "Analyze this contract: 0x...",
  "blockchain_focus": "ethereum"
}

# Execute task
POST /api/scarlette/task
{
  "task_name": "analyze_contract",
  "parameters": {
    "address": "0x...",
    "network": "ethereum"
  }
}

# Health check
GET /api/scarlette/health
```

## 🛠️ Refactoring Tools

### Replace Console.log Statements

```bash
# Preview changes (dry run)
npm run replace-logs

# Actually replace files
npm run replace-logs -- --write

# Process single file
npm run replace-logs -- --file=src/backend/server.ts
```

### Migrate Routes to asyncHandler

See `MIGRATION_GUIDE.md` for detailed instructions.

Example:
```typescript
// Before
router.get('/endpoint', async (req, res) => {
  try {
    const data = await operation();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// After
import { asyncHandler } from '../utils/asyncHandler';

router.get('/endpoint', asyncHandler(async (req, res) => {
  const data = await operation();
  res.json(data);
}));
```

## ✅ Verification Checklist

### Wallet Implementation:
- [ ] WalletProvider added to App.tsx
- [ ] Backend server running
- [ ] Can create wallet via API
- [ ] Can unlock wallet
- [ ] Can add accounts
- [ ] Can switch accounts
- [ ] UI components render correctly

### Scarlette Integration:
- [ ] Backend server includes Scarlette router
- [ ] Health check endpoint responds
- [ ] Chat endpoint works
- [ ] Task execution works
- [ ] LocalAIAgent connected

### Refactoring:
- [ ] Logger service imported in routes
- [ ] asyncHandler utility available
- [ ] Replacement script runs successfully
- [ ] Routes migrated to asyncHandler

## 🐛 Troubleshooting

### Wallet Issues:

**"Wallet service unavailable"**
- Check backend server is running
- Verify Python dependencies installed
- Check API endpoint URL

**"Invalid password"**
- Ensure password matches wallet password
- Check encryption key derivation

**"No wallet found"**
- Create or import wallet first
- Check wallet storage path

### Scarlette Issues:

**"Scarlette AI not available"**
- Check `ENABLE_SCARLETTE_AI=true` in config
- Verify Scarlette service path exists
- Check Python imports

**"Integration not initialized"**
- Call `/api/scarlette/initialize` endpoint
- Check Redis connection (if using conversation management)
- Verify OpenAI API key (if using OpenAI)

### Refactoring Issues:

**Import errors after log replacement**
- Check import paths match file structure
- Update imports manually if needed
- Verify logger.service.ts exists

**Routes not catching errors**
- Ensure Express error handler middleware configured
- Check asyncHandler wrapper applied correctly
- Verify error handler in server.ts

## 📚 Documentation

- `WALLET_IMPLEMENTATION.md` - Complete wallet guide
- `SCARLETTE_API_ENDPOINTS.md` - AI API documentation
- `REFACTORING_GUIDE.md` - Refactoring instructions
- `MIGRATION_GUIDE.md` - Route migration guide
- `PROGRESS_SUMMARY.md` - Overall progress

## 🎯 Next Steps

1. **Test Wallet**: Create wallet, add accounts, switch between them
2. **Test AI**: Try chat endpoint, execute tasks
3. **Run Refactoring**: Replace console.log, migrate routes
4. **Build Features**: DApp connectivity, WebSocket, transaction queue

## 💡 Tips

- Start with wallet creation and test incrementally
- Use dry-run mode for log replacement first
- Test one route migration at a time
- Keep backups before running automated scripts
- Review git diff before committing changes

---

**Ready to go!** All foundation work is complete. Start testing and building features! 🚀

