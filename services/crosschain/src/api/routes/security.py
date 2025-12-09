#!/usr/bin/env python3
"""
Security monitoring API routes for cross-chain bridge security features
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, validator

from ...core.attack_detection import AttackDetectionSystem
from ...core.attestation_monitor import AttestationMonitor
from ...core.liveness_monitor import LivenessMonitor
from ...core.proof_of_reserves import ProofOfReservesMonitor
from ...core.security_orchestrator import SecurityOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class AttestationRequest(BaseModel):
    """Request model for attestation processing"""

    bridge_address: str = Field(..., description="Bridge contract address")
    source_network: str = Field(..., description="Source blockchain network")
    target_network: str = Field(..., description="Target blockchain network")
    transaction_hash: str = Field(..., description="Transaction hash")
    block_number: int = Field(..., description="Block number")
    validator_address: str = Field(..., description="Validator address")
    signature: str = Field(..., description="Validator signature")
    message_hash: str = Field(..., description="Message hash")
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @validator("bridge_address", "validator_address")
    def validate_addresses(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid address format")
        return v.lower()

    @validator("signature")
    def validate_signature(cls, v):
        if not v or len(v) < 64:
            raise ValueError("Invalid signature format")
        return v


class GuardianRegistrationRequest(BaseModel):
    """Request model for guardian registration"""

    address: str = Field(..., description="Guardian address")
    name: str = Field(..., description="Guardian name")
    geographic_region: str = Field(..., description="Geographic region")
    institutional_type: str = Field(..., description="Institutional type")
    technical_expertise: list[str] = Field(
        default_factory=list, description="Technical expertise areas"
    )
    stake_amount: float = Field(default=0.0, ge=0.0, description="Stake amount")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @validator("address")
    def validate_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid address format")
        return v.lower()


class ReserveVerificationRequest(BaseModel):
    """Request model for reserve verification"""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network name")
    total_reserves: float = Field(..., ge=0.0, description="Total reserves amount")
    verification_data: dict[str, Any] = Field(..., description="Verification data")

    @validator("bridge_address")
    def validate_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid address format")
        return v.lower()


class AttackDetectionRequest(BaseModel):
    """Request model for attack detection"""

    transaction_data: dict[str, Any] = Field(..., description="Transaction data")
    signature: str = Field(..., description="Transaction signature")
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network name")

    @validator("bridge_address")
    def validate_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid address format")
        return v.lower()


def get_security_orchestrator(request: Request) -> SecurityOrchestrator:
    """Get security orchestrator from app state"""
    orchestrator = getattr(request.app.state, "security_orchestrator", None)
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Security orchestrator not initialized")
    return orchestrator


def get_attestation_monitor(request: Request) -> AttestationMonitor:
    """Get attestation monitor from app state"""
    monitor = getattr(request.app.state, "attestation_monitor", None)
    if not monitor:
        raise HTTPException(status_code=503, detail="Attestation monitor not initialized")
    return monitor


def get_proof_of_reserves(request: Request) -> ProofOfReservesMonitor:
    """Get proof of reserves monitor from app state"""
    monitor = getattr(request.app.state, "proof_of_reserves", None)
    if not monitor:
        raise HTTPException(status_code=503, detail="Proof of reserves monitor not initialized")
    return monitor


def get_attack_detection(request: Request) -> AttackDetectionSystem:
    """Get attack detection system from app state"""
    system = getattr(request.app.state, "attack_detection", None)
    if not system:
        raise HTTPException(status_code=503, detail="Attack detection system not initialized")
    return system


def get_liveness_monitor(request: Request) -> LivenessMonitor:
    """Get liveness monitor from app state"""
    monitor = getattr(request.app.state, "liveness_monitor", None)
    if not monitor:
        raise HTTPException(status_code=503, detail="Liveness monitor not initialized")
    return monitor


# Security Dashboard
@router.get("/dashboard")
async def get_security_dashboard(
    orchestrator: SecurityOrchestrator = Depends(get_security_orchestrator),
):
    """Get comprehensive security dashboard"""
    try:
        dashboard = await orchestrator.get_security_dashboard()
        return dashboard
    except Exception as e:
        logger.error(f"Error getting security dashboard: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Attestation Monitoring
@router.post("/attestations/process")
async def process_attestation(
    request: AttestationRequest, monitor: AttestationMonitor = Depends(get_attestation_monitor)
):
    """Process a new attestation and detect anomalies"""
    try:
        attestation_data = {
            "bridge_address": request.bridge_address,
            "source_network": request.source_network,
            "target_network": request.target_network,
            "transaction_hash": request.transaction_hash,
            "block_number": request.block_number,
            "validator_address": request.validator_address,
            "signature": request.signature,
            "message_hash": request.message_hash,
            "confidence_score": request.confidence_score,
            "metadata": request.metadata,
            "timestamp": datetime.now().isoformat(),
        }

        attestation, anomalies = await monitor.process_attestation(attestation_data)

        return {
            "attestation": {
                "id": attestation.id,
                "bridge_address": attestation.bridge_address,
                "validator_address": attestation.validator_address,
                "status": attestation.status.value,
                "confidence_score": attestation.confidence_score,
                "timestamp": attestation.timestamp.isoformat(),
            },
            "anomalies": [
                {
                    "anomaly_id": anomaly.anomaly_id,
                    "anomaly_type": anomaly.anomaly_type.value,
                    "severity": anomaly.severity,
                    "description": anomaly.description,
                    "confidence": anomaly.confidence,
                    "recommended_action": anomaly.recommended_action,
                }
                for anomaly in anomalies
            ],
        }
    except Exception as e:
        logger.error(f"Error processing attestation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/attestations/metrics")
async def get_attestation_metrics(
    bridge_address: str | None = None,
    monitor: AttestationMonitor = Depends(get_attestation_monitor),
):
    """Get attestation metrics and statistics"""
    try:
        metrics = await monitor.get_attestation_metrics(bridge_address)
        return metrics
    except Exception as e:
        logger.error(f"Error getting attestation metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/attestations/anomalies")
async def get_recent_anomalies(
    hours: int = 24, monitor: AttestationMonitor = Depends(get_attestation_monitor)
):
    """Get recent attestation anomalies"""
    try:
        anomalies = await monitor.get_recent_anomalies(hours)
        return {"anomalies": anomalies}
    except Exception as e:
        logger.error(f"Error getting recent anomalies: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Proof of Reserves
@router.post("/guardians/register")
async def register_guardian(
    request: GuardianRegistrationRequest,
    monitor: ProofOfReservesMonitor = Depends(get_proof_of_reserves),
):
    """Register a new guardian"""
    try:
        guardian_data = {
            "address": request.address,
            "name": request.name,
            "geographic_region": request.geographic_region,
            "institutional_type": request.institutional_type,
            "technical_expertise": request.technical_expertise,
            "stake_amount": request.stake_amount,
            "metadata": request.metadata,
        }

        guardian = await monitor.register_guardian(guardian_data)

        return {
            "guardian_address": guardian.address,
            "name": guardian.name,
            "status": guardian.status.value,
            "reputation_score": guardian.reputation_score,
            "diversity_scores": {k.value: v for k, v in guardian.diversity_scores.items()},
        }
    except Exception as e:
        logger.error(f"Error registering guardian: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/reserves/verify")
async def verify_reserves(
    request: ReserveVerificationRequest,
    monitor: ProofOfReservesMonitor = Depends(get_proof_of_reserves),
):
    """Verify proof of reserves for a bridge"""
    try:
        verification_data = {"total_reserves": request.total_reserves, **request.verification_data}

        reserve_proof = await monitor.verify_reserves(
            request.bridge_address, request.network, verification_data
        )

        return {
            "bridge_address": reserve_proof.bridge_address,
            "network": reserve_proof.network,
            "total_reserves": reserve_proof.total_reserves,
            "verified_reserves": reserve_proof.verified_reserves,
            "discrepancy_amount": reserve_proof.discrepancy_amount,
            "status": reserve_proof.status.value,
            "guardian_consensus": reserve_proof.guardian_consensus,
            "required_consensus": reserve_proof.required_consensus,
            "confidence_score": reserve_proof.confidence_score,
            "verification_timestamp": reserve_proof.verification_timestamp.isoformat(),
        }
    except Exception as e:
        logger.error(f"Error verifying reserves: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/quorum/diversity")
async def get_quorum_diversity(
    bridge_address: str, monitor: ProofOfReservesMonitor = Depends(get_proof_of_reserves)
):
    """Get quorum diversity score for a bridge"""
    try:
        diversity_score = await monitor.calculate_quorum_diversity(bridge_address)

        return {
            "bridge_address": diversity_score.bridge_address,
            "overall_diversity_score": diversity_score.overall_diversity_score,
            "geographic_diversity": diversity_score.geographic_diversity,
            "institutional_diversity": diversity_score.institutional_diversity,
            "technical_diversity": diversity_score.technical_diversity,
            "reputational_diversity": diversity_score.reputational_diversity,
            "economic_diversity": diversity_score.economic_diversity,
            "active_guardians": diversity_score.active_guardians,
            "total_guardians": diversity_score.total_guardians,
            "recommendations": diversity_score.recommendations,
            "timestamp": diversity_score.timestamp.isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting quorum diversity: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/quorum/health")
async def get_quorum_health(monitor: ProofOfReservesMonitor = Depends(get_proof_of_reserves)):
    """Get overall quorum health summary"""
    try:
        health = await monitor.get_quorum_health_summary()
        return health
    except Exception as e:
        logger.error(f"Error getting quorum health: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Attack Detection
@router.post("/attacks/detect")
async def detect_attacks(
    request: AttackDetectionRequest, system: AttackDetectionSystem = Depends(get_attack_detection)
):
    """Detect potential attacks in transaction data"""
    try:
        # Analyze signature
        signature_analysis = await system.analyze_signature(
            request.signature, request.transaction_data
        )

        # Detect attacks
        detections = await system.detect_attacks(request.transaction_data, signature_analysis)

        return {
            "signature_analysis": {
                "signature_type": signature_analysis.signature_type.value,
                "is_valid": signature_analysis.is_valid,
                "is_forged": signature_analysis.is_forged,
                "confidence_score": signature_analysis.confidence_score,
                "anomalies": signature_analysis.anomalies,
            },
            "attack_detections": [
                {
                    "detection_id": detection.detection_id,
                    "attack_type": detection.attack_type.value,
                    "threat_level": detection.threat_level.value,
                    "confidence": detection.confidence,
                    "description": detection.description,
                    "recommended_actions": detection.recommended_actions,
                    "mitigation_priority": detection.mitigation_priority,
                }
                for detection in detections
            ],
        }
    except Exception as e:
        logger.error(f"Error detecting attacks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/attacks/statistics")
async def get_attack_statistics(
    hours: int = 24, system: AttackDetectionSystem = Depends(get_attack_detection)
):
    """Get attack detection statistics"""
    try:
        stats = await system.get_attack_statistics(hours)
        return stats
    except Exception as e:
        logger.error(f"Error getting attack statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/attacks/history")
async def get_attack_history(
    hours: int = 24, system: AttackDetectionSystem = Depends(get_attack_detection)
):
    """Get attack detection history"""
    try:
        history = await system.get_detection_history(hours)
        return {"detections": history}
    except Exception as e:
        logger.error(f"Error getting attack history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Liveness Monitoring
@router.get("/liveness/networks")
async def get_network_health(
    network: str | None = None, monitor: LivenessMonitor = Depends(get_liveness_monitor)
):
    """Get network health information"""
    try:
        health = await monitor.get_network_health(network)
        return health
    except Exception as e:
        logger.error(f"Error getting network health: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/liveness/validators")
async def get_validator_health(
    validator_address: str | None = None,
    monitor: LivenessMonitor = Depends(get_liveness_monitor),
):
    """Get validator health information"""
    try:
        health = await monitor.get_validator_health(validator_address)
        return health
    except Exception as e:
        logger.error(f"Error getting validator health: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/liveness/gaps")
async def get_liveness_gaps(
    hours: int = 24, monitor: LivenessMonitor = Depends(get_liveness_monitor)
):
    """Get liveness gaps"""
    try:
        gaps = await monitor.get_liveness_gaps(hours)
        return {"gaps": gaps}
    except Exception as e:
        logger.error(f"Error getting liveness gaps: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/liveness/summary")
async def get_liveness_summary(monitor: LivenessMonitor = Depends(get_liveness_monitor)):
    """Get liveness monitoring summary"""
    try:
        summary = await monitor.get_health_summary()
        return summary
    except Exception as e:
        logger.error(f"Error getting liveness summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Security Events and Alerts
@router.get("/events")
async def get_security_events(
    hours: int = 24, orchestrator: SecurityOrchestrator = Depends(get_security_orchestrator)
):
    """Get recent security events"""
    try:
        events = await orchestrator.get_recent_events(hours)
        return {"events": events}
    except Exception as e:
        logger.error(f"Error getting security events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/alerts")
async def get_security_alerts(
    orchestrator: SecurityOrchestrator = Depends(get_security_orchestrator),
):
    """Get active security alerts"""
    try:
        alerts = await orchestrator.get_active_alerts()
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Error getting security alerts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    acknowledged_by: str,
    orchestrator: SecurityOrchestrator = Depends(get_security_orchestrator),
):
    """Acknowledge a security alert"""
    try:
        success = await orchestrator.acknowledge_alert(alert_id, acknowledged_by)
        if success:
            return {"message": "Alert acknowledged successfully"}
        raise HTTPException(status_code=404, detail="Alert not found")
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/events/{event_id}/resolve")
async def resolve_security_event(
    event_id: str,
    resolution_notes: str,
    orchestrator: SecurityOrchestrator = Depends(get_security_orchestrator),
):
    """Resolve a security event"""
    try:
        success = await orchestrator.resolve_event(event_id, resolution_notes)
        if success:
            return {"message": "Event resolved successfully"}
        raise HTTPException(status_code=404, detail="Event not found")
    except Exception as e:
        logger.error(f"Error resolving event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Monitoring Control
@router.post("/monitoring/start")
async def start_security_monitoring(
    orchestrator: SecurityOrchestrator = Depends(get_security_orchestrator),
):
    """Start security monitoring"""
    try:
        await orchestrator.start_security_monitoring()
        return {"message": "Security monitoring started"}
    except Exception as e:
        logger.error(f"Error starting security monitoring: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/monitoring/stop")
async def stop_security_monitoring(
    orchestrator: SecurityOrchestrator = Depends(get_security_orchestrator),
):
    """Stop security monitoring"""
    try:
        await orchestrator.stop_security_monitoring()
        return {"message": "Security monitoring stopped"}
    except Exception as e:
        logger.error(f"Error stopping security monitoring: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
