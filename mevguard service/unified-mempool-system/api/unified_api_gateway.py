#!/usr/bin/env python3
"""
Unified API Gateway - World-Class Mempool Monitoring API
========================================================
Comprehensive REST API with real-time streaming, advanced analytics,
and enterprise-grade features for mempool monitoring.
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

import uvicorn
import yaml
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from core.unified_mempool_engine import MEVType, NetworkType, ThreatLevel, UnifiedMempoolEngine

# Import service integration
try:
    from integrate_services import create_integration_router, service_integration
    INTEGRATION_AVAILABLE = True
except ImportError:
    INTEGRATION_AVAILABLE = False
    logger.warning("Service integration not available - install dependencies")

logger = logging.getLogger(__name__)

# Global engine instance
engine: UnifiedMempoolEngine | None = None


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)

        # Clean up disconnected connections
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# Pydantic models for request/response validation
class TransactionFilter(BaseModel):
    network: str | None = None
    suspicious_only: bool = False
    min_value: float | None = None
    max_value: float | None = None
    min_gas_price: int | None = None
    max_gas_price: int | None = None
    from_address: str | None = None
    to_address: str | None = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class MEVFilter(BaseModel):
    network: str | None = None
    mev_type: str | None = None
    min_profit: float | None = None
    min_confidence: float | None = None
    limit: int = Field(default=50, ge=1, le=500)


class ThreatFilter(BaseModel):
    severity: str | None = None
    network: str | None = None
    source: str | None = None
    limit: int = Field(default=50, ge=1, le=500)


class AlertSubscription(BaseModel):
    alert_types: list[str]
    networks: list[str]
    min_severity: str = "medium"
    webhook_url: str | None = None


# Application lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    global engine

    # Startup
    logger.info("🚀 Starting Unified Mempool API Gateway...")

    try:
        # Load configuration
        with open("/workspace/unified-mempool-system/config/config.yaml") as f:
            config = yaml.safe_load(f)

        # Initialize and start the engine
        engine = UnifiedMempoolEngine(config)
        await engine.initialize()
        await engine.start_monitoring()

        logger.info("✅ Mempool engine started successfully")

        # Start background tasks
        asyncio.create_task(broadcast_updates())
        
        # Initialize service integration if available
        if INTEGRATION_AVAILABLE:
            try:
                await service_integration.check_health()
                logger.info("✅ Service integration initialized")
            except Exception as e:
                logger.warning(f"⚠️ Service integration health check failed: {e}")

    except Exception as e:
        logger.error(f"❌ Failed to start mempool engine: {e}")
        raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down Unified Mempool API Gateway...")
    if engine:
        await engine.stop_monitoring()
    
    # Close service integration
    if INTEGRATION_AVAILABLE:
        try:
            await service_integration.close()
        except Exception as e:
            logger.warning(f"Error closing service integration: {e}")
    
    logger.info("✅ Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="🚀 Unified Mempool System API",
    description="""
    **World-Class Mempool Monitoring System**
    
    Advanced real-time blockchain mempool monitoring with:
    - Multi-chain support (Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche)
    - Advanced MEV detection (sandwich attacks, arbitrage, flash loans)
    - ML-powered risk scoring and threat analysis
    - Real-time streaming and WebSocket support
    - Comprehensive analytics and reporting
    - Enterprise-grade performance and security
    
    ## Features
    - 📡 **Real-time Monitoring**: Live mempool data from multiple blockchains
    - 🔍 **MEV Detection**: Advanced algorithms for detecting MEV opportunities
    - 🧠 **ML Risk Scoring**: Machine learning-powered transaction risk assessment
    - 🚨 **Threat Intelligence**: Global threat feeds and behavioral analysis
    - 📊 **Analytics**: Comprehensive performance and security analytics
    - 🔄 **Streaming**: Real-time WebSocket streaming for live updates
    - 🛡️ **Security**: Enterprise-grade security and data protection
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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

