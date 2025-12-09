#!/usr/bin/env python3
"""
Unified Mempool Service
Integrates mempool-core, mempool-hub, and unified-engine into a single service
"""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Add paths
BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

# Import existing services
try:
    from api.unified_api_gateway import app as unified_engine_app
    UNIFIED_ENGINE_AVAILABLE = True
except ImportError:
    UNIFIED_ENGINE_AVAILABLE = False
    unified_engine_app = None

logger = logging.getLogger(__name__)

# Service URLs
MEMPOOL_CORE_URL = os.getenv("MEMPOOL_CORE_URL", "http://localhost:8000")
MEMPOOL_HUB_URL = os.getenv("MEMPOOL_HUB_URL", "http://localhost:8011")
UNIFIED_ENGINE_URL = os.getenv("UNIFIED_ENGINE_URL", "http://localhost:8001")


class ServiceClient:
    """HTTP client for communicating with mempool services"""
    
    def __init__(self):
        self.core_client = httpx.AsyncClient(base_url=MEMPOOL_CORE_URL, timeout=30.0)
        self.hub_client = httpx.AsyncClient(base_url=MEMPOOL_HUB_URL, timeout=30.0)
        self.engine_client = httpx.AsyncClient(base_url=UNIFIED_ENGINE_URL, timeout=30.0)
        self.services_healthy = {
            "mempool-core": False,
            "mempool-hub": False,
            "unified-engine": False,
        }
    
    async def check_health(self) -> Dict[str, bool]:
        """Check health of all services"""
        health_status = {}
        
        # Check mempool-core
        try:
            response = await self.core_client.get("/health")
            health_status["mempool-core"] = response.status_code == 200
        except Exception as e:
            logger.warning(f"mempool-core health check failed: {e}")
            health_status["mempool-core"] = False
        
        # Check mempool-hub
        try:
            response = await self.hub_client.get("/health")
            health_status["mempool-hub"] = response.status_code == 200
        except Exception as e:
            logger.warning(f"mempool-hub health check failed: {e}")
            health_status["mempool-hub"] = False
        
        # Check unified-engine
        try:
            response = await self.engine_client.get("/health")
            health_status["unified-engine"] = response.status_code == 200
        except Exception as e:
            logger.warning(f"unified-engine health check failed: {e}")
            health_status["unified-engine"] = False
        
        self.services_healthy = health_status
        return health_status
    
    async def close(self):
        """Close HTTP clients"""
        await self.core_client.aclose()
        await self.hub_client.aclose()
        await self.engine_client.aclose()


# Global service client
service_client = ServiceClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Starting Unified Mempool Service...")
    await service_client.check_health()
    logger.info("✅ Unified Mempool Service started")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Unified Mempool Service...")
    await service_client.close()
    logger.info("✅ Unified Mempool Service shut down")


