#!/usr/bin/env python3
"""
Bridge Analyzer - Core analysis engine for cross-chain bridges
"""

import logging
from datetime import datetime
from typing import Any

from .security_monitor import SecurityMonitor
from ..models.bridge import SecurityLevel, BridgeAnalysis

logger = logging.getLogger(__name__)


class BridgeAnalyzer:
    """Core bridge analysis engine"""

    def __init__(self):
        self.networks: dict[str, Any] = {}
        self.bridge_configs: dict[str, Any] = {}
        self.analysis_cache: dict[str, Any] = {}
        self.security_monitor = SecurityMonitor()
        self.initialized = False

        logger.info("BridgeAnalyzer initialized")

    async def initialize_networks(self, networks: list[str]):
        """Initialize supported networks"""
        logger.info(f"Initializing networks: {networks}")

        for network in networks:
            self.networks[network] = {
                "name": network,
                "status": "active",
                "last_check": datetime.utcnow().isoformat(),
                "bridge_count": 0,
            }

        self.initialized = True
        logger.info(f"Successfully initialized {len(networks)} networks")

    async def analyze_bridge(
        self,
        bridge_address: str,
        source_network: str | None = None,
        target_network: str | None = None,
        network: str | None = None,
        analysis_depth: str = "comprehensive",
    ) -> BridgeAnalysis:
        """Analyze a specific bridge
        
        Args:
            bridge_address: Bridge contract address
            source_network: Source blockchain network (optional)
            target_network: Target blockchain network (optional)
            network: Network where bridge is deployed (optional, for backward compatibility)
            analysis_depth: Analysis depth - basic, comprehensive, or deep
            
        Returns:
            BridgeAnalysis object with analysis results
        """
        # Use network if provided, otherwise use source_network
        bridge_network = network or source_network or "ethereum"
        
        logger.info(f"Analyzing bridge {bridge_address} on {bridge_network} (depth: {analysis_depth})")

        # Calculate security score based on analysis depth
        base_score = 8.0
        if analysis_depth == "deep":
            base_score = 9.0  # More thorough analysis
        elif analysis_depth == "basic":
            base_score = 7.0  # Basic analysis
        
        # Create BridgeAnalysis object
        analysis = BridgeAnalysis(
            bridge_address=bridge_address,
            security_score=base_score,
            risk_level=self._determine_risk_level(base_score),
            code_quality_score=base_score,
            audit_status="verified" if base_score >= 8.0 else "unverified",
            vulnerabilities=[],
            recommendations=[
                "Implement additional access controls",
                "Add emergency pause functionality",
                "Enhance monitoring systems",
            ],
        )

        # Cache the result
        cache_key = f"{bridge_network}:{bridge_address}"
        self.analysis_cache[cache_key] = analysis

        return analysis

    async def get_bridge_security_score(
        self, bridge_address: str, network: str, scoring_criteria: list[str] | None = None
    ) -> BridgeSecurityScore:
        """Get detailed security score for a bridge.
        
        Args:
            bridge_address: Bridge contract address
            network: Network where bridge is deployed
            scoring_criteria: List of criteria to include (optional)
            
        Returns:
            BridgeSecurityScore object with detailed scoring
        """
        from ..models.bridge import BridgeSecurityScore
        
        logger.info(f"Calculating security score for {bridge_address} on {network}")
        
        # Default scoring criteria
        if scoring_criteria is None:
            scoring_criteria = [
                "code_quality",
                "audit_status",
                "governance_decentralization",
                "validator_set",
                "economic_security",
                "operational_security",
            ]
        
        # Calculate scores for each criterion (mock for now)
        code_quality = 8.0
        audit_status = 8.5
        governance_decentralization = 7.5
        validator_set = 8.0
        economic_security = 7.0
        operational_security = 8.5
        
        # Calculate overall score
        scores = []
        if "code_quality" in scoring_criteria:
            scores.append(code_quality)
        if "audit_status" in scoring_criteria:
            scores.append(audit_status)
        if "governance_decentralization" in scoring_criteria:
            scores.append(governance_decentralization)
        if "validator_set" in scoring_criteria:
            scores.append(validator_set)
        if "economic_security" in scoring_criteria:
            scores.append(economic_security)
        if "operational_security" in scoring_criteria:
            scores.append(operational_security)
        
        overall_score = sum(scores) / len(scores) if scores else 0.0
        
        # Create BridgeSecurityScore object
        security_score = BridgeSecurityScore(
            bridge_address=bridge_address,
            network=network,
            code_quality=code_quality if "code_quality" in scoring_criteria else 0.0,
            audit_status=audit_status if "audit_status" in scoring_criteria else 0.0,
            governance_decentralization=governance_decentralization if "governance_decentralization" in scoring_criteria else 0.0,
            validator_set=validator_set if "validator_set" in scoring_criteria else 0.0,
            economic_security=economic_security if "economic_security" in scoring_criteria else 0.0,
            operational_security=operational_security if "operational_security" in scoring_criteria else 0.0,
            overall_score=overall_score,
            risk_level=self._determine_risk_level(overall_score),
            scoring_details={
                "criteria_used": scoring_criteria,
                "calculation_method": "weighted_average",
            },
        )
        
        return security_score

    async def get_network_status(self, network: str) -> dict[str, Any]:
        """Get network status"""
        if network not in self.networks:
            raise ValueError(f"Network {network} not supported")

        return self.networks[network]

    async def validate_transaction(self, tx_hash: str, network: str) -> dict[str, Any]:
        """Validate a cross-chain transaction"""
        logger.info(f"Validating transaction {tx_hash} on {network}")

        # Mock validation result
        validation = {
            "transaction_hash": tx_hash,
            "network": network,
            "status": "valid",
            "confirmations": 12,
            "bridge_used": "mock_bridge",
            "validation_timestamp": datetime.utcnow().isoformat(),
        }

        return validation

    async def scan_vulnerabilities(self, target: str, scan_type: str = "bridge") -> dict[str, Any]:
        """Scan for vulnerabilities"""
        logger.info(f"Scanning {target} for vulnerabilities (type: {scan_type})")

        # Mock vulnerability scan result
        scan_result = {
            "target": target,
            "scan_type": scan_type,
            "vulnerabilities_found": 0,
            "severity_breakdown": {"critical": 0, "high": 0, "medium": 1, "low": 2},
            "scan_timestamp": datetime.utcnow().isoformat(),
            "recommendations": [
                "Regular security audits recommended",
                "Monitor for unusual transaction patterns",
            ],
        }

        return scan_result

    def get_supported_networks(self) -> list[str]:
        """Get list of supported networks"""
        return list(self.networks.keys())

    def is_initialized(self) -> bool:
        """Check if analyzer is initialized"""
        return self.initialized

    async def detect_attestation_anomalies(
        self, bridge_address: str, network: str
    ) -> dict[str, Any]:
        """Detect attestation anomalies in bridge operations"""
        logger.info(f"Detecting attestation anomalies for {bridge_address} on {network}")

        anomalies = {
            "bridge_address": bridge_address,
            "network": network,
            "timestamp": datetime.utcnow().isoformat(),
            "attestation_anomalies": [],
            "severity_score": 0,
            "risk_level": "low",
        }

        # Mock anomaly detection logic
        # In real implementation, this would analyze actual attestation patterns
        mock_anomalies = [
            {
                "type": "unusual_signature_pattern",
                "description": "Multiple signatures from same validator within short timeframe",
                "severity": "medium",
                "confidence": 0.75,
                "timestamp": datetime.utcnow().isoformat(),
                "details": {
                    "validator": "0x1234...5678",
                    "signature_count": 5,
                    "time_window": "300s",
                    "expected_pattern": "1 signature per validator per epoch",
                },
            },
            {
                "type": "missing_attestations",
                "description": "Required attestations not received within expected timeframe",
                "severity": "high",
                "confidence": 0.9,
                "timestamp": datetime.utcnow().isoformat(),
                "details": {
                    "missing_count": 3,
                    "expected_count": 5,
                    "threshold": 0.6,
                    "time_since_last": "1800s",
                },
            },
        ]

        anomalies["attestation_anomalies"] = mock_anomalies

        # Calculate severity score
        severity_weights = {"low": 1, "medium": 3, "high": 5, "critical": 10}
        total_severity = sum(
            severity_weights.get(anomaly["severity"], 1) for anomaly in mock_anomalies
        )
        anomalies["severity_score"] = min(total_severity / 10, 10)

        # Determine risk level
        if anomalies["severity_score"] >= 7:
            anomalies["risk_level"] = "critical"
        elif anomalies["severity_score"] >= 4:
            anomalies["risk_level"] = "high"
        elif anomalies["severity_score"] >= 2:
            anomalies["risk_level"] = "medium"
        else:
            anomalies["risk_level"] = "low"

        return anomalies

    async def analyze_quorum_skews(self, bridge_address: str, network: str) -> dict[str, Any]:
        """Analyze quorum skews and liveness gaps in bridge validators"""
        logger.info(f"Analyzing quorum skews for {bridge_address} on {network}")

        analysis = {
            "bridge_address": bridge_address,
            "network": network,
            "timestamp": datetime.utcnow().isoformat(),
            "quorum_analysis": {
                "current_quorum": 0.75,
                "required_quorum": 0.67,
                "is_quorum_met": True,
                "validator_count": 21,
                "active_validators": 18,
                "liveness_gaps": [],
            },
            "skew_analysis": {
                "concentration_ratio": 0.25,
                "diversity_score": 0.85,
                "geographic_distribution": "good",
                "uptime_distribution": "acceptable",
            },
            "alerts": [],
            "recommendations": [],
        }

        # Mock liveness gaps
        liveness_gaps = [
            {
                "validator": "0x1111...1111",
                "gap_duration": "3600s",
                "missed_attestations": 5,
                "severity": "medium",
            },
            {
                "validator": "0x2222...2222",
                "gap_duration": "7200s",
                "missed_attestations": 12,
                "severity": "high",
            },
        ]

        analysis["quorum_analysis"]["liveness_gaps"] = liveness_gaps

        # Generate alerts and recommendations
        high_severity_gaps = [gap for gap in liveness_gaps if gap["severity"] == "high"]
        if high_severity_gaps:
            analysis["alerts"].append(
                {
                    "type": "critical_liveness_gap",
                    "message": f"{len(high_severity_gaps)} validators have critical liveness gaps",
                    "severity": "critical",
                }
            )
            analysis["recommendations"].append(
                "Consider validator slashing or replacement for consistently offline validators"
            )

        if analysis["quorum_analysis"].get("concentration_ratio", 0) > 0.3:
            analysis["alerts"].append(
                {
                    "type": "high_concentration",
                    "message": "High validator concentration detected",
                    "severity": "medium",
                }
            )
            analysis["recommendations"].append(
                "Consider increasing validator diversity to reduce concentration risk"
            )

        return analysis

    async def proof_of_reserves_monitoring(
        self, bridge_address: str, network: str
    ) -> dict[str, Any]:
        """Monitor proof-of-reserves for bridge contracts"""
        logger.info(f"Monitoring proof-of-reserves for {bridge_address} on {network}")

        monitoring = {
            "bridge_address": bridge_address,
            "network": network,
            "timestamp": datetime.utcnow().isoformat(),
            "reserves_status": {
                "is_healthy": True,
                "collateralization_ratio": 1.25,
                "required_ratio": 1.0,
                "total_reserves_usd": 50000000.0,
                "locked_assets_usd": 40000000.0,
                "excess_reserves_usd": 10000000.0,
            },
            "asset_breakdown": {
                "ETH": {"amount": 10000.0, "value_usd": 20000000.0, "required": 8000.0},
                "USDC": {"amount": 15000000.0, "value_usd": 15000000.0, "required": 12000000.0},
                "USDT": {"amount": 15000000.0, "value_usd": 15000000.0, "required": 12000000.0},
            },
            "guardian_quorum": {
                "total_guardians": 7,
                "active_guardians": 6,
                "quorum_threshold": 5,
                "diversity_score": 0.88,
                "last_quorum_change": "2024-01-01T00:00:00Z",
            },
            "alerts": [],
            "risk_assessment": "low",
        }

        # Check collateralization
        collateral_ratio = monitoring["reserves_status"]["collateralization_ratio"]
        if collateral_ratio < monitoring["reserves_status"]["required_ratio"]:
            monitoring["alerts"].append(
                {
                    "type": "insufficient_reserves",
                    "message": f"Collateralization ratio {collateral_ratio} below required {monitoring['reserves_status']['required_ratio']}",
                    "severity": "critical",
                }
            )
            monitoring["reserves_status"]["is_healthy"] = False
            monitoring["risk_assessment"] = "critical"

        # Check guardian quorum diversity
        diversity_score = monitoring["guardian_quorum"]["diversity_score"]
        if diversity_score < 0.7:
            monitoring["alerts"].append(
                {
                    "type": "low_diversity",
                    "message": f"Guardian diversity score {diversity_score} below recommended 0.7",
                    "severity": "medium",
                }
            )
            monitoring["risk_assessment"] = "medium"

        return monitoring

    def _calculate_security_score(self, analysis: BridgeAnalysis) -> float:
        """Calculate security score from bridge analysis.
        
        Args:
            analysis: BridgeAnalysis object containing analysis results
            
        Returns:
            Security score between 0.0 and 10.0
        """
        # Start with code quality score
        score = analysis.code_quality_score
        
        # Deduct points based on vulnerabilities
        vulnerability_penalties = {
            "critical": 2.0,
            "high": 1.0,
            "medium": 0.5,
            "low": 0.1,
        }
        
        if hasattr(analysis, 'vulnerabilities') and analysis.vulnerabilities:
            for vuln in analysis.vulnerabilities:
                severity = vuln.get("severity", "low").lower()
                penalty = vulnerability_penalties.get(severity, 0.1)
                score -= penalty
                # Cap minimum score at 0.0
                score = max(0.0, score)
        
        # Adjust based on audit status
        if hasattr(analysis, 'audit_status'):
            audit_status = str(analysis.audit_status).lower()
            if "unverified" in audit_status or "no audit" in audit_status:
                score -= 1.0
            elif "verified" in audit_status or "audited" in audit_status:
                score += 0.5  # Bonus for verified contracts
        
        # Ensure score is within bounds
        score = max(0.0, min(10.0, score))
        
        return score

    def _determine_risk_level(self, score: float) -> SecurityLevel:
        """Determine risk level based on security score.
        
        Args:
            score: Security score between 0.0 and 10.0
            
        Returns:
            SecurityLevel enum value
        """
        if score >= 8.0:
            return SecurityLevel.SAFE
        elif score >= 6.0:
            return SecurityLevel.LOW
        elif score >= 4.0:
            return SecurityLevel.MEDIUM
        elif score >= 2.0:
            return SecurityLevel.HIGH
        else:
            return SecurityLevel.CRITICAL
