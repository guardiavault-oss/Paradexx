#!/usr/bin/env python3
"""
Vault API Server
Handles inheritance vault operations
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.vault_endpoints import router

app = FastAPI(title="GuardiaVault API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include vault endpoints
app.include_router(router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "GuardiaVault API",
        "version": "1.0.0",
        "status": "online",
        "endpoints": [
            "/api/vault/create",
            "/api/vault/{vault_id}",
            "/api/vault/{vault_id}/checkin",
            "/api/vault/{vault_id}/attest",
            "/api/vault/{vault_id}/claim",
            "/api/vault/{vault_id}/status",
            "/api/vault/user/vaults",
            "/api/vault/stats/global"
        ]
    }

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}

if __name__ == "__main__":
    print("\n" + "="*50)
    print("GuardiaVault API Server")
    print("="*50)
    print(f"API: http://localhost:8004")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8004, log_level="info")

