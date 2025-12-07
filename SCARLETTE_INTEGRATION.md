# Scarlette AI Service Integration Guide

## ✅ Integration Complete

The Scarlette AI Service has been successfully integrated with your wallet app. All frontend components are now connected to the real API endpoints.

## 🔧 What Was Changed

### 1. **Service Layer** (`src/services/scarletteAI.ts`)
- ✅ Updated API URL detection to support environment variables
- ✅ Enhanced error handling with fallback responses
- ✅ Improved session management
- ✅ Added proper request/response handling
- ✅ Added logging for debugging

### 2. **Chat Component** (`src/components/ScarletteChat.tsx`)
- ✅ Replaced mock responses with real API calls
- ✅ Added API health checking
- ✅ Integrated with Scarlette AI service
- ✅ Added connection status indicators
- ✅ Proper session management
- ✅ Error handling with user-friendly messages

### 3. **WebSocket Hook** (`src/hooks/useScarletteWebSocket.ts`)
- ✅ Fixed WebSocket endpoint (now uses `/ws` instead of `/api/scarlette/ws`)
- ✅ Improved connection handling
- ✅ Better error recovery

### 4. **Will AI Hook** (`src/hooks/useScarletteWillAI.ts`)
- ✅ Replaced mock data with real API calls
- ✅ Added availability checking
- ✅ Proper error handling with fallbacks

## 🚀 Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root of your wallet app:

```env
# Scarlette AI Service API URL
VITE_SCARLETTE_API_URL=http://localhost:8000
```

**For Production:**
```env
VITE_SCARLETTE_API_URL=https://your-scarlette-service.com
```

### 2. Start the Scarlette AI Service

From the `scarlette service` directory:

```bash
# Option 1: Using Docker
docker-compose up -d

# Option 2: Direct Python
cd "scarlette service"
pip install -r requirements.txt
python -m uvicorn src.scarlette_ai.main:app --host 0.0.0.0 --port 8000
```

### 3. Start Your Wallet App

```bash
npm run dev
# or
pnpm dev
```

## 📡 API Endpoints Used

The integration uses the following endpoints:

1. **Health Check**: `GET /health`
   - Used to verify service availability
   - Called on component mount

2. **Chat**: `POST /chat`
   - Main chat endpoint for AI conversations
   - Supports session management
   - Includes blockchain focus and task execution

3. **WebSocket**: `WS /ws`
   - Real-time bidirectional communication
   - Optional (can be enabled in settings)

4. **Greeting**: `POST /greeting` (available but not currently used)
5. **Task**: `POST /task` (available but not currently used)

## 🎯 Features

### ✅ Implemented
- Real-time chat with Scarlette AI
- Session management
- Connection status indicators
- Error handling with fallbacks
- Settings integration (blockchain focus, auto-execute tasks)
- Health checking
- Will planning suggestions (via `useScarletteWillAI`)

### 🔄 Optional Features
- WebSocket real-time chat (can be enabled in settings)
- Task execution (automatically executed when detected in messages)

## 🧪 Testing

1. **Test Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test Chat:**
   ```bash
   curl -X POST http://localhost:8000/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Hello Scarlette!",
       "user_id": "test-user"
     }'
   ```

3. **Test in UI:**
   - Open your wallet app
   - Click the Scarlette chat button
   - Send a message and verify you get a real AI response

## 🐛 Troubleshooting

### Service Not Available
- **Symptom**: Red connection indicator, "Service Unavailable" message
- **Solution**: 
  1. Verify Scarlette service is running: `curl http://localhost:8000/health`
  2. Check environment variable: `VITE_SCARLETTE_API_URL`
  3. Check browser console for CORS errors

### CORS Errors
- **Symptom**: Network errors in browser console
- **Solution**: The Scarlette service already has CORS enabled for all origins. If issues persist, check:
  - Service is running on correct port
  - Environment variable points to correct URL

### WebSocket Connection Fails
- **Symptom**: WebSocket doesn't connect
- **Solution**: 
  1. Verify WebSocket endpoint: `ws://localhost:8000/ws`
  2. Check if WebSocket is enabled in settings
  3. Check browser console for connection errors

### No AI Responses
- **Symptom**: Messages sent but no response
- **Solution**:
  1. Check service logs for errors
  2. Verify OpenAI API key is set (if using OpenAI)
  3. Check network tab for failed requests

## 📝 Configuration Options

### Settings (stored in localStorage)
- **useWebSocket**: Enable/disable WebSocket real-time chat
- **blockchainFocus**: Default blockchain for analysis (ethereum, polygon, etc.)
- **autoExecuteTasks**: Automatically execute AI tasks when detected

### Environment Variables
- **VITE_SCARLETTE_API_URL**: API base URL (default: http://localhost:8000)
- **VITE_API_URL**: Fallback API URL
- **VITE_LOG_LEVEL**: Logging level (debug, info, warn, error)

## 🔐 Security Notes

- The service uses CORS middleware allowing all origins (configured in Scarlette service)
- Session IDs are managed client-side
- No authentication required for basic chat (can be added if needed)
- API keys for OpenAI should be set in the Scarlette service environment, not the frontend

## 📚 Next Steps

1. **Add Authentication**: If you want user-specific sessions, pass user IDs from your auth context
2. **WebSocket Integration**: Enable WebSocket in settings for real-time chat
3. **Error Monitoring**: Add error tracking (Sentry, etc.)
4. **Analytics**: Track usage patterns
5. **Rate Limiting**: Implement client-side rate limiting if needed

## 🎉 Success!

Your Scarlette AI integration is complete and ready to use! The chat component will automatically connect to the service when available and provide real AI-powered responses.

