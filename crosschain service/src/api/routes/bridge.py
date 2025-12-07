"""Bridge analysis API routes."""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, validator

from ...core.bridge_analyzer import BridgeAnalyzer
from ...core.security_monitor import AttackPlaybookAnalyzer, SignatureForgeryDetector
from ...models.bridge import BridgeAnalysis, BridgeSecurityScore
from ...utils.network_utils import validate_network

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response models
class BridgeAnalysisRequest(BaseModel):
    """Request model for bridge analysis."""

    bridge_address: str = Field(..., description="Bridge contract address")
    source_network: str = Field(..., description="Source blockchain network")
    target_network: str = Field(..., description="Target blockchain network")
    analysis_depth: str = Field(
        default="comprehensive", description="Analysis depth: basic, comprehensive, deep"
    )
    include_token_flow: bool = Field(default=True, description="Include token flow analysis")
    include_liquidity_analysis: bool = Field(default=True, description="Include liquidity analysis")

    @validator("bridge_address")
    def validate_bridge_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid bridge address format")
        return v.lower()

    @validator("source_network", "target_network")
    def validate_networks(cls, v):
        if not validate_network(v):
            raise ValueError(f"Unsupported network: {v}")
        return v

    @validator("analysis_depth")
    def validate_analysis_depth(cls, v):
        if v not in ["basic", "comprehensive", "deep"]:
            raise ValueError("Analysis depth must be: basic, comprehensive, or deep")
        return v


