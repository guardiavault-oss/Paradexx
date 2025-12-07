#!/usr/bin/env python3
"""
Attack Detection System - Signature mismatch and forgery detectors based on past exploits
"""

import logging
import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class AttackType(str, Enum):
    """Types of bridge attacks"""

    SIGNATURE_FORGERY = "signature_forgery"
    REPLAY_ATTACK = "replay_attack"
    DOUBLE_SPENDING = "double_spending"
    VALIDATOR_COMPROMISE = "validator_compromise"
    ECONOMIC_ATTACK = "economic_attack"
    GOVERNANCE_ATTACK = "governance_attack"
    LIQUIDITY_DRAIN = "liquidity_drain"
    CROSS_CHAIN_ARBITRAGE = "cross_chain_arbitrage"
    TIME_DELAY_ATTACK = "time_delay_attack"
    QUORUM_MANIPULATION = "quorum_manipulation"


class ThreatLevel(str, Enum):
    """Threat severity levels"""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class SignatureType(str, Enum):
    """Types of signatures"""

    ECDSA = "ecdsa"
    ED25519 = "ed25519"
    BLS = "bls"
    MULTISIG = "multisig"
    THRESHOLD = "threshold"
    UNKNOWN = "unknown"


@dataclass
class AttackPattern:
    """Attack pattern from historical data"""

    attack_id: str
    attack_type: AttackType
    description: str
    signature_patterns: list[str]
    transaction_patterns: list[dict[str, Any]]
    timing_patterns: list[dict[str, Any]]
    economic_indicators: list[dict[str, Any]]
    success_rate: float
    damage_estimate: float
    mitigation_strategies: list[str]
    detection_rules: list[dict[str, Any]]


@dataclass
class SignatureAnalysis:
    """Signature analysis result"""

    signature: str
    signature_type: SignatureType
    is_valid: bool
    is_forged: bool
    confidence_score: float
    anomalies: list[str]
    verification_method: str
    timestamp: datetime


@dataclass
class AttackDetection:
    """Attack detection result"""

    detection_id: str
    attack_type: AttackType
    threat_level: ThreatLevel
    confidence: float
    description: str
    detected_at: datetime
    evidence: dict[str, Any]
    affected_components: list[str]
    recommended_actions: list[str]
    mitigation_priority: int


