#!/usr/bin/env python3
"""
Service Integration for Unified API Gateway
Integrates mempool-core, mempool-hub, and mempool-ingestor into unified gateway
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

# Add paths - handle both direct execution and import
BASE_DIR = Path(__file__).parent
if BASE_DIR.name == "api":
    BASE_DIR = BASE_DIR.parent
sys.path.insert(0, str(BASE_DIR / "src" / "unified_mempool"))

logger = logging.getLogger(__name__)

# Service URLs (configurable via environment)
MEMPOOL_CORE_URL = "http://localhost:8000"
MEMPOOL_HUB_URL = "http://localhost:8011"
MEMPOOL_INGESTOR_URL = "http://localhost:8012"


class ServiceIntegration:
    """Manages integration with mempool services"""
    
    def __init__(self):
        self.core_client = httpx.AsyncClient(base_url=MEMPOOL_CORE_URL, timeout=30.0)
        self.hub_client = httpx.AsyncClient(base_url=MEMPOOL_HUB_URL, timeout=30.0)
        self.services_healthy = {
            "mempool-core": False,
            "mempool-hub": False,
            "mempool-ingestor": False,
        }
    
    async def check_health(self) -> Dict[str, bool]:
        """Check health of all integrated services"""
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
        
        self.services_healthy = health_status
        return health_status
    
    async def get_core_transactions(
        self, 
        limit: int = 100,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get transactions from mempool-core"""
        try:
            params = {"limit": limit}
            if network:
                params["network"] = network
            
            response = await self.core_client.get("/api/v1/transactions", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get transactions from mempool-core: {e}")
            raise HTTPException(status_code=503, detail=f"mempool-core unavailable: {e}")
    
    async def get_hub_stats(self, network: str) -> Dict[str, Any]:
        """Get mempool stats from mempool-hub"""
        try:
            response = await self.hub_client.get(f"/stats/{network}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get stats from mempool-hub: {e}")
            raise HTTPException(status_code=503, detail=f"mempool-hub unavailable: {e}")
    
    async def get_hub_threats(self) -> Dict[str, Any]:
        """Get threats from mempool-hub"""
        try:
            response = await self.hub_client.get("/threats")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get threats from mempool-hub: {e}")
            raise HTTPException(status_code=503, detail=f"mempool-hub unavailable: {e}")
    
    async def analyze_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction using mempool-hub"""
        try:
            response = await self.hub_client.post("/analyze", json=transaction_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to analyze transaction: {e}")
            raise HTTPException(status_code=503, detail=f"mempool-hub unavailable: {e}")
    
    async def get_core_analytics(self, endpoint: str = "dashboard") -> Dict[str, Any]:
        """Get analytics from mempool-core"""
        try:
            response = await self.core_client.get(f"/api/v1/analytics/{endpoint}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get analytics from mempool-core: {e}")
            raise HTTPException(status_code=503, detail=f"mempool-core unavailable: {e}")
    
    async def close(self):
        """Close HTTP clients"""
        await self.core_client.aclose()
        await self.hub_client.aclose()


# Global service integration instance
service_integration = ServiceIntegration()


def create_integration_router() -> APIRouter:
    """Create router for integrated services"""
    router = APIRouter(prefix="/api/v1/integrated", tags=["integrated-services"])
    
    @router.get("/health")
    async def integrated_health():
        """Get health status of all integrated services"""
        health = await service_integration.check_health()
        overall_healthy = all(health.values())
        
        return {
            "status": "healthy" if overall_healthy else "degraded",
            "services": health,
            "timestamp": asyncio.get_event_loop().time()
        }
    
    @router.get("/transactions")
    async def get_integrated_transactions(
        limit: int = Query(100, ge=1, le=1000),
        network: Optional[str] = Query(None)
    ):
        """Get transactions from mempool-core"""
        return await service_integration.get_core_transactions(limit=limit, network=network)
    
    @router.get("/stats/{network}")
    async def get_integrated_stats(network: str):
        """Get mempool stats from mempool-hub"""
        return await service_integration.get_hub_stats(network)
    
    @router.get("/threats")
    async def get_integrated_threats():
        """Get threats from mempool-hub"""
        return await service_integration.get_hub_threats()
    
    @router.post("/analyze")
    async def analyze_integrated_transaction(transaction_data: Dict[str, Any]):
        """Analyze transaction using mempool-hub"""
        return await service_integration.analyze_transaction(transaction_data)
    
    @router.get("/analytics/{endpoint}")
    async def get_integrated_analytics(endpoint: str):
        """Get analytics from mempool-core"""
        return await service_integration.get_core_analytics(endpoint)
    
    return router


# Export for use in unified_api_gateway.py
__all__ = ["ServiceIntegration", "service_integration", "create_integration_router"]