# Security
security = HTTPBearer(auto_error=False)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Optional authentication (can be extended)"""
    return {"user": "anonymous"}


# Background task for broadcasting updates
async def broadcast_updates():
    """Broadcast real-time updates to WebSocket clients"""
    while True:
        try:
            if engine and engine.is_monitoring and manager.active_connections:
                # Get latest data
                dashboard_data = await engine.get_live_dashboard_data()

                # Broadcast to all connected clients
                message = json.dumps(
                    {
                        "type": "dashboard_update",
                        "timestamp": datetime.now().isoformat(),
                        "data": dashboard_data,
                    }
                )

                await manager.broadcast(message)

            await asyncio.sleep(2)  # Broadcast every 2 seconds

        except Exception as e:
            logger.error(f"❌ Broadcast error: {e}")
            await asyncio.sleep(5)


# Root and Health Endpoints
@app.get("/", tags=["System"])
async def root():
    """Root endpoint with system information"""
    endpoints = {
        "docs": "/docs",
        "health": "/health",
        "status": "/api/v1/status",
        "dashboard": "/api/v1/dashboard",
        "transactions": "/api/v1/transactions",
        "mev": "/api/v1/mev/opportunities",
        "threats": "/api/v1/threats",
        "streaming": "/api/v1/stream",
    }
    
    # Add integrated service endpoints if available
    if INTEGRATION_AVAILABLE:
        endpoints["integrated"] = "/api/v1/integrated"
        endpoints["integrated_health"] = "/api/v1/integrated/health"
    
    return {
        "message": "🚀 Unified Mempool System API",
        "version": "2.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "Real-time multi-chain monitoring",
            "Advanced MEV detection",
            "ML-powered risk scoring",
            "Threat intelligence",
            "Real-time streaming",
            "Comprehensive analytics",
        ],
        "integrated_services": INTEGRATION_AVAILABLE,
        "endpoints": endpoints,
    }


@app.get("/health", tags=["System"])
async def health():
    """Health check endpoint"""
    global engine

    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    status = await engine.get_system_status()

    return {
        "status": "healthy" if engine.is_monitoring else "degraded",
        "service": "unified_mempool_api",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": status.get("uptime_seconds", 0),
        "networks_active": len(status.get("active_networks", [])),
        "transactions_processed": status.get("statistics", {}).get("total_transactions", 0),
        "memory_usage": f"{status.get('performance', {}).get('memory_usage', 0):.1f}%",
        "cpu_usage": f"{status.get('performance', {}).get('cpu_usage', 0):.1f}%",
    }


# System Status and Dashboard
@app.get("/api/v1/status", tags=["System"], summary="Get comprehensive system status")
async def get_system_status(user=Depends(get_current_user)):
    """Get detailed system status including performance metrics"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    return await engine.get_system_status()


