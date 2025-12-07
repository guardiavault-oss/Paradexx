#!/usr/bin/env python3
"""
Comprehensive Main API Server
Combines all backend endpoints for the complete feature set
"""

import asyncio
import os
from typing import Any
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
from app.core.utils import get_utc_timestamp

# Import all routers
try:
    from app.api.settings_endpoints import router as settings_router
    from app.api.account_endpoints import router as account_router
    from app.api.transaction_history_endpoints import router as transaction_router
    from app.api.security_endpoints import router as security_router
    from app.api.notification_endpoints import router as notification_router
    from app.api.support_endpoints import router as support_router
    from app.api.error_endpoints import router as error_router
    from app.api.legal_endpoints import router as legal_router
    from app.api.biometric_endpoints import router as biometric_router
    # Import AI endpoints for Scarlette AI assistant
    try:
        from app.api.ai_endpoints import router as ai_router
    except ImportError:
        ai_router = None
    # Import MEV protection endpoints
    try:
        from app.api.mev_endpoints import router as mev_router
    except ImportError:
        mev_router = None
    # Import bridge endpoints (already have cross_chain_bridge_integration)
    try:
        from app.api.bridge_endpoints import router as bridge_router
    except ImportError:
        bridge_router = None
    # Import bridge service endpoints
    try:
        from app.api.bridge_service_endpoints import router as bridge_service_router
    except ImportError:
        bridge_service_router = None
    # Import wallet endpoints for transaction sending
    try:
        from app.api.wallet_endpoints import router as wallet_router
    except ImportError:
        wallet_router = None
    # Import existing vault endpoints if available
    try:
        from app.api.vault_endpoints import router as vault_router
    except ImportError:
        vault_router = None
    # Import Inheritance endpoints
    try:
        from app.api.inheritance_endpoints import router as inheritance_router
    except ImportError:
        inheritance_router = None
    try:
        from app.api.fiat_onramp_endpoints import router as fiat_router
    except ImportError:
        fiat_router = None
    try:
        from app.api.dex_aggregator_endpoints import router as dex_router
    except ImportError:
        dex_router = None
    try:
        from app.api.cross_chain_swap_endpoints import router as cross_chain_router
    except ImportError:
        cross_chain_router = None
    try:
        from app.api.nft_gallery_endpoints import router as nft_router
    except ImportError:
        nft_router = None
    try:
        from app.api.market_data_endpoints import router as market_router
    except ImportError:
        market_router = None
    try:
        from app.api.wallet_guard_endpoints import router as wallet_guard_router
    except ImportError:
        wallet_guard_router = None
except ImportError as e:
    print(f"Warning: Some routers could not be imported: {e}")
    settings_router = None
    account_router = None
    transaction_router = None
    security_router = None
    notification_router = None
    support_router = None
    error_router = None
    legal_router = None
    biometric_router = None
    ai_router = None
    mev_router = None
    bridge_router = None
    bridge_service_router = None
    wallet_router = None
    vault_router = None
    fiat_router = None
    dex_router = None
    cross_chain_router = None
    nft_router = None
    market_router = None
    wallet_guard_router = None
    inheritance_router = None

try:
    from app.core.wallet_guard_client import get_wallet_guard_client
except ImportError:
    get_wallet_guard_client = None

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    import asyncio
    logger.info("Starting GuardianX Comprehensive API Server")
    
    # Background initialization task
    async def init_background_services():
        """Initialize services in background without blocking"""
        await asyncio.sleep(2)  # Let server fully start first
        
        try:
            from app.core.bridge_service_client import get_bridge_service_client
            get_bridge_service_client()
            logger.info("Bridge service client created")
        except Exception as e:
            logger.warning(f"Bridge service client skipped: {e}")
        
        try:
            from app.wallet_guard import wallet_guard_service
            if wallet_guard_service and not wallet_guard_service.core_services_initialized:
                await asyncio.wait_for(wallet_guard_service.initialize_core_services(), timeout=10.0)
                logger.info("Wallet Guard service initialized")
        except Exception as e:
            logger.warning(f"Wallet Guard skipped: {e}")
        
        try:
            from app.core.scarlette_integration import initialize_scarlette
            await asyncio.wait_for(initialize_scarlette(), timeout=15.0)
            logger.info("Scarlette AI initialized")
        except Exception as e:
            logger.warning(f"Scarlette AI skipped: {e}")
    
    # Start background init without waiting
    asyncio.create_task(init_background_services())
    
    logger.info("Server ready - services initializing in background")
    
    try:
        yield
    finally:
        logger.info("Shutting down GuardianX Comprehensive API Server")


# Create FastAPI app
app = FastAPI(
    title="GuardianX Comprehensive API",
    description="Complete backend API for GuardianX wallet with all features",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "status_code": 500
        }
    )


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "success": True,
        "message": "GuardianX Comprehensive API Server",
        "version": "2.0.0",
        "timestamp": get_utc_timestamp()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint - simplified for fast response"""
    import datetime
    return {
        "success": True,
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "version": "2.0.0"
    }


# Include all routers
if settings_router:
    app.include_router(settings_router)
    logger.info("Settings router included")

if account_router:
    app.include_router(account_router)
    logger.info("Account router included")

if transaction_router:
    app.include_router(transaction_router)
    logger.info("Transaction router included")

if security_router:
    app.include_router(security_router)
    logger.info("Security router included")

if notification_router:
    app.include_router(notification_router)
    logger.info("Notification router included")

if support_router:
    app.include_router(support_router)
    logger.info("Support router included")

if error_router:
    app.include_router(error_router)
    logger.info("Error router included")

if legal_router:
    app.include_router(legal_router)
    logger.info("Legal router included")

if biometric_router:
    app.include_router(biometric_router)
    logger.info("Biometric router included")

if ai_router:
    app.include_router(ai_router)
    logger.info("AI router included")

if mev_router:
    app.include_router(mev_router)
    logger.info("MEV protection router included")

if bridge_router:
    app.include_router(bridge_router)
    logger.info("Bridge router included")

if wallet_router:
    app.include_router(wallet_router)
    logger.info("Wallet router included")

if vault_router:
    app.include_router(vault_router)
    logger.info("Vault router included")

if fiat_router:
    app.include_router(fiat_router)
    logger.info("Fiat on-ramp router included")

if dex_router:
    app.include_router(dex_router)
    logger.info("DEX aggregator router included")

if cross_chain_router:
    app.include_router(cross_chain_router)
    logger.info("Cross-chain router included")

if bridge_service_router:
    app.include_router(bridge_service_router)
    logger.info("Bridge service router included")

if nft_router:
    app.include_router(nft_router)
    logger.info("NFT router included")

if market_router:
    app.include_router(market_router)
    logger.info("Market data router included")

if wallet_guard_router:
    app.include_router(wallet_guard_router)
    logger.info("Wallet Guard router included")

if inheritance_router:
    app.include_router(inheritance_router)
    logger.info("Inheritance router included")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.api.main_comprehensive:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

