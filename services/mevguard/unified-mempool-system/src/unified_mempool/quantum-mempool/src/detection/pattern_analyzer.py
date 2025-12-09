import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enterprise Pattern Analysis Engine for Quantum Attack Detection

This module implements advanced pattern recognition and behavioral analysis
for detecting quantum computing attacks against blockchain systems.
"""

from collections import deque  # noqa: E402
from dataclasses import dataclass, field  # noqa: E402
from datetime import datetime, timedelta  # noqa: E402
from typing import Any, Dict, List, Optional, Set  # noqa: E402

import numpy as np  # noqa: E402
from common.observability.logging import get_scorpius_logger  # noqa: E402
from sklearn.cluster import DBSCAN  # noqa: E402
from sklearn.ensemble import IsolationForest  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..utils.config import EnterpriseConfig  # noqa: E402
from ..utils.metrics import MetricsCollector  # noqa: E402


@dataclass
class TransactionPattern:
    """Transaction pattern data structure"""

    tx_hash: str
    timestamp: datetime
    input_addresses: List[str]
    output_addresses: List[str]
    value: float
    fee_rate: float
    size: int
    signature_algorithm: str
    confirmation_time: Optional[float] = None
    quantum_score: float = 0.0
    anomaly_score: float = 0.0
    risk_level: str = "LOW"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AttackPattern:
    """Attack pattern detection result"""

    pattern_id: str
    pattern_type: str
    confidence: float
    affected_addresses: Set[str]
    transaction_hashes: List[str]
    first_detected: datetime
    last_detected: datetime
    severity: str
    quantum_indicators: List[str]
    mitigation_recommendations: List[str]


class EnterprisePatternAnalyzer:
    """
    Enterprise-grade pattern analysis engine for quantum attack detection.

    Features:
    - Real-time transaction pattern analysis
    - Machine learning-based anomaly detection
    - Quantum signature analysis
    - Address clustering and risk profiling
    - Behavioral baseline establishment
    - Enterprise audit and compliance integration
    """

    def __init__(
        self,
        config: EnterpriseConfig,
        metrics: MetricsCollector,
        audit_logger: SecurityEventLogger,
    ):
        """Initialize the enterprise pattern analyzer"""
        self.config = config
        self.metrics = metrics
        self.audit_logger = audit_logger
        self.logger = get_scorpius_logger(__name__)

        # Pattern analysis configuration
        self.detection_config = config.get("detection", {})
        self.pattern_config = self.detection_config.get("pattern_analysis", {})

        # Machine learning models
        self.isolation_forest = IsolationForest(
            contamination=self.pattern_config.get("contamination_rate", 0.1),
            random_state=42,
        )
        self.dbscan = DBSCAN(
            eps=self.pattern_config.get("clustering_eps", 0.5),
            min_samples=self.pattern_config.get("min_cluster_samples", 5),
        )
        self.scaler = StandardScaler()

        # Pattern storage and tracking
        self.transaction_patterns: deque = deque(
            maxlen=self.pattern_config.get("max_pattern_history", 10000)
        )
        self.address_profiles: Dict[str, Dict] = {}
        self.attack_patterns: Dict[str, AttackPattern] = {}
        self.baseline_metrics: Dict[str, float] = {}

        # Real-time analysis buffers
        self.analysis_window = timedelta(
            minutes=self.pattern_config.get("analysis_window_minutes", 15)
        )
        self.recent_transactions: deque = deque(maxlen=1000)

        # Quantum signature indicators
        self.quantum_indicators = self._load_quantum_indicators()

        # Initialize models
        self._initialize_models()

    def _load_quantum_indicators(self) -> Dict[str, Any]:
        """Load quantum attack signature indicators"""
        return {
            "signature_patterns": [
                "unusual_r_values",
                "repeated_nonces",
                "weak_k_values",
                "systematic_address_targeting",
                "rapid_key_derivation",
            ],
            "timing_patterns": [
                "synchronized_transactions",
                "burst_activity",
                "predictable_intervals",
            ],
            "value_patterns": [
                "dust_attacks",
                "systematic_sweeping",
                "value_clustering",
            ],
        }

    def _initialize_models(self):
        """Initialize machine learning models with baseline data"""
        try:
            # Load historical data if available
            baseline_data = self._load_baseline_data()
            if baseline_data is not None and len(baseline_data) > 0:
                self.scaler.fit(baseline_data)
                self.isolation_forest.fit(baseline_data)
                self.logger.info("ML models initialized with baseline data")
            else:
                self.logger.warning(
                    "No baseline data available for model initialization"
                )

        except Exception as e:
            self.logger.error(f"Failed to initialize ML models: {e}")
            self.audit_logger.log_security_event(
                event_type="ML_INITIALIZATION_ERROR",
                severity="MEDIUM",
                details={"error": str(e)},
            )

    def _load_baseline_data(self) -> Optional[np.ndarray]:
        """Load historical baseline data for model training"""
        # In production, this would load from a database or data lake
        # For now, return None to indicate no baseline data
        return None

    async def analyze_transaction_pattern(
        self, transaction_data: Dict[str, Any]
    ) -> TransactionPattern:
        """
        Analyze a single transaction for quantum attack patterns

        Args:
            transaction_data: Raw transaction data from mempool

        Returns:
            TransactionPattern: Analyzed pattern with risk scores
        """
        try:
            # Create transaction pattern
            pattern = TransactionPattern(
                tx_hash=transaction_data.get("hash", ""),
                timestamp=datetime.fromisoformat(
                    transaction_data.get("timestamp", datetime.now().isoformat())
                ),
                input_addresses=transaction_data.get("inputs", []),
                output_addresses=transaction_data.get("outputs", []),
                value=float(transaction_data.get("value", 0)),
                fee_rate=float(transaction_data.get("fee_rate", 0)),
                size=int(transaction_data.get("size", 0)),
                signature_algorithm=transaction_data.get(
                    "signature_algorithm", "ECDSA"
                ),
            )

            # Perform pattern analysis
            await self._analyze_quantum_signatures(pattern, transaction_data)
            await self._analyze_timing_patterns(pattern)
            await self._analyze_value_patterns(pattern)
            await self._analyze_address_relationships(pattern)

            # Calculate overall quantum score
            pattern.quantum_score = self._calculate_quantum_score(pattern)

            # Determine risk level
            pattern.risk_level = self._determine_risk_level(pattern.quantum_score)

            # Update tracking
            self.transaction_patterns.append(pattern)
            self.recent_transactions.append(pattern)

            # Update metrics
            self.metrics.increment_counter("patterns_analyzed_total")
            self.metrics.set_gauge("current_quantum_score", pattern.quantum_score)

            # Log high-risk patterns
            if pattern.risk_level in ["HIGH", "CRITICAL"]:
                await self._log_high_risk_pattern(pattern)

            return pattern

        except Exception as e:
            self.logger.error(f"Failed to analyze transaction pattern: {e}")
            self.metrics.increment_counter("pattern_analysis_errors_total")
            raise

    async def _analyze_quantum_signatures(
        self, pattern: TransactionPattern, transaction_data: Dict[str, Any]
    ):
        """Analyze quantum signature indicators"""
        quantum_indicators = []

        # Check for weak signature values
        signature_data = transaction_data.get("signature", {})
        r_value = signature_data.get("r")
        s_value = signature_data.get("s")

        if r_value and s_value:
            # Check for unusual R values (potential quantum weakness)
            if self._is_unusual_r_value(r_value):
                quantum_indicators.append("unusual_r_value")

            # Check for repeated nonces
            if await self._check_repeated_nonces(r_value, pattern.input_addresses):
                quantum_indicators.append("repeated_nonce")

        # Check for systematic address targeting
        if await self._check_systematic_targeting(pattern.input_addresses):
            quantum_indicators.append("systematic_targeting")

        pattern.metadata["quantum_indicators"] = quantum_indicators

    def _is_unusual_r_value(self, r_value: str) -> bool:
        """Check if R value shows quantum weakness indicators"""
        try:
            # Convert to integer for analysis
            r_int = int(r_value, 16)

            # Check for low values (potential weak randomness)
            if r_int < 2**240:  # Suspiciously low for 256-bit curve
                return True

            # Check for high values (near curve order)
            curve_order = (
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
            )
            if r_int > curve_order - 2**240:
                return True

            return False

        except (ValueError, TypeError):
            return False

    async def _check_repeated_nonces(self, r_value: str, addresses: List[str]) -> bool:
        """Check for nonce reuse across transactions"""
        # Look for the same R value in recent transactions from same addresses
        for recent_tx in list(self.recent_transactions)[
            -100:
        ]:  # Check last 100 transactions
            if recent_tx.metadata.get("r_value") == r_value and any(
                addr in recent_tx.input_addresses for addr in addresses
            ):
                return True

        return False

    async def _check_systematic_targeting(self, addresses: List[str]) -> bool:
        """Check for systematic address targeting patterns"""
        # Look for patterns in targeted address types
        legacy_count = sum(1 for addr in addresses if addr.startswith("1"))
        total_count = len(addresses)

        # High concentration of legacy addresses might indicate quantum targeting
        if total_count > 0 and (legacy_count / total_count) > 0.8:
            return True

        return False

    async def _analyze_timing_patterns(self, pattern: TransactionPattern):
        """Analyze timing-based attack patterns"""
        timing_indicators = []

        # Check for synchronized transactions
        recent_window = datetime.now() - timedelta(seconds=30)
        recent_count = sum(
            1 for tx in self.recent_transactions if tx.timestamp > recent_window
        )

        if recent_count > self.pattern_config.get("burst_threshold", 10):
            timing_indicators.append("burst_activity")

        # Check for predictable intervals
        if await self._check_predictable_intervals():
            timing_indicators.append("predictable_intervals")

        pattern.metadata["timing_indicators"] = timing_indicators

    async def _check_predictable_intervals(self) -> bool:
        """Check for predictable timing intervals in recent transactions"""
        if len(self.recent_transactions) < 5:
            return False

        # Calculate intervals between recent transactions
        intervals = []
        recent_txs = list(self.recent_transactions)[-10:]

        for i in range(1, len(recent_txs)):
            interval = (
                recent_txs[i].timestamp - recent_txs[i - 1].timestamp
            ).total_seconds()
            intervals.append(interval)

        if len(intervals) >= 3:
            # Check for consistent intervals (potential automation)
            std_dev = np.std(intervals)
            mean_interval = np.mean(intervals)

            # If standard deviation is very low relative to mean, it's suspicious
            if mean_interval > 0 and (std_dev / mean_interval) < 0.1:
                return True

        return False

    async def _analyze_value_patterns(self, pattern: TransactionPattern):
        """Analyze value-based attack patterns"""
        value_indicators = []

        # Check for dust attacks
        if pattern.value < self.pattern_config.get("dust_threshold", 0.00001):
            value_indicators.append("dust_attack")

        # Check for systematic sweeping patterns
        if await self._check_sweeping_pattern(pattern):
            value_indicators.append("systematic_sweeping")

        # Check for value clustering
        if await self._check_value_clustering(pattern.value):
            value_indicators.append("value_clustering")

        pattern.metadata["value_indicators"] = value_indicators

    async def _check_sweeping_pattern(self, pattern: TransactionPattern) -> bool:
        """Check for systematic address sweeping"""
        # Look for patterns where multiple small UTXOs are being consolidated
        if len(pattern.input_addresses) > 5 and len(pattern.output_addresses) == 1:
            # Check if input values are small and similar
            return True

        return False

    async def _check_value_clustering(self, value: float) -> bool:
        """Check for suspicious value clustering"""
        # Look for similar values in recent transactions
        similar_values = [
            tx.value
            for tx in list(self.recent_transactions)[-20:]
            if abs(tx.value - value) / max(value, 0.00001) < 0.01
        ]

        return len(similar_values) > 3

    async def _analyze_address_relationships(self, pattern: TransactionPattern):
        """Analyze address relationship patterns"""
        relationship_indicators = []

        # Update address profiles
        for address in pattern.input_addresses + pattern.output_addresses:
            await self._update_address_profile(address, pattern)

        # Check for suspicious address clustering
        if await self._check_address_clustering(pattern):
            relationship_indicators.append("suspicious_clustering")

        pattern.metadata["relationship_indicators"] = relationship_indicators

    async def _update_address_profile(self, address: str, pattern: TransactionPattern):
        """Update address behavior profile"""
        if address not in self.address_profiles:
            self.address_profiles[address] = {
                "first_seen": pattern.timestamp,
                "transaction_count": 0,
                "total_value": 0.0,
                "risk_score": 0.0,
                "quantum_indicators": set(),
            }

        profile = self.address_profiles[address]
        profile["transaction_count"] += 1
        profile["total_value"] += pattern.value
        profile["last_seen"] = pattern.timestamp

        # Update quantum indicators
        quantum_indicators = pattern.metadata.get("quantum_indicators", [])
        profile["quantum_indicators"].update(quantum_indicators)

        # Calculate updated risk score
        profile["risk_score"] = self._calculate_address_risk_score(profile)

    def _calculate_address_risk_score(self, profile: Dict[str, Any]) -> float:
        """Calculate risk score for an address"""
        risk_score = 0.0

        # Quantum indicator contribution
        quantum_weight = len(profile["quantum_indicators"]) * 0.3
        risk_score += min(quantum_weight, 1.0)

        # Transaction frequency contribution
        frequency_score = min(profile["transaction_count"] / 100.0, 0.3)
        risk_score += frequency_score

        # Normalize to 0-1 range
        return min(risk_score, 1.0)

    async def _check_address_clustering(self, pattern: TransactionPattern) -> bool:
        """Check for suspicious address clustering"""
        # Implementation for address clustering analysis
        # This would use graph analysis to detect related addresses
        return False

    def _calculate_quantum_score(self, pattern: TransactionPattern) -> float:
        """Calculate overall quantum attack probability score"""
        score = 0.0

        # Weight different indicator types
        weights = {
            "quantum_indicators": 0.4,
            "timing_indicators": 0.3,
            "value_indicators": 0.2,
            "relationship_indicators": 0.1,
        }

        for indicator_type, weight in weights.items():
            indicators = pattern.metadata.get(indicator_type, [])
            if indicators:
                # Score based on number and severity of indicators
                indicator_score = min(len(indicators) / 3.0, 1.0)
                score += indicator_score * weight

        return min(score, 1.0)

    def _determine_risk_level(self, quantum_score: float) -> str:
        """Determine risk level based on quantum score"""
        if quantum_score >= 0.8:
            return "CRITICAL"
        elif quantum_score >= 0.6:
            return "HIGH"
        elif quantum_score >= 0.4:
            return "MEDIUM"
        elif quantum_score >= 0.2:
            return "LOW"
        else:
            return "MINIMAL"

    async def _log_high_risk_pattern(self, pattern: TransactionPattern):
        """Log high-risk patterns for security analysis"""
        await self.audit_logger.log_security_event(
            event_type="HIGH_RISK_QUANTUM_PATTERN",
            severity=pattern.risk_level,
            details={
                "transaction_hash": pattern.tx_hash,
                "quantum_score": pattern.quantum_score,
                "risk_level": pattern.risk_level,
                "indicators": pattern.metadata,
                "addresses_involved": pattern.input_addresses
                + pattern.output_addresses,
            },
        )

    async def detect_attack_patterns(self) -> List[AttackPattern]:
        """
        Detect coordinated attack patterns across multiple transactions

        Returns:
            List[AttackPattern]: Detected attack patterns
        """
        detected_patterns = []

        try:
            # Analyze recent transaction window
            recent_window = datetime.now() - self.analysis_window
            recent_patterns = [
                p for p in self.recent_transactions if p.timestamp > recent_window
            ]

            if len(recent_patterns) < 3:
                return detected_patterns

            # Detect coordinated attacks
            coordinated_attacks = await self._detect_coordinated_attacks(
                recent_patterns
            )
            detected_patterns.extend(coordinated_attacks)

            # Detect systematic sweeping
            sweeping_attacks = await self._detect_systematic_sweeping(recent_patterns)
            detected_patterns.extend(sweeping_attacks)

            # Detect quantum signature patterns
            signature_attacks = await self._detect_signature_patterns(recent_patterns)
            detected_patterns.extend(signature_attacks)

            # Update attack pattern tracking
            for pattern in detected_patterns:
                self.attack_patterns[pattern.pattern_id] = pattern

            # Update metrics
            self.metrics.set_gauge("active_attack_patterns", len(self.attack_patterns))

            return detected_patterns

        except Exception as e:
            self.logger.error(f"Failed to detect attack patterns: {e}")
            self.metrics.increment_counter("pattern_detection_errors_total")
            return []

    async def _detect_coordinated_attacks(
        self, patterns: List[TransactionPattern]
    ) -> List[AttackPattern]:
        """Detect coordinated quantum attacks"""
        coordinated_attacks = []

        # Group patterns by timing clusters
        timing_clusters = self._cluster_by_timing(patterns)

        for cluster in timing_clusters:
            if len(cluster) >= self.pattern_config.get("min_coordinated_txs", 5):
                # Analyze cluster for quantum indicators
                quantum_score = np.mean([p.quantum_score for p in cluster])

                if quantum_score > 0.5:
                    attack_pattern = AttackPattern(
                        pattern_id=f"coordinated_{datetime.now().isoformat()}",
                        pattern_type="COORDINATED_QUANTUM_ATTACK",
                        confidence=quantum_score,
                        affected_addresses=set().union(
                            *[
                                set(p.input_addresses + p.output_addresses)
                                for p in cluster
                            ]
                        ),
                        transaction_hashes=[p.tx_hash for p in cluster],
                        first_detected=min(p.timestamp for p in cluster),
                        last_detected=max(p.timestamp for p in cluster),
                        severity="HIGH" if quantum_score > 0.7 else "MEDIUM",
                        quantum_indicators=list(
                            set().union(
                                *[
                                    set(p.metadata.get("quantum_indicators", []))
                                    for p in cluster
                                ]
                            )
                        ),
                        mitigation_recommendations=[
                            "Immediate address migration for affected legacy addresses",
                            "Enhanced monitoring of related addresses",
                            "Quantum-resistant signature verification",
                        ],
                    )
                    coordinated_attacks.append(attack_pattern)

        return coordinated_attacks

    def _cluster_by_timing(
        self, patterns: List[TransactionPattern]
    ) -> List[List[TransactionPattern]]:
        """Cluster patterns by timing proximity"""
        if not patterns:
            return []

        # Sort by timestamp
        sorted_patterns = sorted(patterns, key=lambda p: p.timestamp)

        clusters = []
        current_cluster = [sorted_patterns[0]]

        for i in range(1, len(sorted_patterns)):
            time_diff = (
                sorted_patterns[i].timestamp - current_cluster[-1].timestamp
            ).total_seconds()

            # If within clustering window, add to current cluster
            if time_diff <= self.pattern_config.get("timing_cluster_window", 60):
                current_cluster.append(sorted_patterns[i])
            else:
                # Start new cluster
                if len(current_cluster) > 1:
                    clusters.append(current_cluster)
                current_cluster = [sorted_patterns[i]]

        # Add final cluster
        if len(current_cluster) > 1:
            clusters.append(current_cluster)

        return clusters

    async def _detect_systematic_sweeping(
        self, patterns: List[TransactionPattern]
    ) -> List[AttackPattern]:
        """Detect systematic address sweeping attacks"""
        # Implementation for systematic sweeping detection
        return []

    async def _detect_signature_patterns(
        self, patterns: List[TransactionPattern]
    ) -> List[AttackPattern]:
        """Detect quantum signature attack patterns"""
        # Implementation for signature pattern detection
        return []

    async def get_risk_summary(self) -> Dict[str, Any]:
        """Get comprehensive risk analysis summary"""
        recent_window = datetime.now() - timedelta(hours=1)
        recent_patterns = [
            p for p in self.recent_transactions if p.timestamp > recent_window
        ]

        if not recent_patterns:
            return {
                "summary": "No recent activity",
                "risk_level": "MINIMAL",
                "quantum_score": 0.0,
            }

        # Calculate aggregate metrics
        avg_quantum_score = np.mean([p.quantum_score for p in recent_patterns])
        max_quantum_score = np.max([p.quantum_score for p in recent_patterns])
        high_risk_count = sum(
            1 for p in recent_patterns if p.risk_level in ["HIGH", "CRITICAL"]
        )

        # Determine overall risk level
        if max_quantum_score >= 0.8 or high_risk_count > 5:
            overall_risk = "CRITICAL"
        elif avg_quantum_score >= 0.5 or high_risk_count > 2:
            overall_risk = "HIGH"
        elif avg_quantum_score >= 0.3:
            overall_risk = "MEDIUM"
        else:
            overall_risk = "LOW"

        return {
            "summary": f"Analyzed {len(recent_patterns)} transactions in past hour",
            "risk_level": overall_risk,
            "average_quantum_score": avg_quantum_score,
            "maximum_quantum_score": max_quantum_score,
            "high_risk_transactions": high_risk_count,
            "active_attack_patterns": len(self.attack_patterns),
            "unique_addresses_analyzed": len(
                set().union(
                    *[
                        set(p.input_addresses + p.output_addresses)
                        for p in recent_patterns
                    ]
                )
            ),
            "quantum_indicators_detected": list(
                set().union(
                    *[
                        set(p.metadata.get("quantum_indicators", []))
                        for p in recent_patterns
                    ]
                )
            ),
        }