class BridgeSecurityScoreRequest(BaseModel):
    """Request model for bridge security score."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    scoring_criteria: list[str] = Field(
        default=[
            "code_quality",
            "audit_status",
            "governance_decentralization",
            "validator_set",
            "economic_security",
            "operational_security",
        ],
        description="Scoring criteria to include",
    )

    @validator("bridge_address")
    def validate_bridge_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid bridge address format")
        return v.lower()

    @validator("network")
    def validate_network(cls, v):
        if not validate_network(v):
            raise ValueError(f"Unsupported network: {v}")
        return v


class BridgeSimulationRequest(BaseModel):
    """Request model for bridge attack simulation."""

    bridge_address: str = Field(..., description="Bridge contract address")
    attack_type: str = Field(..., description="Type of attack to simulate")
    attack_parameters: dict[str, Any] = Field(default_factory=dict, description="Attack parameters")
    simulation_options: dict[str, Any] = Field(
        default_factory=lambda: {
            "safe_mode": True,
            "detailed_analysis": True,
            "mitigation_suggestions": True,
        },
        description="Simulation options",
    )

    @validator("bridge_address")
    def validate_bridge_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid bridge address format")
        return v.lower()


def get_bridge_analyzer(request: Request):
    """Get bridge analyzer from app state."""
    analyzer = getattr(request.app.state, "bridge_analyzer", None)
    if not analyzer:
        raise HTTPException(status_code=503, detail="Bridge analyzer not initialized")
    return analyzer


@router.post("/analyze", response_model=BridgeAnalysis)
async def analyze_bridge(
    request: BridgeAnalysisRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Analyze a cross-chain bridge for security vulnerabilities and risks.

    This endpoint performs comprehensive security analysis of a cross-chain bridge,
    including code quality assessment, vulnerability scanning, governance analysis,
    and risk assessment.
    """
    try:
        logger.info(f"Starting bridge analysis for {request.bridge_address}")

        analysis = await analyzer.analyze_bridge(
            bridge_address=request.bridge_address,
            source_network=request.source_network,
            target_network=request.target_network,
            analysis_depth=request.analysis_depth,
        )

        logger.info(f"Bridge analysis completed. Security score: {analysis.security_score}")
        return analysis

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing bridge: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/security-score", response_model=BridgeSecurityScore)
async def get_bridge_security_score(
    request: BridgeSecurityScoreRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Get detailed security score for a bridge.

    This endpoint calculates a comprehensive security score based on multiple
    criteria including code quality, audit status, governance, and operational security.
    """
    try:
        logger.info(f"Calculating security score for {request.bridge_address}")

        security_score = await analyzer.get_bridge_security_score(
            bridge_address=request.bridge_address,
            network=request.network,
            scoring_criteria=request.scoring_criteria,
        )

        logger.info(f"Security score calculated: {security_score.overall_score}")
        return security_score

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating security score: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/simulate-attack")
async def simulate_bridge_attack(
    request: BridgeSimulationRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Simulate an attack on a bridge to assess security vulnerabilities.

    This endpoint runs safe simulations of various attack vectors to identify
    potential security weaknesses and provide mitigation recommendations.
    """
    try:
        logger.info(f"Simulating {request.attack_type} attack on {request.bridge_address}")

        # Mock simulation results
        simulation_result = {
            "bridge_address": request.bridge_address,
            "attack_type": request.attack_type,
            "simulation_timestamp": datetime.now().isoformat(),
            "attack_successful": False,
            "vulnerabilities_exposed": [
                {
                    "type": "potential_reentrancy",
                    "severity": "medium",
                    "description": "Potential reentrancy vulnerability in deposit function",
                    "mitigation": "Implement reentrancy guard",
                }
            ],
            "risk_assessment": {
                "overall_risk": "medium",
                "exploitability": "low",
                "impact": "medium",
            },
            "mitigation_suggestions": [
                "Implement reentrancy protection",
                "Add circuit breakers for large transactions",
                "Implement multi-signature requirements for critical operations",
            ],
            "simulation_metadata": {
                "safe_mode": request.simulation_options.get("safe_mode", True),
                "detailed_analysis": request.simulation_options.get("detailed_analysis", True),
                "simulation_duration": "2.5s",
            },
        }

        logger.info("Bridge attack simulation completed")
        return simulation_result

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error simulating attack: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/metrics")
async def get_bridge_metrics(bridge_address: str | None = None, time_range: str = "7d"):
    """
    Get bridge metrics and statistics.

    This endpoint provides various metrics about bridge usage, volume,
    and performance over a specified time range.
    """
    try:
        logger.info(f"Getting bridge metrics for time range: {time_range}")

        # Mock metrics data
        metrics = {
            "time_range": time_range,
            "bridge_address": bridge_address,
            "metrics": {
                "total_volume_24h": 1500000.0,
                "total_transactions_24h": 1250,
                "average_transaction_size": 1200.0,
                "unique_users_24h": 450,
                "gas_usage_24h": 2500000,
                "success_rate": 99.2,
                "average_confirmation_time": 2.5,
            },
            "volume_by_network": {
                "ethereum": 800000.0,
                "polygon": 400000.0,
                "bsc": 200000.0,
                "avalanche": 100000.0,
            },
            "top_tokens": [
                {"symbol": "USDC", "volume": 600000.0, "percentage": 40.0},
                {"symbol": "USDT", "volume": 450000.0, "percentage": 30.0},
                {"symbol": "ETH", "volume": 300000.0, "percentage": 20.0},
                {"symbol": "MATIC", "volume": 150000.0, "percentage": 10.0},
            ],
            "timestamp": "2024-01-01T00:00:00Z",
        }

        return metrics

    except Exception as e:
        logger.error(f"Error getting bridge metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/list")
async def list_bridges(
    network: str | None = None,
    bridge_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """
    List known bridges with optional filtering.

    This endpoint returns a list of known bridges with their basic information,
    optionally filtered by network and bridge type.
    """
    try:
        logger.info(f"Listing bridges with filters: network={network}, type={bridge_type}")

        # Mock bridge list
        bridges = [
            {
                "address": "0x1234567890123456789012345678901234567890",
                "name": "Polygon Bridge",
                "type": "lock_and_mint",
                "source_network": "ethereum",
                "target_network": "polygon",
                "is_verified": True,
                "total_value_locked": 50000000.0,
                "daily_volume": 2000000.0,
            },
            {
                "address": "0x2345678901234567890123456789012345678901",
                "name": "Arbitrum Bridge",
                "type": "lock_and_mint",
                "source_network": "ethereum",
                "target_network": "arbitrum",
                "is_verified": True,
                "total_value_locked": 30000000.0,
                "daily_volume": 1500000.0,
            },
            {
                "address": "0x3456789012345678901234567890123456789012",
                "name": "Optimism Bridge",
                "type": "lock_and_mint",
                "source_network": "ethereum",
                "target_network": "optimism",
                "is_verified": True,
                "total_value_locked": 25000000.0,
                "daily_volume": 1200000.0,
            },
        ]

        # Apply filters
        if network:
            bridges = [
                b
                for b in bridges
                if b["source_network"] == network or b["target_network"] == network
            ]

        if bridge_type:
            bridges = [b for b in bridges if b["type"] == bridge_type]

        # Apply pagination
        total = len(bridges)
        bridges = bridges[offset : offset + limit]

        return {
            "bridges": bridges,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total,
        }

    except Exception as e:
        logger.error(f"Error listing bridges: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{bridge_address}/info")
async def get_bridge_info(bridge_address: str):
    """
    Get detailed information about a specific bridge.

    This endpoint returns comprehensive information about a bridge including
    its configuration, supported tokens, and operational details.
    """
    try:
        if not bridge_address.startswith("0x") or len(bridge_address) != 42:
            raise HTTPException(status_code=400, detail="Invalid bridge address format")

        logger.info(f"Getting bridge info for {bridge_address}")

        # Mock bridge info
        bridge_info = {
            "address": bridge_address.lower(),
            "name": "Example Bridge",
            "type": "lock_and_mint",
            "source_network": "ethereum",
            "target_network": "polygon",
            "is_verified": True,
            "total_value_locked": 50000000.0,
            "daily_volume": 2000000.0,
            "supported_tokens": [
                {"symbol": "USDC", "address": "0xA0b86a33E6441c8C06DD4C4e4B0b8c8C8C8C8C8C"},
                {"symbol": "USDT", "address": "0xB1c97a44F5552c9DD5D5D5D5D5D5D5D5D5D5D5D5D"},
                {"symbol": "ETH", "address": "0x0000000000000000000000000000000000000000"},
            ],
            "fees": {"deposit_fee": 0.001, "withdrawal_fee": 0.001, "minimum_amount": 10.0},
            "limits": {
                "daily_limit": 1000000.0,
                "per_transaction_limit": 100000.0,
                "minimum_confirmation_blocks": 12,
            },
            "security_features": [
                "Multi-signature validation",
                "Time-lock mechanisms",
                "Circuit breakers",
                "Emergency pause functionality",
            ],
            "last_updated": "2024-01-01T00:00:00Z",
        }

        return bridge_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bridge info: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Advanced Security Monitoring Endpoints


class AttestationAnomalyRequest(BaseModel):
    """Request model for attestation anomaly detection."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    time_range: str = Field(default="24h", description="Time range to analyze: 1h, 24h, 7d")
    include_details: bool = Field(default=True, description="Include detailed anomaly information")


class QuorumAnalysisRequest(BaseModel):
    """Request model for quorum analysis."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    analysis_period: str = Field(default="7d", description="Analysis period: 1d, 7d, 30d")


class ProofOfReservesRequest(BaseModel):
    """Request model for proof-of-reserves monitoring."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    include_asset_breakdown: bool = Field(
        default=True, description="Include detailed asset breakdown"
    )


class AttackPlaybookAnalysisRequest(BaseModel):
    """Request model for attack playbook analysis."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    transaction_data: list[dict[str, Any]] = Field(..., description="Transaction data to analyze")
    attack_types: list[str] = Field(
        default_factory=lambda: ["all"], description="Specific attack types to check"
    )


class SignatureValidationRequest(BaseModel):
    """Request model for signature validation."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    signatures: list[dict[str, str]] = Field(..., description="Signatures to validate")


class ComprehensiveSecurityScanRequest(BaseModel):
    """Request model for comprehensive security scan."""

    bridge_address: str = Field(..., description="Bridge contract address")
    network: str = Field(..., description="Network where bridge is deployed")
    transaction_data: list[dict[str, Any]] = Field(
        default_factory=list, description="Transaction data to analyze"
    )
    scan_options: dict[str, Any] = Field(
        default_factory=lambda: {
            "include_attack_analysis": True,
            "include_signature_analysis": True,
            "include_attestation_analysis": True,
            "include_quorum_analysis": True,
            "deep_scan": False,
        },
        description="Scan configuration options",
    )


@router.post("/detect-attestation-anomalies")
async def detect_attestation_anomalies(
    request: AttestationAnomalyRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Detect attestation anomalies in bridge operations.

    This endpoint analyzes bridge attestation patterns to identify anomalies
    such as unusual signature patterns, missing attestations, and timing issues.
    """
    try:
        logger.info(f"Detecting attestation anomalies for {request.bridge_address}")

        anomalies = await analyzer.detect_attestation_anomalies(
            bridge_address=request.bridge_address, network=request.network
        )

        return {
            "bridge_address": request.bridge_address,
            "network": request.network,
            "analysis_timestamp": datetime.now().isoformat(),
            "anomalies": anomalies,
            "summary": {
                "total_anomalies": len(anomalies.get("attestation_anomalies", [])),
                "severity_score": anomalies.get("severity_score", 0),
                "risk_level": anomalies.get("risk_level", "unknown"),
            },
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error detecting attestation anomalies: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/analyze-quorum-skews")
async def analyze_quorum_skews(
    request: QuorumAnalysisRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Analyze quorum skews and liveness gaps in bridge validators.

    This endpoint performs detailed analysis of validator quorum behavior,
    identifying concentration risks, liveness issues, and diversity problems.
    """
    try:
        logger.info(f"Analyzing quorum skews for {request.bridge_address}")

        analysis = await analyzer.analyze_quorum_skews(
            bridge_address=request.bridge_address, network=request.network
        )

        return {
            "bridge_address": request.bridge_address,
            "network": request.network,
            "analysis_timestamp": datetime.now().isoformat(),
            "analysis": analysis,
            "summary": {
                "quorum_met": analysis["quorum_analysis"]["is_quorum_met"],
                "active_validators": analysis["quorum_analysis"]["active_validators"],
                "liveness_gaps_count": len(analysis["quorum_analysis"]["liveness_gaps"]),
                "diversity_score": analysis["skew_analysis"]["diversity_score"],
            },
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing quorum skews: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/proof-of-reserves-monitoring")
async def proof_of_reserves_monitoring(
    request: ProofOfReservesRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Monitor proof-of-reserves for bridge contracts.

    This endpoint checks collateralization ratios, guardian quorum diversity,
    and overall reserves health for the bridge.
    """
    try:
        logger.info(f"Monitoring proof-of-reserves for {request.bridge_address}")

        monitoring = await analyzer.proof_of_reserves_monitoring(
            bridge_address=request.bridge_address, network=request.network
        )

        return {
            "bridge_address": request.bridge_address,
            "network": request.network,
            "monitoring_timestamp": datetime.now().isoformat(),
            "monitoring": monitoring,
            "summary": {
                "is_healthy": monitoring["reserves_status"]["is_healthy"],
                "collateralization_ratio": monitoring["reserves_status"]["collateralization_ratio"],
                "total_reserves_usd": monitoring["reserves_status"]["total_reserves_usd"],
                "guardian_diversity_score": monitoring["guardian_quorum"]["diversity_score"],
                "risk_assessment": monitoring.get("risk_assessment", "unknown"),
            },
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error monitoring proof-of-reserves: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/attack-playbook-analysis")
async def analyze_attack_playbooks(
    request: AttackPlaybookAnalysisRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Analyze transactions against known attack playbooks.

    This endpoint compares bridge transactions against historical attack patterns
    including Ronin Bridge Hack, Wormhole Exploit, and Multichain Exploit.
    """
    try:
        logger.info(f"Analyzing attack playbooks for {request.bridge_address}")

        # Use the security monitor's attack analyzer
        attack_analyzer = AttackPlaybookAnalyzer()
        analysis_results = []

        for tx_data in request.transaction_data:
            result = await attack_analyzer.analyze_transaction_against_playbooks(tx_data)
            analysis_results.append(result)

        # Aggregate results
        total_risk_score = sum(r["risk_score"] for r in analysis_results) / max(
            len(analysis_results), 1
        )
        critical_matches = sum(
            1
            for r in analysis_results
            if any(m["severity"] == "critical" for m in r.get("matched_attacks", []))
        )

        return {
            "bridge_address": request.bridge_address,
            "network": request.network,
            "analysis_timestamp": datetime.now().isoformat(),
            "total_transactions": len(request.transaction_data),
            "results": analysis_results,
            "summary": {
                "average_risk_score": total_risk_score,
                "critical_pattern_matches": critical_matches,
                "overall_risk_level": (
                    "critical"
                    if total_risk_score >= 7
                    else (
                        "high"
                        if total_risk_score >= 4
                        else "medium" if total_risk_score >= 2 else "low"
                    )
                ),
                "recommendations": [
                    "Monitor for unusual transaction patterns",
                    "Implement real-time signature validation",
                    "Regularly rotate validator keys",
                    "Set up alert systems for anomalous behavior",
                ],
            },
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing attack playbooks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/validate-signatures")
async def validate_signatures(
    request: SignatureValidationRequest, analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer)
):
    """
    Validate signatures for forgery detection.

    This endpoint validates cryptographic signatures and detects potential
    forgery indicators such as signature reuse, timestamp manipulation, etc.
    """
    try:
        logger.info(f"Validating signatures for {request.bridge_address}")

        # Use the security monitor's signature detector
        signature_detector = SignatureForgeryDetector()
        validation_results = await signature_detector.batch_validate_signatures(request.signatures)

        # Aggregate results
        valid_signatures = sum(1 for r in validation_results if r["is_valid"])
        forged_signatures = sum(1 for r in validation_results if r["forgery_indicators"])
        average_confidence = sum(r["confidence_score"] for r in validation_results) / max(
            len(validation_results), 1
        )

        return {
            "bridge_address": request.bridge_address,
            "network": request.network,
            "validation_timestamp": datetime.now().isoformat(),
            "total_signatures": len(request.signatures),
            "results": validation_results,
            "summary": {
                "valid_signatures": valid_signatures,
                "forged_signatures": forged_signatures,
                "average_confidence_score": average_confidence,
                "overall_status": (
                    "secure"
                    if forged_signatures == 0
                    else (
                        "compromised"
                        if forged_signatures > len(request.signatures) * 0.1
                        else "warning"
                    )
                ),
                "alerts": (
                    [f"{forged_signatures} potentially forged signatures detected"]
                    if forged_signatures > 0
                    else []
                ),
            },
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error validating signatures: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/comprehensive-security-scan")
async def comprehensive_security_scan(
    request: ComprehensiveSecurityScanRequest,
    analyzer: BridgeAnalyzer = Depends(get_bridge_analyzer),
):
    """
    Perform comprehensive security scan of bridge operations.

    This endpoint combines all security monitoring features into a single
    comprehensive analysis including attack patterns, signature validation,
    attestation anomalies, and quorum analysis.
    """
    try:
        logger.info(f"Starting comprehensive security scan for {request.bridge_address}")

        # Use the security monitor for comprehensive analysis
        scan_result = await analyzer.security_monitor.comprehensive_security_scan(
            bridge_address=request.bridge_address,
            network=request.network,
            tx_data=request.transaction_data,
        )

        return {
            "bridge_address": request.bridge_address,
            "network": request.network,
            "scan_timestamp": datetime.now().isoformat(),
            "scan_result": scan_result,
            "executive_summary": {
                "overall_risk_score": scan_result["overall_risk_score"],
                "risk_level": scan_result["scan_summary"]["risk_level"],
                "total_alerts": scan_result["scan_summary"]["total_alerts"],
                "total_recommendations": scan_result["scan_summary"]["total_recommendations"],
                "critical_findings": [
                    alert["message"]
                    for alert in scan_result["alerts"]
                    if alert["severity"] == "critical"
                ],
            },
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error performing comprehensive security scan: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
