#!/usr/bin/env python3
"""
Simple development server that doesn't require database
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MEV Guard API",
    description="MEV Protection Service - Development Mode",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "development"}

@app.get("/api/v1/dashboard")
async def dashboard():
    return {
        "overview": {
            "active_protections": 0,
            "threats_detected_24h": 0,
            "transactions_protected_24h": 0,
            "value_protected_24h": 0
        },
        "networks": {},
        "recent_threats": [],
        "timestamp": "2024-01-01T00:00:00"
    }

@app.get("/api/v1/threats")
async def threats():
    return {
        "threats": [],
        "total_count": 0,
        "limit": 100,
        "offset": 0,
        "timestamp": "2024-01-01T00:00:00"
    }

@app.get("/api/v1/transactions")
async def transactions():
    return {
        "transactions": [],
        "total_count": 0,
        "limit": 100,
        "offset": 0,
        "timestamp": "2024-01-01T00:00:00"
    }

@app.get("/api/v1/stats")
async def stats():
    return {
        "statistics": {
            "threats_detected": 0,
            "threats_mitigated": 0,
            "transactions_protected": 0,
            "value_protected": 0,
            "gas_saved": 0,
            "protection_success_rate": 0,
            "active_protections": 0
        },
        "timeframe": "24h",
        "timestamp": "2024-01-01T00:00:00"
    }

if __name__ == "__main__":
    print("🚀 Starting MEV Guard API (Development Mode)")
    print("📍 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

