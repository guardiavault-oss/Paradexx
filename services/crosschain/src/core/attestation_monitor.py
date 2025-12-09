#!/usr/bin/env python3
"""
Attestation Monitor - Real-time monitoring of bridge attestations and anomalies
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

from .blockchain_integration import BlockchainIntegration
from .cryptographic_validation import CryptographicValidator, ValidationResult
from .ml_anomaly_detection import AnomalyType, MLAnomalyDetector, ModelType

logger = logging.getLogger(__name__)


class AttestationStatus(str, Enum):
    """Attestation status types"""

    VALID = "valid"
    INVALID = "invalid"
    PENDING = "pending"
    EXPIRED = "expired"
    ANOMALOUS = "anomalous"


class AnomalyType(str, Enum):
    """Types of attestation anomalies"""

    TIMING_ANOMALY = "timing_anomaly"
    SIGNATURE_MISMATCH = "signature_mismatch"
    QUORUM_SKEW = "quorum_skew"
    DUPLICATE_ATTESTATION = "duplicate_attestation"
    UNUSUAL_PATTERN = "unusual_pattern"
    VALIDATOR_OFFLINE = "validator_offline"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"


@dataclass
class Attestation:
    """Attestation data structure"""

    id: str
    bridge_address: str
    source_network: str
    target_network: str
    transaction_hash: str
    block_number: int
    timestamp: datetime
    validator_address: str
    signature: str
    message_hash: str
    status: AttestationStatus
    confidence_score: float
    metadata: dict[str, Any]


@dataclass
class AttestationAnomaly:
    """Attestation anomaly detection result"""

    anomaly_id: str
    attestation_id: str
    anomaly_type: AnomalyType
    severity: str  # critical, high, medium, low
    description: str
    detected_at: datetime
    confidence: float
    evidence: dict[str, Any]
    recommended_action: str


class AttestationMonitor:
    """Real-time attestation monitoring and anomaly detection with real blockchain integration"""

    def __init__(self, blockchain_integration: BlockchainIntegration = None):
        self.blockchain = blockchain_integration
        self.crypto_validator = CryptographicValidator()
        self.ml_detector = MLAnomalyDetector()

        self.attestations: dict[str, Attestation] = {}
        self.anomalies: list[AttestationAnomaly] = []
        self.validator_stats: dict[str, dict[str, Any]] = defaultdict(dict)
        self.bridge_stats: dict[str, dict[str, Any]] = defaultdict(dict)
        self.timing_patterns: dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.signature_cache: dict[str, list[str]] = defaultdict(list)
        self.quorum_history: dict[str, list[dict[str, Any]]] = defaultdict(list)

        # Real-time monitoring
        self.is_monitoring = False
        self.monitoring_tasks: list[asyncio.Task] = []
        self.event_handlers: dict[str, list[callable]] = defaultdict(list)

        # Configuration
        self.anomaly_thresholds = {
            "timing_deviation": 2.0,  # standard deviations
            "quorum_threshold": 0.67,  # 67% of validators
            "duplicate_window": 300,  # 5 minutes
            "rate_limit": 100,  # attestations per minute
            "confidence_threshold": 0.8,
        }

        # Bridge contract addresses to monitor
        self.bridge_contracts: dict[str, list[str]] = defaultdict(list)

        logger.info("AttestationMonitor initialized with real blockchain integration")

    async def process_attestation(
        self, attestation_data: dict[str, Any]
    ) -> tuple[Attestation, list[AttestationAnomaly]]:
        """Process a new attestation with real blockchain validation and ML anomaly detection"""
        logger.info(f"Processing attestation {attestation_data.get('id', 'unknown')}")

        # Create attestation object
        attestation = self._create_attestation(attestation_data)

        # Real blockchain validation
        validation_result = await self._validate_attestation_blockchain(attestation)
        if validation_result.result != ValidationResult.VALID:
            attestation.status = AttestationStatus.INVALID
            attestation.confidence_score = 0.0

        # Store attestation
        self.attestations[attestation.id] = attestation

        # Update statistics
        await self._update_validator_stats(attestation)
        await self._update_bridge_stats(attestation)

        # ML-based anomaly detection
        ml_anomalies = await self._detect_ml_anomalies(attestation)

        # Traditional rule-based anomaly detection
        rule_anomalies = await self._detect_rule_based_anomalies(attestation)

        # Combine all anomalies
        all_anomalies = ml_anomalies + rule_anomalies

        # Store anomalies
        self.anomalies.extend(all_anomalies)

        # Trigger event handlers
        await self._trigger_event_handlers(
            "attestation_processed",
            {
                "attestation": attestation,
                "anomalies": all_anomalies,
                "validation_result": validation_result,
            },
        )

        return attestation, all_anomalies

    def _create_attestation(self, data: dict[str, Any]) -> Attestation:
        """Create attestation object from raw data"""
        return Attestation(
            id=data.get(
                "id", hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
            ),
            bridge_address=data["bridge_address"],
            source_network=data["source_network"],
            target_network=data["target_network"],
            transaction_hash=data["transaction_hash"],
            block_number=data["block_number"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            validator_address=data["validator_address"],
            signature=data["signature"],
            message_hash=data["message_hash"],
            status=AttestationStatus(data.get("status", "pending")),
            confidence_score=data.get("confidence_score", 1.0),
            metadata=data.get("metadata", {}),
        )

    async def _update_validator_stats(self, attestation: Attestation):
        """Update validator statistics"""
        validator = attestation.validator_address
        bridge_key = f"{attestation.bridge_address}:{attestation.source_network}:{attestation.target_network}"

        if validator not in self.validator_stats:
            self.validator_stats[validator] = {
                "total_attestations": 0,
                "valid_attestations": 0,
                "invalid_attestations": 0,
                "anomalous_attestations": 0,
                "last_seen": None,
                "response_times": deque(maxlen=100),
                "bridges": set(),
            }

        stats = self.validator_stats[validator]
        stats["total_attestations"] += 1
        stats["last_seen"] = attestation.timestamp
        stats["bridges"].add(bridge_key)

        if attestation.status == AttestationStatus.VALID:
            stats["valid_attestations"] += 1
        elif attestation.status == AttestationStatus.INVALID:
            stats["invalid_attestations"] += 1
        elif attestation.status == AttestationStatus.ANOMALOUS:
            stats["anomalous_attestations"] += 1

    async def _update_bridge_stats(self, attestation: Attestation):
        """Update bridge statistics"""
        bridge_key = f"{attestation.bridge_address}:{attestation.source_network}:{attestation.target_network}"

        if bridge_key not in self.bridge_stats:
            self.bridge_stats[bridge_key] = {
                "total_attestations": 0,
                "validators": set(),
                "attestation_times": deque(maxlen=1000),
                "quorum_history": deque(maxlen=100),
                "last_attestation": None,
            }

        stats = self.bridge_stats[bridge_key]
        stats["total_attestations"] += 1
        stats["validators"].add(attestation.validator_address)
        stats["attestation_times"].append(attestation.timestamp)
        stats["last_attestation"] = attestation.timestamp

    async def _detect_anomalies(self, attestation: Attestation) -> list[AttestationAnomaly]:
        """Detect various types of anomalies in the attestation"""
        anomalies = []

        # Check for timing anomalies
        timing_anomaly = await self._check_timing_anomaly(attestation)
        if timing_anomaly:
            anomalies.append(timing_anomaly)

        # Check for signature mismatches
        signature_anomaly = await self._check_signature_anomaly(attestation)
        if signature_anomaly:
            anomalies.append(signature_anomaly)

        # Check for quorum skew
        quorum_anomaly = await self._check_quorum_anomaly(attestation)
        if quorum_anomaly:
            anomalies.append(quorum_anomaly)

        # Check for duplicate attestations
        duplicate_anomaly = await self._check_duplicate_attestation(attestation)
        if duplicate_anomaly:
            anomalies.append(duplicate_anomaly)

        # Check for unusual patterns
        pattern_anomaly = await self._check_unusual_pattern(attestation)
        if pattern_anomaly:
            anomalies.append(pattern_anomaly)

        return anomalies

    async def _check_timing_anomaly(self, attestation: Attestation) -> AttestationAnomaly | None:
        """Check for timing anomalies in attestation patterns"""
        bridge_key = f"{attestation.bridge_address}:{attestation.source_network}:{attestation.target_network}"

        if bridge_key not in self.bridge_stats:
            return None

        times = list(self.bridge_stats[bridge_key]["attestation_times"])
        if len(times) < 10:  # Need sufficient history
            return None

        # Calculate time differences
        time_diffs = []
        for i in range(1, len(times)):
            diff = (times[i] - times[i - 1]).total_seconds()
            time_diffs.append(diff)

        if not time_diffs:
            return None

        # Calculate statistics
        mean_diff = sum(time_diffs) / len(time_diffs)
        variance = sum((x - mean_diff) ** 2 for x in time_diffs) / len(time_diffs)
        std_dev = variance**0.5

        # Check if current timing is anomalous
        current_time = attestation.timestamp
        if len(times) > 0:
            last_time = times[-1]
            current_diff = (current_time - last_time).total_seconds()

            if std_dev > 0:
                z_score = abs(current_diff - mean_diff) / std_dev
                if z_score > self.anomaly_thresholds["timing_deviation"]:
                    return AttestationAnomaly(
                        anomaly_id=f"timing_{attestation.id}",
                        attestation_id=attestation.id,
                        anomaly_type=AnomalyType.TIMING_ANOMALY,
                        severity="medium" if z_score < 3 else "high",
                        description=f"Unusual timing pattern detected (z-score: {z_score:.2f})",
                        detected_at=datetime.utcnow(),
                        confidence=min(z_score / 3.0, 1.0),
                        evidence={
                            "z_score": z_score,
                            "mean_interval": mean_diff,
                            "std_deviation": std_dev,
                            "current_interval": current_diff,
                        },
                        recommended_action="Investigate validator performance and network conditions",
                    )

        return None

    async def _check_signature_anomaly(self, attestation: Attestation) -> AttestationAnomaly | None:
        """Check for signature mismatches or forgeries"""
        # Check for duplicate signatures
        if attestation.signature in self.signature_cache[attestation.bridge_address]:
            return AttestationAnomaly(
                anomaly_id=f"signature_dup_{attestation.id}",
                attestation_id=attestation.id,
                anomaly_type=AnomalyType.SIGNATURE_MISMATCH,
                severity="high",
                description="Duplicate signature detected",
                detected_at=datetime.utcnow(),
                confidence=0.95,
                evidence={
                    "duplicate_signature": attestation.signature,
                    "previous_attestations": self.signature_cache[attestation.bridge_address],
                },
                recommended_action="Immediately investigate potential signature reuse attack",
            )

        # Add signature to cache
        self.signature_cache[attestation.bridge_address].append(attestation.signature)

        # Check signature format and validity (simplified)
        if not self._validate_signature_format(attestation.signature):
            return AttestationAnomaly(
                anomaly_id=f"signature_format_{attestation.id}",
                attestation_id=attestation.id,
                anomaly_type=AnomalyType.SIGNATURE_MISMATCH,
                severity="critical",
                description="Invalid signature format detected",
                detected_at=datetime.utcnow(),
                confidence=0.9,
                evidence={
                    "signature": attestation.signature,
                    "validator": attestation.validator_address,
                },
                recommended_action="Block attestation and investigate validator compromise",
            )

        return None

    async def _check_quorum_anomaly(self, attestation: Attestation) -> AttestationAnomaly | None:
        """Check for quorum skew and validator behavior anomalies"""
        bridge_key = f"{attestation.bridge_address}:{attestation.source_network}:{attestation.target_network}"

        # Get recent attestations for this bridge
        recent_attestations = [
            att
            for att in self.attestations.values()
            if (
                att.bridge_address == attestation.bridge_address
                and att.source_network == attestation.source_network
                and att.target_network == attestation.target_network
                and att.timestamp > attestation.timestamp - timedelta(minutes=10)
            )
        ]

        if len(recent_attestations) < 5:  # Need sufficient data
            return None

        # Analyze validator distribution
        validator_counts = defaultdict(int)
        for att in recent_attestations:
            validator_counts[att.validator_address] += 1

        total_attestations = len(recent_attestations)
        expected_per_validator = total_attestations / len(validator_counts)

        # Check for skewed distribution
        max_count = max(validator_counts.values())
        skew_ratio = max_count / expected_per_validator if expected_per_validator > 0 else 0

        if skew_ratio > 2.0:  # One validator has more than 2x expected attestations
            return AttestationAnomaly(
                anomaly_id=f"quorum_skew_{attestation.id}",
                attestation_id=attestation.id,
                anomaly_type=AnomalyType.QUORUM_SKEW,
                severity="medium" if skew_ratio < 3 else "high",
                description=f"Quorum skew detected (ratio: {skew_ratio:.2f})",
                detected_at=datetime.utcnow(),
                confidence=min(skew_ratio / 3.0, 1.0),
                evidence={
                    "skew_ratio": skew_ratio,
                    "validator_distribution": dict(validator_counts),
                    "expected_per_validator": expected_per_validator,
                },
                recommended_action="Investigate validator behavior and potential coordination issues",
            )

        return None

    async def _check_duplicate_attestation(
        self, attestation: Attestation
    ) -> AttestationAnomaly | None:
        """Check for duplicate attestations within a time window"""
        bridge_key = f"{attestation.bridge_address}:{attestation.source_network}:{attestation.target_network}"

        # Look for duplicates in the last 5 minutes
        cutoff_time = attestation.timestamp - timedelta(
            seconds=self.anomaly_thresholds["duplicate_window"]
        )

        duplicates = [
            att
            for att in self.attestations.values()
            if (
                att.bridge_address == attestation.bridge_address
                and att.source_network == attestation.source_network
                and att.target_network == attestation.target_network
                and att.transaction_hash == attestation.transaction_hash
                and att.timestamp > cutoff_time
                and att.id != attestation.id
            )
        ]

        if duplicates:
            return AttestationAnomaly(
                anomaly_id=f"duplicate_{attestation.id}",
                attestation_id=attestation.id,
                anomaly_type=AnomalyType.DUPLICATE_ATTESTATION,
                severity="high",
                description=f"Duplicate attestation detected ({len(duplicates)} duplicates)",
                detected_at=datetime.utcnow(),
                confidence=0.9,
                evidence={
                    "duplicate_count": len(duplicates),
                    "duplicate_ids": [d.id for d in duplicates],
                    "transaction_hash": attestation.transaction_hash,
                },
                recommended_action="Investigate potential replay attack or system error",
            )

        return None

    async def _check_unusual_pattern(self, attestation: Attestation) -> AttestationAnomaly | None:
        """Check for unusual patterns in attestation behavior"""
        validator = attestation.validator_address

        if validator not in self.validator_stats:
            return None

        stats = self.validator_stats[validator]

        # Check for rate limiting
        recent_attestations = [
            att
            for att in self.attestations.values()
            if (
                att.validator_address == validator
                and att.timestamp > attestation.timestamp - timedelta(minutes=1)
            )
        ]

        if len(recent_attestations) > self.anomaly_thresholds["rate_limit"]:
            return AttestationAnomaly(
                anomaly_id=f"rate_limit_{attestation.id}",
                attestation_id=attestation.id,
                anomaly_type=AnomalyType.RATE_LIMIT_EXCEEDED,
                severity="medium",
                description=f"Rate limit exceeded ({len(recent_attestations)} attestations in 1 minute)",
                detected_at=datetime.utcnow(),
                confidence=0.8,
                evidence={
                    "attestation_count": len(recent_attestations),
                    "rate_limit": self.anomaly_thresholds["rate_limit"],
                },
                recommended_action="Investigate potential automated attack or system malfunction",
            )

        return None

    def _validate_signature_format(self, signature: str) -> bool:
        """Validate signature format (simplified validation)"""
        # Basic format validation - in production, use proper cryptographic validation
        if not signature or len(signature) < 64:
            return False

        try:
            int(signature, 16)
            return True
        except ValueError:
            return False

    async def get_attestation_metrics(self, bridge_address: str = None) -> dict[str, Any]:
        """Get attestation metrics and statistics"""
        if bridge_address:
            # Filter by bridge
            filtered_attestations = [
                att for att in self.attestations.values() if att.bridge_address == bridge_address
            ]
        else:
            filtered_attestations = list(self.attestations.values())

        total_attestations = len(filtered_attestations)
        valid_attestations = len(
            [att for att in filtered_attestations if att.status == AttestationStatus.VALID]
        )
        anomalous_attestations = len(
            [att for att in filtered_attestations if att.status == AttestationStatus.ANOMALOUS]
        )

        return {
            "total_attestations": total_attestations,
            "valid_attestations": valid_attestations,
            "anomalous_attestations": anomalous_attestations,
            "validity_rate": (
                valid_attestations / total_attestations if total_attestations > 0 else 0
            ),
            "anomaly_rate": (
                anomalous_attestations / total_attestations if total_attestations > 0 else 0
            ),
            "active_validators": len(set(att.validator_address for att in filtered_attestations)),
            "recent_anomalies": len(
                [
                    a
                    for a in self.anomalies
                    if a.detected_at > datetime.utcnow() - timedelta(hours=1)
                ]
            ),
        }

    async def get_validator_health(self, validator_address: str) -> dict[str, Any]:
        """Get validator health metrics"""
        if validator_address not in self.validator_stats:
            return {"status": "unknown", "message": "Validator not found"}

        stats = self.validator_stats[validator_address]

        # Calculate health score
        total = stats["total_attestations"]
        if total == 0:
            health_score = 0
        else:
            validity_rate = stats["valid_attestations"] / total
            anomaly_rate = stats["anomalous_attestations"] / total
            health_score = (validity_rate - anomaly_rate) * 100

        # Determine status
        if health_score >= 90:
            status = "excellent"
        elif health_score >= 75:
            status = "good"
        elif health_score >= 50:
            status = "fair"
        else:
            status = "poor"

        return {
            "validator_address": validator_address,
            "health_score": health_score,
            "status": status,
            "total_attestations": total,
            "valid_attestations": stats["valid_attestations"],
            "invalid_attestations": stats["invalid_attestations"],
            "anomalous_attestations": stats["anomalous_attestations"],
            "last_seen": stats["last_seen"].isoformat() if stats["last_seen"] else None,
            "bridges_used": list(stats["bridges"]),
        }

    async def get_recent_anomalies(self, hours: int = 24) -> list[dict[str, Any]]:
        """Get recent anomalies within specified time window"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        recent_anomalies = [
            {
                "anomaly_id": a.anomaly_id,
                "attestation_id": a.attestation_id,
                "anomaly_type": a.anomaly_type.value,
                "severity": a.severity,
                "description": a.description,
                "detected_at": a.detected_at.isoformat(),
                "confidence": a.confidence,
                "evidence": a.evidence,
                "recommended_action": a.recommended_action,
            }
            for a in self.anomalies
            if a.detected_at > cutoff_time
        ]

        return sorted(recent_anomalies, key=lambda x: x["detected_at"], reverse=True)

    async def _validate_attestation_blockchain(self, attestation: Attestation) -> ValidationResult:
        """Validate attestation using real blockchain data"""
        try:
            if not self.blockchain:
                logger.warning("No blockchain integration available for validation")
                return ValidationResult.INVALID

            # Get transaction from blockchain
            tx_data = await self.blockchain.get_transaction(
                attestation.source_network, attestation.transaction_hash
            )

            if not tx_data:
                logger.warning(
                    f"Transaction {attestation.transaction_hash} not found on {attestation.source_network}"
                )
                return ValidationResult.INVALID

            # Verify transaction details
            if (
                tx_data.from_address.lower() != attestation.validator_address.lower()
                or tx_data.block_number != attestation.block_number
            ):
                logger.warning("Transaction details mismatch")
                return ValidationResult.INVALID

            # Verify signature using cryptographic validation
            message_hash = attestation.message_hash
            signature = attestation.signature
            expected_address = attestation.validator_address

            validation_result = await self.crypto_validator.validate_signature(
                message_hash, signature, expected_address
            )

            return validation_result.result

        except Exception as e:
            logger.error(f"Error validating attestation on blockchain: {e}")
            return ValidationResult.INVALID

    async def _detect_ml_anomalies(self, attestation: Attestation) -> list[AttestationAnomaly]:
        """Detect anomalies using ML models"""
        try:
            # Prepare data for ML analysis
            ml_data = {
                "timestamp": attestation.timestamp.isoformat(),
                "value": 0,  # Placeholder - would be extracted from transaction
                "gas_price": 0,  # Placeholder
                "gas_used": 0,  # Placeholder
                "nonce": 0,  # Placeholder
                "block_time": 0,  # Placeholder
                "block_size": 0,  # Placeholder
                "transaction_count": 0,  # Placeholder
                "frequency": 1,  # Placeholder
                "amount_variance": 0,  # Placeholder
                "time_variance": 0,  # Placeholder
                "validator_address": attestation.validator_address,
                "bridge_address": attestation.bridge_address,
                "confidence_score": attestation.confidence_score,
            }

            # Detect anomalies using ML
            ml_detections = await self.ml_detector.detect_anomaly(ml_data)

            # Convert ML detections to attestation anomalies
            anomalies = []
            for detection in ml_detections:
                anomaly = AttestationAnomaly(
                    anomaly_id=f"ml_{detection.anomaly_id}",
                    attestation_id=attestation.id,
                    anomaly_type=AnomalyType.ML_ANOMALY,
                    severity=detection.severity,
                    description=f"ML detected anomaly: {detection.explanation}",
                    detected_at=detection.timestamp,
                    confidence=detection.confidence,
                    evidence=detection.metadata,
                    recommended_action=(
                        detection.recommendations[0]
                        if detection.recommendations
                        else "Review ML anomaly"
                    ),
                )
                anomalies.append(anomaly)

            return anomalies

        except Exception as e:
            logger.error(f"Error in ML anomaly detection: {e}")
            return []

    async def _detect_rule_based_anomalies(
        self, attestation: Attestation
    ) -> list[AttestationAnomaly]:
        """Detect anomalies using traditional rule-based methods"""
        anomalies = []

        # Check for timing anomalies
        timing_anomaly = await self._check_timing_anomaly(attestation)
        if timing_anomaly:
            anomalies.append(timing_anomaly)

        # Check for signature mismatches
        signature_anomaly = await self._check_signature_anomaly(attestation)
        if signature_anomaly:
            anomalies.append(signature_anomaly)

        # Check for quorum skew
        quorum_anomaly = await self._check_quorum_anomaly(attestation)
        if quorum_anomaly:
            anomalies.append(quorum_anomaly)

        # Check for duplicate attestations
        duplicate_anomaly = await self._check_duplicate_attestation(attestation)
        if duplicate_anomaly:
            anomalies.append(duplicate_anomaly)

        # Check for unusual patterns
        pattern_anomaly = await self._check_unusual_pattern(attestation)
        if pattern_anomaly:
            anomalies.append(pattern_anomaly)

        return anomalies

    async def start_monitoring(self):
        """Start real-time attestation monitoring"""
        if self.is_monitoring:
            logger.warning("Attestation monitoring already started")
            return

        logger.info("Starting real-time attestation monitoring")
        self.is_monitoring = True

        # Start monitoring tasks
        self.monitoring_tasks = [
            asyncio.create_task(self._monitor_blockchain_events()),
            asyncio.create_task(self._monitor_validator_behavior()),
            asyncio.create_task(self._update_ml_models()),
            asyncio.create_task(self._cleanup_old_data()),
        ]

        logger.info("Attestation monitoring started")

    async def stop_monitoring(self):
        """Stop attestation monitoring"""
        logger.info("Stopping attestation monitoring")
        self.is_monitoring = False

        # Cancel monitoring tasks
        for task in self.monitoring_tasks:
            task.cancel()

        self.monitoring_tasks.clear()
        logger.info("Attestation monitoring stopped")

    async def _monitor_blockchain_events(self):
        """Monitor blockchain events for attestations"""
        while self.is_monitoring:
            try:
                if not self.blockchain:
                    await asyncio.sleep(10)
                    continue

                # Monitor each network for bridge events
                for network in self.blockchain.get_supported_networks():
                    await self._monitor_network_events(network)

                await asyncio.sleep(5)  # Check every 5 seconds

            except Exception as e:
                logger.error(f"Error monitoring blockchain events: {e}")
                await asyncio.sleep(10)

    async def _monitor_network_events(self, network: str):
        """Monitor events for a specific network"""
        try:
            # Get latest block
            latest_block = await self.blockchain.get_latest_block(network)
            if not latest_block:
                return

            # Check for bridge contract events
            for bridge_address in self.bridge_contracts[network]:
                # Get recent events (simplified - in production, use proper event filtering)
                events = await self.blockchain.get_contract_events(
                    network, bridge_address, latest_block.number - 10, latest_block.number
                )

                for event in events:
                    await self._process_bridge_event(network, event)

        except Exception as e:
            logger.error(f"Error monitoring {network} events: {e}")

    async def _process_bridge_event(self, network: str, event):
        """Process a bridge contract event"""
        try:
            # Extract attestation data from event
            attestation_data = {
                "bridge_address": event.address,
                "source_network": network,
                "target_network": "unknown",  # Would be extracted from event data
                "transaction_hash": event.transaction_hash,
                "block_number": event.block_number,
                "validator_address": "unknown",  # Would be extracted from event data
                "signature": "unknown",  # Would be extracted from event data
                "message_hash": "unknown",  # Would be extracted from event data
                "confidence_score": 1.0,
                "metadata": event.decoded_data,
            }

            # Process the attestation
            await self.process_attestation(attestation_data)

        except Exception as e:
            logger.error(f"Error processing bridge event: {e}")

    async def _monitor_validator_behavior(self):
        """Monitor validator behavior patterns"""
        while self.is_monitoring:
            try:
                # Analyze validator behavior patterns
                for validator_address, stats in self.validator_stats.items():
                    await self._analyze_validator_behavior(validator_address, stats)

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error(f"Error monitoring validator behavior: {e}")
                await asyncio.sleep(30)

    async def _analyze_validator_behavior(self, validator_address: str, stats: dict[str, Any]):
        """Analyze individual validator behavior"""
        try:
            # Check for unusual patterns
            if stats.get("consecutive_failures", 0) > 5:
                # Create anomaly for consecutive failures
                anomaly = AttestationAnomaly(
                    anomaly_id=f"validator_behavior_{validator_address}_{int(time.time())}",
                    attestation_id="",
                    anomaly_type=AnomalyType.VALIDATOR_OFFLINE,
                    severity="high",
                    description=f"Validator {validator_address} has {stats['consecutive_failures']} consecutive failures",
                    detected_at=datetime.utcnow(),
                    confidence=0.9,
                    evidence=stats,
                    recommended_action="Investigate validator performance and connectivity",
                )
                self.anomalies.append(anomaly)

        except Exception as e:
            logger.error(f"Error analyzing validator behavior: {e}")

    async def _update_ml_models(self):
        """Update ML models with new data"""
        while self.is_monitoring:
            try:
                # Prepare training data from recent attestations
                training_data = []
                labels = []

                for attestation in list(self.attestations.values())[
                    -1000:
                ]:  # Last 1000 attestations
                    data = {
                        "timestamp": attestation.timestamp.isoformat(),
                        "validator_address": attestation.validator_address,
                        "bridge_address": attestation.bridge_address,
                        "confidence_score": attestation.confidence_score,
                        "status": attestation.status.value,
                    }
                    training_data.append(data)

                    # Label: 1 for anomaly, 0 for normal
                    is_anomaly = any(a.attestation_id == attestation.id for a in self.anomalies)
                    labels.append(1 if is_anomaly else 0)

                if len(training_data) > 100:  # Minimum training data
                    # Update ML models
                    await self.ml_detector.update_model(
                        ModelType.ISOLATION_FOREST, training_data, labels
                    )

                await asyncio.sleep(3600)  # Update every hour

            except Exception as e:
                logger.error(f"Error updating ML models: {e}")
                await asyncio.sleep(1800)

    async def _cleanup_old_data(self):
        """Clean up old data to prevent memory issues"""
        while self.is_monitoring:
            try:
                cutoff_time = datetime.utcnow() - timedelta(hours=24)

                # Clean old attestations
                old_attestations = [
                    aid for aid, att in self.attestations.items() if att.timestamp < cutoff_time
                ]
                for aid in old_attestations:
                    del self.attestations[aid]

                # Clean old anomalies
                self.anomalies = [a for a in self.anomalies if a.detected_at > cutoff_time]

                # Clean old timing patterns
                for bridge_key in self.timing_patterns:
                    self.timing_patterns[bridge_key] = deque(
                        [t for t in self.timing_patterns[bridge_key] if t > cutoff_time],
                        maxlen=1000,
                    )

                logger.info(f"Cleaned up {len(old_attestations)} old attestations")
                await asyncio.sleep(3600)  # Clean up every hour

            except Exception as e:
                logger.error(f"Error cleaning up old data: {e}")
                await asyncio.sleep(1800)

    def register_event_handler(self, event_type: str, handler: callable):
        """Register event handler"""
        self.event_handlers[event_type].append(handler)
        logger.info(f"Registered handler for {event_type}")

    async def _trigger_event_handlers(self, event_type: str, data: dict[str, Any]):
        """Trigger event handlers"""
        handlers = self.event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
            except Exception as e:
                logger.error(f"Error in event handler: {e}")

    def add_bridge_contract(self, network: str, contract_address: str):
        """Add bridge contract to monitor"""
        self.bridge_contracts[network].append(contract_address)
        logger.info(f"Added bridge contract {contract_address} on {network}")

    def remove_bridge_contract(self, network: str, contract_address: str):
        """Remove bridge contract from monitoring"""
        if contract_address in self.bridge_contracts[network]:
            self.bridge_contracts[network].remove(contract_address)
            logger.info(f"Removed bridge contract {contract_address} from {network}")

    async def get_real_time_metrics(self) -> dict[str, Any]:
        """Get real-time monitoring metrics"""
        return {
            "is_monitoring": self.is_monitoring,
            "total_attestations": len(self.attestations),
            "total_anomalies": len(self.anomalies),
            "active_validators": len(self.validator_stats),
            "monitored_bridges": sum(
                len(contracts) for contracts in self.bridge_contracts.values()
            ),
            "ml_anomaly_stats": self.ml_detector.get_anomaly_statistics(),
            "crypto_validation_stats": self.crypto_validator.get_validation_statistics(),
            "recent_anomalies": [
                {
                    "anomaly_id": a.anomaly_id,
                    "anomaly_type": a.anomaly_type.value,
                    "severity": a.severity,
                    "detected_at": a.detected_at.isoformat(),
                    "confidence": a.confidence,
                }
                for a in list(self.anomalies)[-10:]  # Last 10 anomalies
            ],
        }