class AttackDetectionSystem:
    """Comprehensive attack detection and signature analysis system"""

    def __init__(self):
        self.attack_patterns: dict[str, AttackPattern] = {}
        self.signature_database: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.transaction_history: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.detection_rules: list[dict[str, Any]] = []
        self.attack_detections: list[AttackDetection] = []

        # Initialize with known attack patterns
        self._initialize_attack_patterns()
        self._initialize_detection_rules()

        logger.info("AttackDetectionSystem initialized")

    def _initialize_attack_patterns(self):
        """Initialize known attack patterns from historical exploits"""

        # Ronin Bridge Attack (2022)
        ronin_attack = AttackPattern(
            attack_id="ronin_bridge_2022",
            attack_type=AttackType.VALIDATOR_COMPROMISE,
            description="Private key compromise leading to unauthorized withdrawals",
            signature_patterns=[
                "repeated_signature_usage",
                "unusual_validator_behavior",
                "rapid_successive_transactions",
            ],
            transaction_patterns=[
                {"type": "withdrawal", "amount_threshold": 1000000, "frequency": "rapid"},
                {"type": "cross_chain", "destination": "unknown", "pattern": "suspicious"},
            ],
            timing_patterns=[
                {"window": "1_hour", "transaction_count": 10, "threshold": "high"},
                {"pattern": "burst", "duration": "short", "frequency": "unusual"},
            ],
            economic_indicators=[
                {"metric": "withdrawal_amount", "threshold": 1000000, "comparison": "gt"},
                {"metric": "daily_volume_ratio", "threshold": 0.5, "comparison": "gt"},
            ],
            success_rate=1.0,
            damage_estimate=625000000,  # $625M
            mitigation_strategies=[
                "Implement multi-signature requirements",
                "Add time delays for large withdrawals",
                "Monitor validator behavior patterns",
                "Implement emergency pause mechanisms",
            ],
            detection_rules=[
                {"rule": "large_withdrawal", "threshold": 1000000, "action": "alert"},
                {"rule": "rapid_transactions", "count": 5, "window": "1_minute", "action": "block"},
                {"rule": "signature_reuse", "action": "critical_alert"},
            ],
        )
        self.attack_patterns["ronin_bridge_2022"] = ronin_attack

        # Wormhole Bridge Attack (2022)
        wormhole_attack = AttackPattern(
            attack_id="wormhole_bridge_2022",
            attack_type=AttackType.SIGNATURE_FORGERY,
            description="Signature validation bypass leading to unauthorized minting",
            signature_patterns=[
                "invalid_signature_format",
                "signature_validation_bypass",
                "unusual_signing_behavior",
            ],
            transaction_patterns=[
                {"type": "mint", "amount_threshold": 100000, "frequency": "rapid"},
                {"type": "cross_chain", "validation": "bypassed", "pattern": "suspicious"},
            ],
            timing_patterns=[
                {"window": "30_minutes", "transaction_count": 20, "threshold": "high"},
                {"pattern": "burst", "duration": "medium", "frequency": "unusual"},
            ],
            economic_indicators=[
                {"metric": "mint_amount", "threshold": 100000, "comparison": "gt"},
                {"metric": "daily_mint_ratio", "threshold": 0.3, "comparison": "gt"},
            ],
            success_rate=1.0,
            damage_estimate=325000000,  # $325M
            mitigation_strategies=[
                "Implement proper signature validation",
                "Add multiple signature verification layers",
                "Monitor minting patterns",
                "Implement rate limiting",
            ],
            detection_rules=[
                {"rule": "signature_validation", "action": "critical_alert"},
                {"rule": "rapid_minting", "count": 10, "window": "10_minutes", "action": "block"},
                {"rule": "unusual_mint_amount", "threshold": 100000, "action": "alert"},
            ],
        )
        self.attack_patterns["wormhole_bridge_2022"] = wormhole_attack

        # Harmony Bridge Attack (2022)
        harmony_attack = AttackPattern(
            attack_id="harmony_bridge_2022",
            attack_type=AttackType.ECONOMIC_ATTACK,
            description="Economic exploit through token manipulation",
            signature_patterns=[
                "coordinated_validator_behavior",
                "unusual_economic_patterns",
                "rapid_value_fluctuations",
            ],
            transaction_patterns=[
                {"type": "swap", "amount_threshold": 50000, "frequency": "rapid"},
                {"type": "cross_chain", "economic_impact": "high", "pattern": "coordinated"},
            ],
            timing_patterns=[
                {"window": "2_hours", "transaction_count": 50, "threshold": "high"},
                {"pattern": "coordinated", "duration": "long", "frequency": "unusual"},
            ],
            economic_indicators=[
                {"metric": "price_impact", "threshold": 0.1, "comparison": "gt"},
                {"metric": "volume_spike", "threshold": 5.0, "comparison": "gt"},
            ],
            success_rate=0.8,
            damage_estimate=100000000,  # $100M
            mitigation_strategies=[
                "Implement economic monitoring",
                "Add price impact limits",
                "Monitor coordinated behavior",
                "Implement circuit breakers",
            ],
            detection_rules=[
                {"rule": "price_manipulation", "threshold": 0.1, "action": "alert"},
                {
                    "rule": "coordinated_behavior",
                    "count": 10,
                    "window": "1_hour",
                    "action": "investigate",
                },
                {"rule": "volume_spike", "threshold": 5.0, "action": "monitor"},
            ],
        )
        self.attack_patterns["harmony_bridge_2022"] = harmony_attack

    def _initialize_detection_rules(self):
        """Initialize detection rules based on attack patterns"""
        self.detection_rules = [
            # Signature-based rules
            {
                "rule_id": "signature_reuse",
                "type": "signature",
                "description": "Detect signature reuse across transactions",
                "pattern": "duplicate_signature",
                "threshold": 1,
                "action": "critical_alert",
                "time_window": 3600,  # 1 hour
            },
            {
                "rule_id": "invalid_signature_format",
                "type": "signature",
                "description": "Detect invalid signature formats",
                "pattern": "format_validation",
                "threshold": 0,
                "action": "block",
                "time_window": 0,
            },
            {
                "rule_id": "signature_validation_bypass",
                "type": "signature",
                "description": "Detect signature validation bypasses",
                "pattern": "validation_bypass",
                "threshold": 0,
                "action": "critical_alert",
                "time_window": 0,
            },
            # Transaction-based rules
            {
                "rule_id": "large_withdrawal",
                "type": "transaction",
                "description": "Detect unusually large withdrawals",
                "pattern": "withdrawal_amount",
                "threshold": 1000000,
                "action": "alert",
                "time_window": 3600,
            },
            {
                "rule_id": "rapid_transactions",
                "type": "transaction",
                "description": "Detect rapid successive transactions",
                "pattern": "transaction_frequency",
                "threshold": 10,
                "action": "investigate",
                "time_window": 300,  # 5 minutes
            },
            {
                "rule_id": "unusual_mint_pattern",
                "type": "transaction",
                "description": "Detect unusual minting patterns",
                "pattern": "mint_frequency",
                "threshold": 5,
                "action": "monitor",
                "time_window": 600,  # 10 minutes
            },
            # Economic-based rules
            {
                "rule_id": "price_manipulation",
                "type": "economic",
                "description": "Detect price manipulation attempts",
                "pattern": "price_impact",
                "threshold": 0.1,
                "action": "alert",
                "time_window": 1800,  # 30 minutes
            },
            {
                "rule_id": "volume_spike",
                "type": "economic",
                "description": "Detect unusual volume spikes",
                "pattern": "volume_increase",
                "threshold": 5.0,
                "action": "monitor",
                "time_window": 3600,
            },
            # Behavioral rules
            {
                "rule_id": "coordinated_behavior",
                "type": "behavioral",
                "description": "Detect coordinated validator behavior",
                "pattern": "validator_coordination",
                "threshold": 0.8,
                "action": "investigate",
                "time_window": 3600,
            },
            {
                "rule_id": "unusual_timing",
                "type": "behavioral",
                "description": "Detect unusual transaction timing",
                "pattern": "timing_anomaly",
                "threshold": 2.0,
                "action": "monitor",
                "time_window": 1800,
            },
        ]

    async def analyze_signature(
        self, signature: str, transaction_data: dict[str, Any]
    ) -> SignatureAnalysis:
        """Analyze signature for forgery and validity"""
        logger.info(f"Analyzing signature: {signature[:20]}...")

        # Determine signature type
        signature_type = self._identify_signature_type(signature)

        # Check for signature reuse
        is_reused = await self._check_signature_reuse(signature)

        # Validate signature format
        is_valid_format = self._validate_signature_format(signature, signature_type)

        # Check for known attack patterns
        attack_indicators = await self._check_attack_patterns(signature, transaction_data)

        # Calculate confidence score
        confidence_score = self._calculate_signature_confidence(
            is_valid_format, is_reused, attack_indicators
        )

        # Determine if signature is forged
        is_forged = confidence_score < 0.5 or is_reused or not is_valid_format

        # Collect anomalies
        anomalies = []
        if is_reused:
            anomalies.append("Signature reuse detected")
        if not is_valid_format:
            anomalies.append("Invalid signature format")
        if attack_indicators:
            anomalies.extend(attack_indicators)

        return SignatureAnalysis(
            signature=signature,
            signature_type=signature_type,
            is_valid=is_valid_format and not is_reused,
            is_forged=is_forged,
            confidence_score=confidence_score,
            anomalies=anomalies,
            verification_method="multi_layer_analysis",
            timestamp=datetime.utcnow(),
        )

    def _identify_signature_type(self, signature: str) -> SignatureType:
        """Identify the type of signature"""
        if not signature or len(signature) < 64:
            return SignatureType.UNKNOWN

        # ECDSA signatures are typically 65 bytes (130 hex characters)
        if len(signature) == 130 and all(c in "0123456789abcdefABCDEF" for c in signature):
            return SignatureType.ECDSA

        # Ed25519 signatures are typically 64 bytes (128 hex characters)
        if len(signature) == 128 and all(c in "0123456789abcdefABCDEF" for c in signature):
            return SignatureType.ED25519

        # BLS signatures can vary in length
        if len(signature) in [96, 192] and all(c in "0123456789abcdefABCDEF" for c in signature):
            return SignatureType.BLS

        # Multisig signatures often contain multiple signatures
        if "," in signature or "|" in signature:
            return SignatureType.MULTISIG

        return SignatureType.UNKNOWN

    def _validate_signature_format(self, signature: str, signature_type: SignatureType) -> bool:
        """Validate signature format based on type"""
        if signature_type == SignatureType.UNKNOWN:
            return False

        # Basic format validation
        if not signature or not all(c in "0123456789abcdefABCDEF" for c in signature):
            return False

        # Length validation based on type
        if (signature_type == SignatureType.ECDSA and len(signature) != 130) or (
            signature_type == SignatureType.ED25519 and len(signature) != 128
        ):
            return False
        if signature_type == SignatureType.BLS and len(signature) not in [96, 192]:
            return False

        return True

    async def _check_signature_reuse(self, signature: str) -> bool:
        """Check if signature has been used before"""
        # Check in signature database
        for stored_signatures in self.signature_database.values():
            if signature in stored_signatures:
                return True

        return False

    async def _check_attack_patterns(
        self, signature: str, transaction_data: dict[str, Any]
    ) -> list[str]:
        """Check for known attack patterns in signature and transaction"""
        indicators = []

        # Check against known attack patterns
        for pattern in self.attack_patterns.values():
            for sig_pattern in pattern.signature_patterns:
                if await self._matches_pattern(signature, sig_pattern):
                    indicators.append(
                        f"Matches {pattern.attack_id} signature pattern: {sig_pattern}"
                    )

        # Check transaction patterns
        for pattern in self.attack_patterns.values():
            for tx_pattern in pattern.transaction_patterns:
                if self._matches_transaction_pattern(transaction_data, tx_pattern):
                    indicators.append(f"Matches {pattern.attack_id} transaction pattern")

        return indicators

    async def _matches_pattern(self, signature: str, pattern: str) -> bool:
        """Check if signature matches a specific pattern"""
        if pattern == "repeated_signature_usage":
            return await self._check_signature_reuse(signature)
        if pattern == "invalid_signature_format":
            return not self._validate_signature_format(
                signature, self._identify_signature_type(signature)
            )
        if pattern == "unusual_signing_behavior":
            # Check for unusual patterns in signature
            return len(set(signature)) < len(signature) * 0.5  # Low entropy
        return False

    def _matches_transaction_pattern(
        self, transaction_data: dict[str, Any], pattern: dict[str, Any]
    ) -> bool:
        """Check if transaction matches a specific pattern"""
        if (pattern.get("type") == "withdrawal" and "amount" in transaction_data) or (
            pattern.get("type") == "mint" and "amount" in transaction_data
        ):
            amount = transaction_data["amount"]
            threshold = pattern.get("amount_threshold", 0)
            return amount > threshold
        if pattern.get("pattern") == "suspicious":
            # Check for suspicious transaction characteristics
            return (
                transaction_data.get("gas_price", 0) > 1000000000
                or transaction_data.get("nonce", 0) == 0  # Very high gas
            )  # Zero nonce
        return False

    def _calculate_signature_confidence(
        self, is_valid_format: bool, is_reused: bool, attack_indicators: list[str]
    ) -> float:
        """Calculate confidence score for signature validity"""
        confidence = 1.0

        if not is_valid_format:
            confidence -= 0.5

        if is_reused:
            confidence -= 0.3

        if attack_indicators:
            confidence -= len(attack_indicators) * 0.1

        return max(0.0, min(1.0, confidence))

    async def detect_attacks(
        self, transaction_data: dict[str, Any], signature_analysis: SignatureAnalysis
    ) -> list[AttackDetection]:
        """Detect potential attacks based on transaction and signature analysis"""
        detections = []

        # Check each detection rule
        for rule in self.detection_rules:
            if await self._evaluate_rule(rule, transaction_data, signature_analysis):
                detection = self._create_detection(rule, transaction_data, signature_analysis)
                detections.append(detection)

        # Store detections
        self.attack_detections.extend(detections)

        return detections

    async def _evaluate_rule(
        self,
        rule: dict[str, Any],
        transaction_data: dict[str, Any],
        signature_analysis: SignatureAnalysis,
    ) -> bool:
        """Evaluate a detection rule against transaction and signature data"""
        rule_type = rule["type"]

        if rule_type == "signature":
            return await self._evaluate_signature_rule(rule, signature_analysis)
        if rule_type == "transaction":
            return await self._evaluate_transaction_rule(rule, transaction_data)
        if rule_type == "economic":
            return await self._evaluate_economic_rule(rule, transaction_data)
        if rule_type == "behavioral":
            return await self._evaluate_behavioral_rule(rule, transaction_data)

        return False

    async def _evaluate_signature_rule(
        self, rule: dict[str, Any], signature_analysis: SignatureAnalysis
    ) -> bool:
        """Evaluate signature-based detection rules"""
        if rule["rule_id"] == "signature_reuse":
            return await self._check_signature_reuse(signature_analysis.signature)
        if rule["rule_id"] == "invalid_signature_format":
            return not signature_analysis.is_valid
        if rule["rule_id"] == "signature_validation_bypass":
            return signature_analysis.confidence_score < 0.3

        return False

    async def _evaluate_transaction_rule(
        self, rule: dict[str, Any], transaction_data: dict[str, Any]
    ) -> bool:
        """Evaluate transaction-based detection rules"""
        if rule["rule_id"] == "large_withdrawal":
            amount = transaction_data.get("amount", 0)
            return amount > rule["threshold"]
        if rule["rule_id"] == "rapid_transactions":
            # Check transaction frequency in time window
            return await self._check_transaction_frequency(rule["threshold"], rule["time_window"])
        if rule["rule_id"] == "unusual_mint_pattern":
            # Check minting frequency
            return await self._check_mint_frequency(rule["threshold"], rule["time_window"])

        return False

    async def _evaluate_economic_rule(
        self, rule: dict[str, Any], transaction_data: dict[str, Any]
    ) -> bool:
        """Evaluate economic-based detection rules"""
        if rule["rule_id"] == "price_manipulation":
            price_impact = transaction_data.get("price_impact", 0)
            return price_impact > rule["threshold"]
        if rule["rule_id"] == "volume_spike":
            volume_increase = transaction_data.get("volume_increase", 0)
            return volume_increase > rule["threshold"]

        return False

    async def _evaluate_behavioral_rule(
        self, rule: dict[str, Any], transaction_data: dict[str, Any]
    ) -> bool:
        """Evaluate behavioral-based detection rules"""
        if rule["rule_id"] == "coordinated_behavior":
            # Check for coordinated validator behavior
            return await self._check_coordinated_behavior(rule["threshold"], rule["time_window"])
        if rule["rule_id"] == "unusual_timing":
            # Check for unusual transaction timing
            return await self._check_unusual_timing(rule["threshold"], rule["time_window"])

        return False

    async def _check_transaction_frequency(self, threshold: int, time_window: int) -> bool:
        """Check if transaction frequency exceeds threshold"""
        cutoff_time = datetime.utcnow() - timedelta(seconds=time_window)

        # Count transactions in time window
        count = 0
        for tx_list in self.transaction_history.values():
            count += len(
                [tx for tx in tx_list if datetime.fromisoformat(tx["timestamp"]) > cutoff_time]
            )

        return count > threshold

    async def _check_mint_frequency(self, threshold: int, time_window: int) -> bool:
        """Check if minting frequency exceeds threshold"""
        cutoff_time = datetime.utcnow() - timedelta(seconds=time_window)

        # Count mint transactions in time window
        count = 0
        for tx_list in self.transaction_history.values():
            count += len(
                [
                    tx
                    for tx in tx_list
                    if (
                        tx.get("type") == "mint"
                        and datetime.fromisoformat(tx["timestamp"]) > cutoff_time
                    )
                ]
            )

        return count > threshold

    async def _check_coordinated_behavior(self, threshold: float, time_window: int) -> bool:
        """Check for coordinated validator behavior"""
        # This would analyze validator behavior patterns
        # For now, return a mock result
        return False

    async def _check_unusual_timing(self, threshold: float, time_window: int) -> bool:
        """Check for unusual transaction timing patterns"""
        # This would analyze timing patterns
        # For now, return a mock result
        return False

    def _create_detection(
        self,
        rule: dict[str, Any],
        transaction_data: dict[str, Any],
        signature_analysis: SignatureAnalysis,
    ) -> AttackDetection:
        """Create an attack detection result"""
        detection_id = f"{rule['rule_id']}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        # Determine threat level based on rule action
        action_to_threat = {
            "critical_alert": ThreatLevel.CRITICAL,
            "block": ThreatLevel.HIGH,
            "alert": ThreatLevel.MEDIUM,
            "investigate": ThreatLevel.MEDIUM,
            "monitor": ThreatLevel.LOW,
        }

        threat_level = action_to_threat.get(rule["action"], ThreatLevel.LOW)

        # Determine attack type based on rule
        rule_to_attack = {
            "signature_reuse": AttackType.SIGNATURE_FORGERY,
            "invalid_signature_format": AttackType.SIGNATURE_FORGERY,
            "signature_validation_bypass": AttackType.SIGNATURE_FORGERY,
            "large_withdrawal": AttackType.ECONOMIC_ATTACK,
            "rapid_transactions": AttackType.REPLAY_ATTACK,
            "unusual_mint_pattern": AttackType.ECONOMIC_ATTACK,
            "price_manipulation": AttackType.ECONOMIC_ATTACK,
            "volume_spike": AttackType.ECONOMIC_ATTACK,
            "coordinated_behavior": AttackType.VALIDATOR_COMPROMISE,
            "unusual_timing": AttackType.TIME_DELAY_ATTACK,
        }

        attack_type = rule_to_attack.get(rule["rule_id"], AttackType.UNKNOWN)

        return AttackDetection(
            detection_id=detection_id,
            attack_type=attack_type,
            threat_level=threat_level,
            confidence=signature_analysis.confidence_score,
            description=f"{rule['description']} detected",
            detected_at=datetime.utcnow(),
            evidence={
                "rule_id": rule["rule_id"],
                "rule_type": rule["type"],
                "threshold": rule["threshold"],
                "transaction_data": transaction_data,
                "signature_analysis": {
                    "is_valid": signature_analysis.is_valid,
                    "is_forged": signature_analysis.is_forged,
                    "confidence_score": signature_analysis.confidence_score,
                    "anomalies": signature_analysis.anomalies,
                },
            },
            affected_components=["bridge", "validator", "signature_verification"],
            recommended_actions=self._get_recommended_actions(rule, attack_type),
            mitigation_priority=self._get_mitigation_priority(threat_level),
        )

    def _get_recommended_actions(self, rule: dict[str, Any], attack_type: AttackType) -> list[str]:
        """Get recommended actions based on rule and attack type"""
        actions = []

        if rule["action"] == "critical_alert":
            actions.extend(
                [
                    "Immediately pause bridge operations",
                    "Notify security team",
                    "Investigate validator behavior",
                    "Review recent transactions",
                ]
            )
        elif rule["action"] == "block":
            actions.extend(
                [
                    "Block suspicious transaction",
                    "Increase monitoring",
                    "Review transaction patterns",
                ]
            )
        elif rule["action"] == "alert":
            actions.extend(
                ["Increase monitoring", "Review transaction details", "Check for patterns"]
            )

        # Add attack-specific actions
        if attack_type == AttackType.SIGNATURE_FORGERY:
            actions.extend(
                ["Verify signature validity", "Check for signature reuse", "Review validator keys"]
            )
        elif attack_type == AttackType.ECONOMIC_ATTACK:
            actions.extend(
                [
                    "Monitor economic indicators",
                    "Check for price manipulation",
                    "Review liquidity levels",
                ]
            )

        return actions

    def _get_mitigation_priority(self, threat_level: ThreatLevel) -> int:
        """Get mitigation priority based on threat level"""
        priority_map = {
            ThreatLevel.CRITICAL: 1,
            ThreatLevel.HIGH: 2,
            ThreatLevel.MEDIUM: 3,
            ThreatLevel.LOW: 4,
            ThreatLevel.INFO: 5,
        }
        return priority_map.get(threat_level, 5)

    async def get_attack_statistics(self, hours: int = 24) -> dict[str, Any]:
        """Get attack detection statistics"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        recent_detections = [d for d in self.attack_detections if d.detected_at > cutoff_time]

        # Count by attack type
        attack_type_counts = defaultdict(int)
        threat_level_counts = defaultdict(int)

        for detection in recent_detections:
            attack_type_counts[detection.attack_type.value] += 1
            threat_level_counts[detection.threat_level.value] += 1

        return {
            "total_detections": len(recent_detections),
            "attack_type_breakdown": dict(attack_type_counts),
            "threat_level_breakdown": dict(threat_level_counts),
            "critical_detections": len(
                [d for d in recent_detections if d.threat_level == ThreatLevel.CRITICAL]
            ),
            "high_detections": len(
                [d for d in recent_detections if d.threat_level == ThreatLevel.HIGH]
            ),
            "average_confidence": (
                statistics.mean([d.confidence for d in recent_detections])
                if recent_detections
                else 0
            ),
            "most_common_attack": (
                max(attack_type_counts.items(), key=lambda x: x[1])[0]
                if attack_type_counts
                else None
            ),
        }

    async def get_detection_history(self, hours: int = 24) -> list[dict[str, Any]]:
        """Get detection history for specified time period"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        recent_detections = [d for d in self.attack_detections if d.detected_at > cutoff_time]

        return [
            {
                "detection_id": d.detection_id,
                "attack_type": d.attack_type.value,
                "threat_level": d.threat_level.value,
                "confidence": d.confidence,
                "description": d.description,
                "detected_at": d.detected_at.isoformat(),
                "affected_components": d.affected_components,
                "recommended_actions": d.recommended_actions,
                "mitigation_priority": d.mitigation_priority,
            }
            for d in sorted(recent_detections, key=lambda x: x.detected_at, reverse=True)
        ]
