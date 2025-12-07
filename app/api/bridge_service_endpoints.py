#!/usr/bin/env python3
"""
Comprehensive Bridge Service API Endpoints
Exposes all features of the cross-chain bridge security service
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.api.dependencies import get_authenticated_user
from app.api.error_handlers import handle_endpoint_errors
from app.core.bridge_service_client import get_bridge_service_client, BridgeServiceClient
from app.core.utils import format_response, get_utc_timestamp

router = APIRouter(prefix="/api/bridge-service", tags=["bridge-service"])


# Request Models

class BridgeAnalysisRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    source_network: str = Field(..., description="Source blockchain network")
    target_network: str = Field(..., description="Target blockchain network")
    analysis_depth: str = Field(default="comprehensive", description="Analysis depth: basic, comprehensive, deep")


class SecurityScoreRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    scoring_criteria: Optional[List[str]] = Field(default=None, description="Scoring criteria")


class AttackSimulationRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    attack_type: str = Field(..., description="Type of attack to simulate")
    attack_parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AttestationAnomalyRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    time_range: str = Field(default="24h", description="Time range: 1h, 24h, 7d")
    include_details: bool = Field(default=True)


class QuorumAnalysisRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    analysis_period: str = Field(default="7d", description="Analysis period: 1d, 7d, 30d")


class ProofOfReservesRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    include_asset_breakdown: bool = Field(default=True)


class AttackPlaybookRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    transaction_data: List[Dict[str, Any]] = Field(..., description="Transaction data to analyze")
    attack_types: Optional[List[str]] = Field(default=None)


class SignatureValidationRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    signatures: List[Dict[str, str]] = Field(..., description="Signatures to validate")


class ComprehensiveScanRequest(BaseModel):
    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    transaction_data: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    scan_options: Optional[Dict[str, Any]] = Field(default=None)


class VulnerabilityScanRequest(BaseModel):
    contract_addresses: List[str] = Field(..., description="Contract addresses to scan")
    networks: List[str] = Field(..., description="Networks to scan")
    scan_type: str = Field(default="comprehensive", description="Scan type")


class TransactionValidationRequest(BaseModel):
    transaction_hash: str = Field(..., description="Transaction hash")
    network: str = Field(..., description="Network")


# Endpoints

@router.get("/health")
async def bridge_service_health():
    """Check bridge service health"""
    try:
        client = get_bridge_service_client()
        health = await client.health_check()
        return format_response(
            success=True,
            data=health,
            timestamp=get_utc_timestamp()
        )
    except Exception as e:
        return format_response(
            success=False,
            error=str(e),
            timestamp=get_utc_timestamp()
        )


@router.post("/analyze")
@handle_endpoint_errors("bridge analysis")
async def analyze_bridge(
    request: BridgeAnalysisRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Analyze a cross-chain bridge for security"""
    client = get_bridge_service_client()
    result = await client.analyze_bridge(
        bridge_address=request.bridge_address,
        source_network=request.source_network,
        target_network=request.target_network,
        analysis_depth=request.analysis_depth
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.post("/security-score")
@handle_endpoint_errors("security score")
async def get_security_score(
    request: SecurityScoreRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get bridge security score"""
    client = get_bridge_service_client()
    result = await client.get_bridge_security_score(
        bridge_address=request.bridge_address,
        network=request.network,
        scoring_criteria=request.scoring_criteria
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.post("/simulate-attack")
@handle_endpoint_errors("attack simulation")
async def simulate_attack(
    request: AttackSimulationRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Simulate bridge attack"""
    client = get_bridge_service_client()
    result = await client.simulate_attack(
        bridge_address=request.bridge_address,
        attack_type=request.attack_type,
        attack_parameters=request.attack_parameters
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.get("/metrics")
@handle_endpoint_errors("bridge metrics")
async def get_metrics(
    bridge_address: Optional[str] = Query(None),
    time_range: str = Query("7d"),
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get bridge metrics"""
    client = get_bridge_service_client()
    result = await client.get_bridge_metrics(
        bridge_address=bridge_address,
        time_range=time_range
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.get("/list")
@handle_endpoint_errors("list bridges")
async def list_bridges(
    network: Optional[str] = Query(None),
    bridge_type: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """List known bridges"""
    client = get_bridge_service_client()
    result = await client.list_bridges(
        network=network,
        bridge_type=bridge_type,
        limit=limit,
        offset=offset
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.get("/{bridge_address}/info")
@handle_endpoint_errors("bridge info")
async def get_bridge_info(
    bridge_address: str,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get bridge information"""
    client = get_bridge_service_client()
    result = await client.get_bridge_info(bridge_address)
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


# Advanced Security Endpoints

@router.post("/detect-attestation-anomalies")
@handle_endpoint_errors("attestation anomalies")
async def detect_attestation_anomalies(
    request: AttestationAnomalyRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Detect attestation anomalies"""
    client = get_bridge_service_client()
    result = await client.detect_attestation_anomalies(
        bridge_address=request.bridge_address,
        network=request.network,
        time_range=request.time_range,
        include_details=request.include_details
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.post("/analyze-quorum-skews")
@handle_endpoint_errors("quorum analysis")
async def analyze_quorum_skews(
    request: QuorumAnalysisRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Analyze quorum skews"""
    client = get_bridge_service_client()
    result = await client.analyze_quorum_skews(
        bridge_address=request.bridge_address,
        network=request.network,
        analysis_period=request.analysis_period
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.post("/proof-of-reserves")
@handle_endpoint_errors("proof of reserves")
async def proof_of_reserves_monitoring(
    request: ProofOfReservesRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Monitor proof of reserves"""
    client = get_bridge_service_client()
    result = await client.proof_of_reserves_monitoring(
        bridge_address=request.bridge_address,
        network=request.network,
        include_asset_breakdown=request.include_asset_breakdown
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.post("/attack-playbook-analysis")
@handle_endpoint_errors("attack playbook analysis")
async def attack_playbook_analysis(
    request: AttackPlaybookRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Analyze against attack playbooks"""
    client = get_bridge_service_client()
    result = await client.attack_playbook_analysis(
        bridge_address=request.bridge_address,
        network=request.network,
        transaction_data=request.transaction_data,
        attack_types=request.attack_types
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.post("/validate-signatures")
@handle_endpoint_errors("signature validation")
async def validate_signatures(
    request: SignatureValidationRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Validate signatures"""
    client = get_bridge_service_client()
    result = await client.validate_signatures(
        bridge_address=request.bridge_address,
        network=request.network,
        signatures=request.signatures
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.post("/comprehensive-scan")
@handle_endpoint_errors("comprehensive security scan")
async def comprehensive_security_scan(
    request: ComprehensiveScanRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Comprehensive security scan"""
    client = get_bridge_service_client()
    result = await client.comprehensive_security_scan(
        bridge_address=request.bridge_address,
        network=request.network,
        transaction_data=request.transaction_data,
        scan_options=request.scan_options
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


# Network Endpoints

@router.get("/network/status")
@handle_endpoint_errors("network status")
async def get_network_status(
    network: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get network status"""
    client = get_bridge_service_client()
    result = await client.get_network_status(network=network)
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.get("/network/supported")
@handle_endpoint_errors("supported networks")
async def get_supported_networks(
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get supported networks"""
    client = get_bridge_service_client()
    result = await client.get_supported_networks()
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


# Transaction Endpoints

@router.post("/transaction/validate")
@handle_endpoint_errors("transaction validation")
async def validate_transaction(
    request: TransactionValidationRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Validate cross-chain transaction"""
    client = get_bridge_service_client()
    result = await client.validate_transaction(
        tx_hash=request.transaction_hash,
        network=request.network
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.get("/transaction/{tx_hash}/status")
@handle_endpoint_errors("transaction status")
async def get_transaction_status(
    tx_hash: str,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get transaction status"""
    client = get_bridge_service_client()
    result = await client.get_transaction_status(tx_hash=tx_hash)
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


# Vulnerability Endpoints

@router.post("/vulnerability/scan")
@handle_endpoint_errors("vulnerability scan")
async def scan_vulnerabilities(
    request: VulnerabilityScanRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Scan for vulnerabilities"""
    client = get_bridge_service_client()
    result = await client.scan_vulnerabilities(
        contract_addresses=request.contract_addresses,
        networks=request.networks,
        scan_type=request.scan_type
    )
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


# Security Monitoring Endpoints

@router.get("/security/dashboard")
@handle_endpoint_errors("security dashboard")
async def get_security_dashboard(
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get security dashboard"""
    client = get_bridge_service_client()
    result = await client.get_security_dashboard()
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


@router.get("/security/events")
@handle_endpoint_errors("security events")
async def get_security_events(
    limit: int = Query(50),
    offset: int = Query(0),
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Get security events"""
    client = get_bridge_service_client()
    result = await client.get_security_events(limit=limit, offset=offset)
    return format_response(
        success=True,
        data=result,
        timestamp=get_utc_timestamp()
    )


__all__ = ["router"]