@app.get("/api/v1/dashboard", tags=["Dashboard"], summary="Get live dashboard data")
async def get_dashboard_data(user=Depends(get_current_user)):
    """Get comprehensive dashboard data for monitoring interfaces"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    return await engine.get_live_dashboard_data()


# Transaction Endpoints
@app.get("/api/v1/transactions", tags=["Transactions"], summary="Get transactions with filtering")
async def get_transactions(
    network: str | None = Query(None, description="Filter by network"),
    suspicious_only: bool = Query(False, description="Show only suspicious transactions"),
    min_value: float | None = Query(None, description="Minimum value in ETH"),
    max_value: float | None = Query(None, description="Maximum value in ETH"),
    min_gas_price: int | None = Query(None, description="Minimum gas price in wei"),
    max_gas_price: int | None = Query(None, description="Maximum gas price in wei"),
    from_address: str | None = Query(None, description="Filter by sender address"),
    to_address: str | None = Query(None, description="Filter by recipient address"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user=Depends(get_current_user),
):
    """
    Retrieve transactions with advanced filtering options.

    Supports filtering by network, value range, gas price, addresses, and more.
    Returns paginated results with comprehensive transaction data.
    """
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    # Get all transactions
    all_transactions = list(engine.pending_transactions.values())

    # Apply filters
    filtered_transactions = all_transactions

    if network:
        try:
            network_type = NetworkType(network.lower())
            filtered_transactions = [
                tx for tx in filtered_transactions if tx.network == network_type
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid network: {network}")

    if suspicious_only:
        filtered_transactions = [tx for tx in filtered_transactions if tx.is_suspicious]

    if min_value is not None:
        min_value_wei = int(min_value * 1e18)
        filtered_transactions = [tx for tx in filtered_transactions if tx.value >= min_value_wei]

    if max_value is not None:
        max_value_wei = int(max_value * 1e18)
        filtered_transactions = [tx for tx in filtered_transactions if tx.value <= max_value_wei]

    if min_gas_price is not None:
        filtered_transactions = [
            tx for tx in filtered_transactions if tx.gas_price >= min_gas_price
        ]

    if max_gas_price is not None:
        filtered_transactions = [
            tx for tx in filtered_transactions if tx.gas_price <= max_gas_price
        ]

    if from_address:
        filtered_transactions = [
            tx for tx in filtered_transactions if tx.from_address.lower() == from_address.lower()
        ]

    if to_address:
        filtered_transactions = [
            tx
            for tx in filtered_transactions
            if tx.to_address and tx.to_address.lower() == to_address.lower()
        ]

    # Sort by timestamp (newest first)
    filtered_transactions.sort(key=lambda x: x.timestamp, reverse=True)

    # Apply pagination
    paginated_transactions = filtered_transactions[offset : offset + limit]

    return {
        "transactions": [tx.to_dict() for tx in paginated_transactions],
        "total_count": len(filtered_transactions),
        "filtered_count": len(paginated_transactions),
        "offset": offset,
        "limit": limit,
        "has_more": len(filtered_transactions) > offset + limit,
    }


@app.get("/api/v1/transactions/{tx_hash}", tags=["Transactions"], summary="Get transaction details")
async def get_transaction_details(tx_hash: str, user=Depends(get_current_user)):
    """Get detailed information about a specific transaction"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    if tx_hash not in engine.pending_transactions:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx = engine.pending_transactions[tx_hash]

    # Add additional analysis if available
    tx_data = tx.to_dict()

    # Check if transaction is part of any MEV opportunities
    related_mev = [mev for mev in engine.detected_mev_opportunities if tx_hash in str(mev)]

    if related_mev:
        tx_data["mev_opportunities"] = related_mev

    return tx_data