# Create FastAPI application
app = FastAPI(
    title="🚀 Unified Mempool Service",
    description="Integrated mempool monitoring, analysis, and protection",
    version="2.0.0",
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ============================================================================
# ROOT & HEALTH ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with service information"""
    health = await service_client.check_health()
    
    return {
        "service": "Unified Mempool Service",
        "version": "2.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "integrated_services": {
            "mempool-core": {
                "url": MEMPOOL_CORE_URL,
                "healthy": health.get("mempool-core", False),
            },
            "mempool-hub": {
                "url": MEMPOOL_HUB_URL,
                "healthy": health.get("mempool-hub", False),
            },
            "unified-engine": {
                "url": UNIFIED_ENGINE_URL,
                "healthy": health.get("unified-engine", False),
            },
        },
        "endpoints": {
            "health": "/health",
            "services": "/api/v1/services",
            "dashboard": "/api/v1/dashboard",
            "transactions": "/api/v1/transactions",
            "analytics": "/api/v1/analytics",
            "mev": "/api/v1/mev",
            "threats": "/api/v1/threats",
            "stats": "/api/v1/stats",
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    health_status = await service_client.check_health()
    overall_healthy = any(health_status.values())
    
    return {
        "status": "healthy" if overall_healthy else "degraded",
        "timestamp": datetime.now().isoformat(),
        "services": health_status,
    }


# ============================================================================
# SERVICE STATUS ENDPOINTS
# ============================================================================

@app.get("/api/v1/services")
async def get_services_status():
    """Get status of all integrated services"""
    health_status = await service_client.check_health()
    
    services_info = []
    
    # Mempool Core info
    try:
        response = await service_client.core_client.get("/api/v1/status")
        core_status = response.json() if response.status_code == 200 else None
    except:
        core_status = None
    
    # Mempool Hub info
    try:
        response = await service_client.hub_client.get("/stats/ethereum")
        hub_status = response.json() if response.status_code == 200 else None
    except:
        hub_status = None
    
    # Unified Engine info
    try:
        response = await service_client.engine_client.get("/api/v1/status")
        engine_status = response.json() if response.status_code == 200 else None
    except:
        engine_status = None
    
    return {
        "services": {
            "mempool-core": {
                "healthy": health_status.get("mempool-core", False),
                "url": MEMPOOL_CORE_URL,
                "status": core_status,
            },
            "mempool-hub": {
                "healthy": health_status.get("mempool-hub", False),
                "url": MEMPOOL_HUB_URL,
                "status": hub_status,
            },
            "unified-engine": {
                "healthy": health_status.get("unified-engine", False),
                "url": UNIFIED_ENGINE_URL,
                "status": engine_status,
            },
        },
        "timestamp": datetime.now().isoformat(),
    }


# ============================================================================
# UNIFIED DASHBOARD ENDPOINT
# ============================================================================

@app.get("/api/v1/dashboard")
async def get_unified_dashboard():
    """Get unified dashboard data from all services"""
    dashboard_data = {
        "timestamp": datetime.now().isoformat(),
        "services": {},
        "aggregated": {},
    }
    
    # Get data from unified-engine (primary source)
    try:
        response = await service_client.engine_client.get("/api/v1/dashboard")
        if response.status_code == 200:
            dashboard_data["services"]["unified-engine"] = response.json()
            dashboard_data["aggregated"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get unified-engine dashboard: {e}")
    
    # Get stats from mempool-hub
    try:
        response = await service_client.hub_client.get("/stats/ethereum")
        if response.status_code == 200:
            dashboard_data["services"]["mempool-hub"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get mempool-hub stats: {e}")
    
    # Get analytics from mempool-core
    try:
        response = await service_client.core_client.get("/api/v1/analytics/dashboard")
        if response.status_code == 200:
            dashboard_data["services"]["mempool-core"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get mempool-core analytics: {e}")
    
    return dashboard_data


# ============================================================================
# UNIFIED TRANSACTIONS ENDPOINT
# ============================================================================

@app.get("/api/v1/transactions")
async def get_unified_transactions(
    limit: int = Query(100, ge=1, le=1000),
    network: Optional[str] = Query(None),
    min_value: Optional[float] = Query(None),
    suspicious_only: bool = Query(False),
):
    """Get transactions from unified-engine (primary) or mempool-core (fallback)"""
    # Try unified-engine first
    try:
        params = {"limit": limit}
        if network:
            params["network"] = network
        if min_value:
            params["min_value"] = min_value
        if suspicious_only:
            params["suspicious_only"] = True
        
        response = await service_client.engine_client.get("/api/v1/transactions", params=params)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.warning(f"Failed to get transactions from unified-engine: {e}")
    
    # Fallback to mempool-core
    try:
        params = {"limit": limit}
        if network:
            params["network"] = network
        
        response = await service_client.core_client.get("/api/v1/transactions", params=params)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.warning(f"Failed to get transactions from mempool-core: {e}")
    
    raise HTTPException(status_code=503, detail="Transaction service unavailable")


# ============================================================================
# UNIFIED ANALYTICS ENDPOINT
# ============================================================================

@app.get("/api/v1/analytics")
async def get_unified_analytics(
    endpoint: str = Query("dashboard", description="Analytics endpoint"),
    network: Optional[str] = Query(None),
):
    """Get analytics from all services"""
    analytics = {
        "timestamp": datetime.now().isoformat(),
        "sources": {},
    }
    
    # Get from unified-engine
    try:
        response = await service_client.engine_client.get(f"/api/v1/analytics/{endpoint}")
        if response.status_code == 200:
            analytics["sources"]["unified-engine"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get unified-engine analytics: {e}")
    
    # Get from mempool-core
    try:
        response = await service_client.core_client.get(f"/api/v1/analytics/{endpoint}")
        if response.status_code == 200:
            analytics["sources"]["mempool-core"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get mempool-core analytics: {e}")
    
    return analytics


# ============================================================================
# UNIFIED MEV ENDPOINT
# ============================================================================

@app.get("/api/v1/mev")
async def get_unified_mev(
    endpoint: str = Query("opportunities", description="MEV endpoint"),
    network: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
):
    """Get MEV data from all services"""
    mev_data = {
        "timestamp": datetime.now().isoformat(),
        "sources": {},
    }
    
    # Get from unified-engine
    try:
        params = {"limit": limit}
        if network:
            params["network"] = network
        
        response = await service_client.engine_client.get(f"/api/v1/mev/{endpoint}", params=params)
        if response.status_code == 200:
            mev_data["sources"]["unified-engine"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get unified-engine MEV data: {e}")
    
    # Get from mempool-core
    try:
        params = {"limit": limit}
        if network:
            params["network"] = network
        
        response = await service_client.core_client.get(f"/api/v1/mev/{endpoint}", params=params)
        if response.status_code == 200:
            mev_data["sources"]["mempool-core"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get mempool-core MEV data: {e}")
    
    return mev_data


# ============================================================================
# UNIFIED THREATS ENDPOINT
# ============================================================================

@app.get("/api/v1/threats")
async def get_unified_threats(
    network: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    """Get threats from mempool-hub and unified-engine"""
    threats_data = {
        "timestamp": datetime.now().isoformat(),
        "sources": {},
    }
    
    # Get from mempool-hub
    try:
        params = {}
        if network:
            params["network"] = network
        if severity:
            params["severity"] = severity
        
        response = await service_client.hub_client.get("/threats", params=params)
        if response.status_code == 200:
            threats_data["sources"]["mempool-hub"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get mempool-hub threats: {e}")
    
    # Get from unified-engine
    try:
        params = {"limit": limit}
        if network:
            params["network"] = network
        if severity:
            params["severity"] = severity
        
        response = await service_client.engine_client.get("/api/v1/threats", params=params)
        if response.status_code == 200:
            threats_data["sources"]["unified-engine"] = response.json()
    except Exception as e:
        logger.warning(f"Failed to get unified-engine threats: {e}")
    
    return threats_data


# ============================================================================
# UNIFIED STATS ENDPOINT
# ============================================================================

@app.get("/api/v1/stats")
async def get_unified_stats(network: str = Query("ethereum")):
    """Get stats from mempool-hub"""
    try:
        response = await service_client.hub_client.get(f"/stats/{network}")
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to get stats")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {e}")


# ============================================================================
# DEVELOPMENT SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "unified_mempool_service:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info",
    )


