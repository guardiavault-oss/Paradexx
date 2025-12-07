#!/usr/bin/env python3
"""
Simple Health Server for Mempool System
"""
import os
from datetime import datetime

import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Mempool Health Server")

# CORS Configuration for Dashboard Access
from fastapi.middleware.cors import CORSMiddleware

# Add this after app = FastAPI(...)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://scorpius-dashboard-v2.surge.sh",
        "https://scorpius.live", 
        "http://scorpius.live",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "unified_mempool_system",
        "timestamp": datetime.now().isoformat(),
        "message": "Mempool monitoring system is operational",
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Unified Mempool System",
        "status": "running",
        "endpoints": {"health": "/health"},
    }


if __name__ == "__main__":
    port = int(os.getenv("API_PORT", "8004"))
    uvicorn.run(app, host="0.0.0.0", port=port)