# MEV Detection Endpoints
@app.get("/api/v1/mev/opportunities", tags=["MEV Detection"], summary="Get MEV opportunities")
async def get_mev_opportunities(
    network: str | None = Query(None, description="Filter by network"),
    mev_type: str | None = Query(None, description="Filter by MEV type"),
    min_profit: float | None = Query(None, description="Minimum profit in ETH"),
    min_confidence: float | None = Query(None, description="Minimum confidence score"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of results"),
    user=Depends(get_current_user),
):
    """
    Get detected MEV opportunities including sandwich attacks, arbitrage, and flash loans.

    Returns comprehensive data about MEV opportunities with profit estimates and confidence scores.
    """
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    # Get MEV opportunities
    opportunities = engine.detected_mev_opportunities.copy()

    # Apply filters
    if network:
        opportunities = [
            op for op in opportunities if op.get("network", "").lower() == network.lower()
        ]

    if mev_type:
        try:
            mev_type_enum = MEVType(mev_type.lower())
            opportunities = [op for op in opportunities if op.get("type") == mev_type_enum]
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid MEV type: {mev_type}")

    if min_profit is not None:
        opportunities = [op for op in opportunities if op.get("profit_estimate", 0) >= min_profit]

    if min_confidence is not None:
        opportunities = [op for op in opportunities if op.get("confidence", 0) >= min_confidence]

    # Sort by profit estimate (highest first)
    opportunities.sort(key=lambda x: x.get("profit_estimate", 0), reverse=True)

    # Apply limit
    limited_opportunities = opportunities[:limit]

    # Convert MEVType enums to strings for JSON serialization
    for op in limited_opportunities:
        if "type" in op and hasattr(op["type"], "value"):
            op["type"] = op["type"].value

    return {
        "opportunities": limited_opportunities,
        "total_count": len(opportunities),
        "returned_count": len(limited_opportunities),
        "summary": {
            "total_profit_estimate": sum(op.get("profit_estimate", 0) for op in opportunities),
            "average_confidence": (
                sum(op.get("confidence", 0) for op in opportunities) / len(opportunities)
                if opportunities
                else 0
            ),
            "types_detected": list(
                set(
                    (
                        op.get("type", {}).value
                        if hasattr(op.get("type", {}), "value")
                        else str(op.get("type", "unknown"))
                    )
                    for op in opportunities
                )
            ),
        },
    }


@app.get("/api/v1/mev/statistics", tags=["MEV Detection"], summary="Get MEV statistics")
async def get_mev_statistics(
    timeframe: str = Query("1h", description="Timeframe: 1h, 6h, 24h, 7d"),
    user=Depends(get_current_user),
):
    """Get comprehensive MEV detection statistics"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    # Calculate timeframe
    timeframe_map = {"1h": 1, "6h": 6, "24h": 24, "7d": 168}
    hours = timeframe_map.get(timeframe, 1)
    cutoff_time = datetime.now() - timedelta(hours=hours)

    # Filter recent opportunities
    recent_opportunities = [
        op
        for op in engine.detected_mev_opportunities
        if "timestamp" in op and datetime.fromisoformat(op["timestamp"]) > cutoff_time
    ]

    # Calculate statistics
    stats = {
        "timeframe": timeframe,
        "total_opportunities": len(recent_opportunities),
        "total_profit_estimate": sum(op.get("profit_estimate", 0) for op in recent_opportunities),
        "average_profit": (
            sum(op.get("profit_estimate", 0) for op in recent_opportunities)
            / len(recent_opportunities)
            if recent_opportunities
            else 0
        ),
        "types": {},
        "networks": {},
        "confidence_distribution": {"high": 0, "medium": 0, "low": 0},
    }

    # Analyze by type and network
    for op in recent_opportunities:
        # Type analysis
        op_type = str(op.get("type", "unknown"))
        if hasattr(op.get("type"), "value"):
            op_type = op["type"].value
        stats["types"][op_type] = stats["types"].get(op_type, 0) + 1

        # Network analysis
        network = op.get("network", "unknown")
        stats["networks"][network] = stats["networks"].get(network, 0) + 1

        # Confidence distribution
        confidence = op.get("confidence", 0)
        if confidence >= 0.8:
            stats["confidence_distribution"]["high"] += 1
        elif confidence >= 0.6:
            stats["confidence_distribution"]["medium"] += 1
        else:
            stats["confidence_distribution"]["low"] += 1

    return stats


# Threat Intelligence Endpoints
@app.get("/api/v1/threats", tags=["Threat Intelligence"], summary="Get threat intelligence")
async def get_threats(
    severity: str | None = Query(None, description="Filter by severity"),
    network: str | None = Query(None, description="Filter by network"),
    source: str | None = Query(None, description="Filter by source"),
    limit: int = Query(50, ge=1, le=500, description="Maximum number of results"),
    user=Depends(get_current_user),
):
    """
    Get threat intelligence data including known attack patterns and malicious actors.

    Returns comprehensive threat data with severity levels and confidence scores.
    """
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    threats = engine.threat_intelligence.copy()

    # Apply filters
    if severity:
        try:
            severity_level = ThreatLevel(severity.lower())
            threats = [t for t in threats if t.severity == severity_level]
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity: {severity}")

    if network:
        threats = [t for t in threats if network.lower() in t.description.lower()]

    if source:
        threats = [t for t in threats if t.source.lower() == source.lower()]

    # Sort by severity and confidence
    severity_order = {
        ThreatLevel.CRITICAL: 4,
        ThreatLevel.HIGH: 3,
        ThreatLevel.MEDIUM: 2,
        ThreatLevel.LOW: 1,
    }
    threats.sort(key=lambda x: (severity_order.get(x.severity, 0), x.confidence), reverse=True)

    # Apply limit
    limited_threats = threats[:limit]

    return {
        "threats": [t.to_dict() for t in limited_threats],
        "total_count": len(threats),
        "returned_count": len(limited_threats),
        "summary": {
            "critical": sum(1 for t in threats if t.severity == ThreatLevel.CRITICAL),
            "high": sum(1 for t in threats if t.severity == ThreatLevel.HIGH),
            "medium": sum(1 for t in threats if t.severity == ThreatLevel.MEDIUM),
            "low": sum(1 for t in threats if t.severity == ThreatLevel.LOW),
        },
    }


# Network Information
@app.get("/api/v1/networks", tags=["Networks"], summary="Get supported networks")
async def get_networks(user=Depends(get_current_user)):
    """Get information about supported blockchain networks"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    networks_info = []

    for network in engine.active_networks:
        network_config = engine.config.get("networks", {}).get(network.value, {})
        latency = engine.performance_metrics.get("network_latency", {}).get(network.value, 0)

        networks_info.append(
            {
                "name": network.value,
                "display_name": network.value.title(),
                "chain_id": network_config.get("chain_id"),
                "native_token": network_config.get("native_token"),
                "block_time": network_config.get("block_time"),
                "status": "active",
                "latency_ms": round(latency, 2),
                "priority": network_config.get("priority", 999),
            }
        )

    # Sort by priority
    networks_info.sort(key=lambda x: x["priority"])

    return {
        "networks": networks_info,
        "total_active": len(networks_info),
        "total_supported": len(NetworkType),
    }


# Analytics Endpoints
@app.get("/api/v1/analytics/performance", tags=["Analytics"], summary="Get performance analytics")
async def get_performance_analytics(user=Depends(get_current_user)):
    """Get detailed performance analytics and metrics"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    status = await engine.get_system_status()

    return {
        "system_performance": {
            "cpu_usage": status["performance"]["cpu_usage"],
            "memory_usage": status["performance"]["memory_usage"],
            "processing_speed": status["performance"]["processing_speed"],
            "uptime_seconds": status["uptime_seconds"],
        },
        "processing_stats": {
            "total_transactions": status["statistics"]["total_transactions"],
            "suspicious_transactions": status["statistics"]["suspicious_transactions"],
            "attacks_detected": status["statistics"]["attacks_detected"],
            "mev_opportunities": status["statistics"]["mev_opportunities"],
            "threats_mitigated": status["statistics"]["threats_mitigated"],
        },
        "network_performance": status["performance"]["network_latency"],
        "resource_usage": {
            "pending_transactions": status["pending_transactions"],
            "user_profiles": status["user_profiles"],
            "threat_intelligence_entries": status["threat_intelligence"],
        },
    }


@app.get("/api/v1/analytics/security", tags=["Analytics"], summary="Get security analytics")
async def get_security_analytics(user=Depends(get_current_user)):
    """Get comprehensive security analytics and threat summary"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    status = await engine.get_system_status()

    # Calculate threat distribution
    suspicious_txs = engine.suspicious_transactions
    threat_distribution = {"critical": 0, "high": 0, "medium": 0, "low": 0}

    for tx in suspicious_txs:
        threat_distribution[tx.threat_level.value] += 1

    # MEV analysis
    mev_analysis = {"sandwich": 0, "arbitrage": 0, "flash_loan": 0, "liquidation": 0}

    for mev in engine.detected_mev_opportunities:
        mev_type = str(mev.get("type", "unknown"))
        if hasattr(mev.get("type"), "value"):
            mev_type = mev["type"].value
        if mev_type in mev_analysis:
            mev_analysis[mev_type] += 1

    return {
        "threat_summary": {
            "current_threat_level": status["threat_level"],
            "threat_distribution": threat_distribution,
            "recent_threats": len(
                [tx for tx in suspicious_txs if (datetime.now() - tx.timestamp).seconds < 3600]
            ),
        },
        "mev_analysis": {
            "total_opportunities": len(engine.detected_mev_opportunities),
            "type_distribution": mev_analysis,
            "estimated_total_profit": sum(
                op.get("profit_estimate", 0) for op in engine.detected_mev_opportunities
            ),
        },
        "protection_stats": {
            "transactions_protected": status["statistics"]["transactions_protected"],
            "attacks_prevented": status["statistics"]["attacks_detected"],
            "success_rate": (
                status["statistics"]["transactions_protected"]
                / max(status["statistics"]["total_transactions"], 1)
            )
            * 100,
        },
    }


# Export Endpoints
@app.get("/api/v1/export/transactions", tags=["Export"], summary="Export transaction data")
async def export_transactions(
    format: str = Query("json", description="Export format: json, csv"),
    timeframe: str = Query("1h", description="Timeframe: 1h, 6h, 24h, 7d"),
    network: str | None = Query(None, description="Filter by network"),
    user=Depends(get_current_user),
):
    """Export transaction data in various formats"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")

    # Calculate timeframe
    timeframe_map = {"1h": 1, "6h": 6, "24h": 24, "7d": 168}
    hours = timeframe_map.get(timeframe, 1)
    cutoff_time = datetime.now() - timedelta(hours=hours)

    # Filter transactions
    transactions = [tx for tx in engine.pending_transactions.values() if tx.timestamp > cutoff_time]

    if network:
        try:
            network_type = NetworkType(network.lower())
            transactions = [tx for tx in transactions if tx.network == network_type]
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid network: {network}")

    if format.lower() == "json":
        return [tx.to_dict() for tx in transactions]
    if format.lower() == "csv":
        # Convert to CSV format
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(
            [
                "hash",
                "network",
                "from_address",
                "to_address",
                "value_eth",
                "gas_price_gwei",
                "gas_limit",
                "risk_score",
                "threat_level",
                "is_suspicious",
                "timestamp",
            ]
        )

        # Write data
        for tx in transactions:
            writer.writerow(
                [
                    tx.hash,
                    tx.network.value,
                    tx.from_address,
                    tx.to_address,
                    tx.value / 1e18,
                    tx.gas_price / 1e9,
                    tx.gas_limit,
                    tx.risk_score,
                    tx.threat_level.value,
                    tx.is_suspicious,
                    tx.timestamp.isoformat(),
                ]
            )

        output.seek(0)
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=transactions_{timeframe}.csv"},
        )
    raise HTTPException(status_code=400, detail="Unsupported format. Use 'json' or 'csv'")


# WebSocket Streaming
@app.websocket("/api/v1/stream/transactions")
async def websocket_transactions(websocket: WebSocket):
    """WebSocket endpoint for real-time transaction streaming"""
    await manager.connect(websocket)

    try:
        while True:
            # Send recent transactions
            if engine and engine.is_monitoring:
                recent_txs = sorted(
                    engine.pending_transactions.values(), key=lambda x: x.timestamp, reverse=True
                )[:10]

                message = {
                    "type": "transactions",
                    "timestamp": datetime.now().isoformat(),
                    "data": [tx.to_dict() for tx in recent_txs],
                }

                await websocket.send_text(json.dumps(message))

            await asyncio.sleep(1)  # Send updates every second

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/api/v1/stream/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time security alerts"""
    await manager.connect(websocket)

    try:
        while True:
            # Send recent suspicious transactions and MEV opportunities
            if engine and engine.is_monitoring:
                recent_suspicious = engine.suspicious_transactions[-5:]
                recent_mev = engine.detected_mev_opportunities[-5:]

                message = {
                    "type": "alerts",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "suspicious_transactions": [tx.to_dict() for tx in recent_suspicious],
                        "mev_opportunities": recent_mev,
                        "threat_level": engine._calculate_overall_threat_level(),
                    },
                }

                await websocket.send_text(json.dumps(message))

            await asyncio.sleep(2)  # Send alerts every 2 seconds

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.websocket("/api/v1/stream/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """WebSocket endpoint for real-time dashboard updates"""
    await manager.connect(websocket)

    try:
        while True:
            # Send complete dashboard data
            if engine and engine.is_monitoring:
                dashboard_data = await engine.get_live_dashboard_data()

                message = {
                    "type": "dashboard",
                    "timestamp": datetime.now().isoformat(),
                    "data": dashboard_data,
                }

                await websocket.send_text(json.dumps(message))

            await asyncio.sleep(3)  # Send dashboard updates every 3 seconds

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.now().isoformat(),
        },
    )


# Include integrated services router if available
if INTEGRATION_AVAILABLE:
    try:
        integration_router = create_integration_router()
        app.include_router(integration_router)
        logger.info("✅ Integrated services router added")
    except Exception as e:
        logger.warning(f"⚠️ Failed to add integration router: {e}")


# Development server
if __name__ == "__main__":
    uvicorn.run("unified_api_gateway:app", host="0.0.0.0", port=8004, reload=True, log_level="info")
