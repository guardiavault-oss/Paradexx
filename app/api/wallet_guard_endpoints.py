#!/usr/bin/env python3
"""
Wallet Guard API Endpoints
Provides comprehensive wallet protection, monitoring, and threat detection endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
import structlog

# Import wallet guard service and client
try:
    from app.wallet_guard import wallet_guard_service
    from app.core.wallet_guard_client import get_wallet_guard_client
    WALLET_GUARD_AVAILABLE = True
except ImportError as e:
    structlog.get_logger(__name__).warning(f"Wallet Guard service not available: {e}")
    WALLET_GUARD_AVAILABLE = False
    wallet_guard_service = None
    get_wallet_guard_client = None

# Import error handlers and helpers
from app.api.error_handlers import handle_endpoint_errors, create_service_unavailable_error
from app.core.utils import get_utc_timestamp, format_response

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/api/wallet-guard", tags=["wallet-guard"])


# Request/Response Models
class MonitorWalletRequest(BaseModel):
    """Request model for starting wallet monitoring"""
    wallet_address: str = Field(..., description="Wallet address to monitor")
    network: str = Field(default="ethereum", description="Blockchain network")
    alert_channels: Optional[List[str]] = Field(default=["email"], description="Alert channels")
    protection_level: Optional[str] = Field(default="medium", description="Protection level")


class ProtectionActionRequest(BaseModel):
    """Request model for protection actions"""
    wallet_address: str = Field(..., description="Wallet address")
    action_type: str = Field(..., description="Protection action type")
    network: Optional[str] = Field(default="ethereum", description="Blockchain network")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")


class SimulateTransactionRequest(BaseModel):
    """Request model for transaction simulation"""
    wallet_address: str = Field(..., description="Wallet address")
    transaction: Dict[str, Any] = Field(..., description="Transaction data")
    network: Optional[str] = Field(default="ethereum", description="Blockchain network")
    simulation_depth: Optional[int] = Field(default=10, description="Simulation depth")


class PreSignRequest(BaseModel):
    """Request model for pre-signing transactions"""
    transaction: Dict[str, Any] = Field(..., description="Transaction to pre-sign")
    wallet_address: str = Field(..., description="Wallet address")
    required_signers: Optional[int] = Field(default=2, description="Number of required signers")
    mpc_enabled: Optional[bool] = Field(default=False, description="Enable MPC signing")


@router.get("/health")
@handle_endpoint_errors("wallet guard health check")
async def health_check():
    """Check Wallet Guard service health"""
    if not WALLET_GUARD_AVAILABLE:
        return format_response(
            success=False,
            data={
                "healthy": False,
                "service": "Wallet Guard",
                "message": "Wallet Guard service not available"
            },
            timestamp=get_utc_timestamp()
        )
    
    try:
        # Check service status via client
        client = get_wallet_guard_client()
        if client:
            status = await client.get_service_status()
            return format_response(
                success=True,
                data=status,
                timestamp=get_utc_timestamp()
            )
        
        # Fallback to direct service check
        if wallet_guard_service and wallet_guard_service.core_services_initialized:
            return format_response(
                success=True,
                data={
                    "healthy": True,
                    "service": "Wallet Guard",
                    "monitored_wallets": len(wallet_guard_service.monitored_wallets),
                    "initialized": True
                },
                timestamp=get_utc_timestamp()
            )
        
        return format_response(
            success=False,
            data={
                "healthy": False,
                "service": "Wallet Guard",
                "message": "Service not initialized"
            },
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        logger.error("Wallet Guard health check failed", error=str(e))
        return format_response(
            success=False,
            data={
                "healthy": False,
                "service": "Wallet Guard",
                "error": str(e)
            },
            timestamp=get_utc_timestamp()
        )


@router.get("/status")
@handle_endpoint_errors("wallet guard status")
async def get_status():
    """Get Wallet Guard service status summary"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        client = get_wallet_guard_client()
        if client:
            status = await client.get_service_status()
            return format_response(
                success=True,
                data=status,
                timestamp=get_utc_timestamp()
            )
        
        # Fallback to direct service
        if wallet_guard_service:
            return format_response(
                success=True,
                data={
                    "service": "wallet-guard",
                    "status": "online",
                    "monitored_wallets": len(wallet_guard_service.monitored_wallets),
                    "threat_detections": len(wallet_guard_service.threat_detections),
                    "protection_actions": len(wallet_guard_service.protection_actions)
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get Wallet Guard status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/threats")
@handle_endpoint_errors("get threats")
async def get_threats(limit: int = 50, hours: int = 24):
    """Get recent threat detections"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        client = get_wallet_guard_client()
        if client:
            threats = await client.get_threat_feed(limit=limit, hours=hours)
            return format_response(
                success=True,
                data=threats,
                timestamp=get_utc_timestamp()
            )
        
        # Fallback to direct service
        if wallet_guard_service:
            from datetime import datetime, timedelta
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            recent_threats = [
                {
                    "wallet_address": t.wallet_address,
                    "threat_type": t.threat_type,
                    "threat_level": t.threat_level.value if hasattr(t.threat_level, 'value') else str(t.threat_level),
                    "description": t.description,
                    "confidence": t.confidence,
                    "timestamp": t.timestamp.isoformat() if isinstance(t.timestamp, datetime) else str(t.timestamp),
                    "metadata": t.metadata
                }
                for t in wallet_guard_service.threat_detections
                if isinstance(t.timestamp, datetime) and t.timestamp > cutoff_time
            ][:limit]
            
            return format_response(
                success=True,
                data={
                    "threats": recent_threats,
                    "count": len(recent_threats),
                    "window_hours": hours
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get threats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get threats: {str(e)}")


@router.get("/actions")
@handle_endpoint_errors("get protection actions")
async def get_protection_actions(limit: int = 25):
    """Get recent protection actions"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        client = get_wallet_guard_client()
        if client:
            actions = await client.get_protection_actions(limit=limit)
            return format_response(
                success=True,
                data=actions,
                timestamp=get_utc_timestamp()
            )
        
        # Fallback to direct service
        if wallet_guard_service:
            recent_actions = [
                {
                    "action_type": a.action_type,
                    "wallet_address": a.wallet_address,
                    "description": a.description,
                    "timestamp": a.timestamp.isoformat() if hasattr(a.timestamp, 'isoformat') else str(a.timestamp),
                    "success": a.success,
                    "metadata": a.metadata
                }
                for a in wallet_guard_service.protection_actions[-limit:]
            ]
            recent_actions.reverse()
            
            return format_response(
                success=True,
                data={
                    "actions": recent_actions,
                    "count": len(recent_actions)
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get protection actions", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get actions: {str(e)}")


@router.post("/monitor")
@handle_endpoint_errors("start monitoring")
async def start_monitoring(request: MonitorWalletRequest):
    """Start monitoring a wallet address"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        # Use direct service call
        if wallet_guard_service:
            wallet_info = await wallet_guard_service.analyze_wallet_enhanced(
                request.wallet_address,
                request.network
            )
            wallet_guard_service.monitored_wallets[request.wallet_address] = wallet_info
            
            # Start monitoring task
            import asyncio
            asyncio.create_task(
                wallet_guard_service.monitor_wallet_activity_enhanced(
                    request.wallet_address,
                    request.network
                )
            )
            
            from dataclasses import asdict
            return format_response(
                success=True,
                data={
                    "message": "Advanced wallet monitoring started",
                    "address": request.wallet_address,
                    "network": request.network,
                    "wallet_info": asdict(wallet_info),
                    "monitoring_features": {
                        "threat_detection": True,
                        "contract_analysis": wallet_info.wallet_type.value == "contract",
                        "mempool_monitoring": True,
                        "mev_detection": True,
                    }
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start monitoring", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to start monitoring: {str(e)}")


@router.get("/status/{wallet_address}")
@handle_endpoint_errors("get wallet status")
async def get_wallet_status(wallet_address: str, network: Optional[str] = None):
    """Get status of a monitored wallet"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        # Use direct service call
        if wallet_guard_service:
            if wallet_address not in wallet_guard_service.monitored_wallets:
                raise HTTPException(status_code=404, detail="Wallet not being monitored")
            
            wallet_info = wallet_guard_service.monitored_wallets[wallet_address]
            from datetime import datetime, timedelta
            recent_threats = [
                {
                    "wallet_address": d.wallet_address,
                    "threat_type": d.threat_type,
                    "threat_level": d.threat_level.value if hasattr(d.threat_level, 'value') else str(d.threat_level),
                    "description": d.description,
                    "confidence": d.confidence,
                    "timestamp": d.timestamp.isoformat() if isinstance(d.timestamp, datetime) else str(d.timestamp),
                    "metadata": d.metadata
                }
                for d in wallet_guard_service.threat_detections
                if d.wallet_address == wallet_address
                and isinstance(d.timestamp, datetime)
                and d.timestamp > datetime.utcnow() - timedelta(hours=24)
            ]
            
            from dataclasses import asdict
            return format_response(
                success=True,
                data={
                    "wallet_info": asdict(wallet_info),
                    "recent_threats": recent_threats,
                    "protection_status": (
                        "active" if wallet_info.threat_level.value == "low" else "alert"
                    )
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get wallet status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get wallet status: {str(e)}")


@router.post("/protect")
@handle_endpoint_errors("apply protection")
async def apply_protection(request: ProtectionActionRequest):
    """Apply protection action to a wallet"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        # Use direct service call
        if wallet_guard_service:
            action = await wallet_guard_service.execute_protection_action(
                request.wallet_address,
                request.action_type
            )
            wallet_guard_service.protection_actions.append(action)
            
            from dataclasses import asdict
            return format_response(
                success=True,
                data={
                    "message": f"Protection action '{request.action_type}' applied",
                    "action": asdict(action)
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to apply protection", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to apply protection: {str(e)}")


@router.post("/simulate")
@handle_endpoint_errors("simulate transaction")
async def simulate_transaction(request: SimulateTransactionRequest):
    """Simulate a transaction to detect risks"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        # Use direct service call
        if wallet_guard_service and hasattr(wallet_guard_service, 'wallet_simulation_engine'):
            simulation_result = await wallet_guard_service.wallet_simulation_engine.simulate_transaction(
                transaction=request.transaction,
                wallet_address=request.wallet_address,
                network=request.network or "ethereum",
                simulation_depth=request.simulation_depth
            )
            
            from dataclasses import asdict
            return format_response(
                success=True,
                data={
                    "simulation_id": simulation_result.transaction_id,
                    "result": simulation_result.simulation_result.value,
                    "risks": [asdict(risk) for risk in simulation_result.risks],
                    "warnings": [asdict(warning) for warning in simulation_result.warnings],
                    "recommendations": simulation_result.recommendations,
                    "confidence_score": simulation_result.confidence_score,
                    "execution_time": simulation_result.metrics.execution_time,
                    "gas_estimate": simulation_result.metrics.gas_estimate,
                    "balance_changes": simulation_result.metrics.balance_changes,
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to simulate transaction", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to simulate transaction: {str(e)}")


@router.post("/presign")
@handle_endpoint_errors("pre-sign transaction")
async def presign_transaction(request: PreSignRequest):
    """Pre-sign a transaction with security checks"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        client = get_wallet_guard_client()
        if client:
            result = await client.request_presign({
                "transaction": request.transaction,
                "wallet_address": request.wallet_address,
                "required_signers": request.required_signers,
                "mpc_enabled": request.mpc_enabled
            })
            return format_response(
                success=True,
                data=result,
                timestamp=get_utc_timestamp()
            )
        
        # Fallback to direct service
        if wallet_guard_service:
            presign_result = await wallet_guard_service.pre_sign_transaction(
                transaction=request.transaction,
                wallet_address=request.wallet_address,
                required_signers=request.required_signers
            )
            
            from dataclasses import asdict
            return format_response(
                success=True,
                data={
                    "message": "Transaction pre-signed successfully",
                    "signature_id": presign_result.signature_id,
                    "status": presign_result.status,
                    "risk_assessment": presign_result.risk_assessment,
                    "warnings": presign_result.warnings,
                    "required_signers": presign_result.required_signers,
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to pre-sign transaction", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to pre-sign transaction: {str(e)}")


@router.get("/presign/{signature_id}")
@handle_endpoint_errors("get presign status")
async def get_presign_status(signature_id: str):
    """Get pre-sign transaction status"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        client = get_wallet_guard_client()
        if client:
            result = await client.get_presign_status(signature_id)
            return format_response(
                success=True,
                data=result,
                timestamp=get_utc_timestamp()
            )
        
        # Fallback to direct service
        if wallet_guard_service:
            result = await wallet_guard_service.get_presign_status(signature_id)
            return format_response(
                success=True,
                data=result,
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get presign status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get presign status: {str(e)}")


@router.get("/analytics")
@handle_endpoint_errors("get analytics")
async def get_analytics():
    """Get Wallet Guard service analytics"""
    if not WALLET_GUARD_AVAILABLE:
        raise create_service_unavailable_error("Wallet Guard")
    
    try:
        # Use direct service call
        if wallet_guard_service:
            from datetime import datetime, timedelta
            total_wallets = len(wallet_guard_service.monitored_wallets)
            high_risk_wallets = len([
                w for w in wallet_guard_service.monitored_wallets.values()
                if w.threat_level.value in ["high", "critical"]
            ])
            recent_threats = len([
                d for d in wallet_guard_service.threat_detections
                if isinstance(d.timestamp, datetime)
                and d.timestamp > datetime.utcnow() - timedelta(hours=24)
            ])
            
            mpc_metrics = {}
            simulation_metrics = {}
            if hasattr(wallet_guard_service, 'mpc_hsm_integration'):
                mpc_metrics = wallet_guard_service.mpc_hsm_integration.get_metrics()
            if hasattr(wallet_guard_service, 'wallet_simulation_engine'):
                simulation_metrics = wallet_guard_service.wallet_simulation_engine.get_metrics()
            
            return format_response(
                success=True,
                data={
                    "total_monitored_wallets": total_wallets,
                    "high_risk_wallets": high_risk_wallets,
                    "threats_last_24h": recent_threats,
                    "protection_actions_taken": len(wallet_guard_service.protection_actions),
                    "presign_transactions": len(wallet_guard_service.presign_transactions),
                    "multisig_signatures": len(wallet_guard_service.multisig_signatures),
                    "service_uptime": "100%",
                    "blockchain_networks": list(wallet_guard_service.web3_connections.keys()),
                    "zero_day_guardian_integration": bool(wallet_guard_service.zero_day_guardian_url),
                    "mpc_hsm": mpc_metrics,
                    "simulation_engine": simulation_metrics,
                },
                timestamp=get_utc_timestamp()
            )
        
        raise HTTPException(status_code=503, detail="Wallet Guard service not available")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get analytics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

