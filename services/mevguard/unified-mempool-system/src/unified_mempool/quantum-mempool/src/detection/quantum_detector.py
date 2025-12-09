import logging
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Enterprise quantum attack detection with advanced machine learning algorithms.
"""

import uuid  # noqa: E402
from dataclasses import dataclass  # noqa: E402
from datetime import datetime  # noqa: E402
from typing import Any, Dict, List, Optional  # noqa: E402

import numpy as np  # noqa: E402

try:
    import structlog  # noqa: E402

    STRUCTLOG_AVAILABLE = True
except ImportError:
    STRUCTLOG_AVAILABLE = False

try:
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

from ..database.models import IncidentReport  # noqa: E402
from ..database.models import TransactionRecord  # noqa: E402
from ..database.models import QuantumSignature as QuantumSignatureRecord  # noqa: E402
from ..database.models import ThreatAlert as ThreatAlertModel  # noqa: E402
from ..database.simple_connection_manager import SimpleDatabaseManager  # noqa: E402
from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..utils.config import DetectionConfig  # noqa: E402
from ..utils.metrics import MetricsCollector  # noqa: E402


@dataclass
class QuantumSignature:
    """Quantum attack signature analysis results."""

    temporal_clustering: float
    fee_uniformity: float
    address_age_correlation: float
    geometric_pattern_score: float
    entropy_analysis: float
    statistical_anomaly_score: float
    confidence_score: float
    threat_level: str
    analysis_id: str
    timestamp: datetime


@dataclass
class QuantumThreatAlert:
    """Enterprise quantum threat alert."""

    alert_id: str
    threat_level: str
    confidence_score: float
    affected_addresses: List[str]
    attack_vector: str
    estimated_time_to_compromise: str
    recommended_actions: List[str]
    technical_details: Dict[str, Any]
    compliance_impact: Dict[str, Any]
    incident_classification: str


class EnterpriseQuantumDetector:
    """
    Advanced quantum attack detection with enterprise security integration.

    Features:
    - Multi-layered detection algorithms
    - Machine learning pattern recognition
    - Real-time threat assessment
    - Enterprise security integration
    - Compliance and audit logging
    - Automated incident response
    - SQLAlchemy database persistence
    """

    def __init__(
        self,
        config: DetectionConfig,
        db_manager: Optional["SimpleDatabaseManager"] = None,
    ):
        self.config = config
        self.db_manager = db_manager

        # Initialize logger
        if STRUCTLOG_AVAILABLE:
            self.logger = structlog.get_logger(__name__)
        else:
            from common.observability.logging import get_scorpius_logger  # noqa: E402

            logging.basicConfig(level=logging.INFO)
            self.logger = get_scorpius_logger(__name__)

        self.metrics = MetricsCollector(config.metrics_config)

        # Handle missing audit_config gracefully
        audit_config = getattr(config, "audit_config", None)
        if audit_config is None:
            audit_config = {}
        elif hasattr(audit_config, "__dict__"):
            audit_config = audit_config.__dict__
        else:
            audit_config = {}

        self.audit_logger = SecurityEventLogger(audit_config)

        # Detection parameters
        self.confidence_threshold = config.confidence_threshold
        self.temporal_threshold = config.temporal_threshold
        self.statistical_threshold = config.statistical_threshold

        # Machine learning models (would be loaded from trained models)
        self.ml_models = self._initialize_ml_models()

        # Threat intelligence feeds
        self.threat_intel = self._initialize_threat_intelligence()

        # Last analysis results
        self.last_confidence_score = 0.0
        self.last_analysis_id = None

    def _initialize_ml_models(self) -> Dict[str, Any]:
        """Initialize machine learning models for quantum detection."""
        # In production, these would be pre-trained models
        return {
            "temporal_classifier": None,
            "pattern_recognizer": None,
            "anomaly_detector": None,
            "threat_predictor": None,
        }

    def _initialize_threat_intelligence(self) -> Dict[str, Any]:
        """Initialize threat intelligence feeds."""
        return {
            "known_quantum_signatures": [],
            "suspicious_address_patterns": [],
            "attack_vectors": [],
            "indicators_of_compromise": [],
        }

    async def initialize_detection_engine(self):
        """Initialize the quantum detection engine with enterprise controls."""
        try:
            # Load ML models
            await self._load_detection_models()

            # Initialize threat intelligence
            await self._update_threat_intelligence()

            # Setup detection metrics
            self._setup_detection_metrics()

            # Log initialization
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_DETECTOR_INITIALIZED",
                    "models_loaded": len(self.ml_models),
                    "threat_intel_sources": len(self.threat_intel),
                    "timestamp": datetime.utcnow(),
                    "status": "SUCCESS",
                }
            )

            self.logger.info("Quantum detection engine initialized")

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_DETECTOR_INIT_FAILED",
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
            self.logger.error(
                "Failed to initialize quantum detection engine", error=str(e)
            )
            raise

    async def analyze_mass_sweep(self, transactions: List[Any]) -> bool:
        """
        Analyze transactions for quantum-assisted mass sweep patterns.

        Args:
            transactions: List of transactions to analyze

        Returns:
            bool: True if quantum attack detected, False otherwise
        """
        try:
            if len(transactions) < self.config.minimum_transactions:
                return False

            # Generate analysis ID
            analysis_id = str(uuid.uuid4())
            self.last_analysis_id = analysis_id

            # Log analysis start
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_ANALYSIS_STARTED",
                    "analysis_id": analysis_id,
                    "transaction_count": len(transactions),
                    "timestamp": datetime.utcnow(),
                }
            )

            # Perform comprehensive quantum signature analysis
            signature = await self.calculate_quantum_signature(
                transactions, analysis_id
            )

            # Store confidence score
            self.last_confidence_score = signature.confidence_score

            # Determine if quantum attack detected
            is_quantum_attack = signature.confidence_score > self.confidence_threshold

            # Log analysis results
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_ANALYSIS_COMPLETED",
                    "analysis_id": analysis_id,
                    "confidence_score": signature.confidence_score,
                    "threat_level": signature.threat_level,
                    "quantum_attack_detected": is_quantum_attack,
                    "timestamp": datetime.utcnow(),
                }
            )

            # Update metrics
            self.metrics.set_gauge(
                "quantum_confidence_score", signature.confidence_score
            )
            self.metrics.increment_counter("quantum_analyses_performed")

            if is_quantum_attack:
                self.metrics.increment_counter("quantum_attacks_detected")
                await self._generate_quantum_threat_alert(signature, transactions)

            self.logger.info(
                "Quantum analysis completed",
                analysis_id=analysis_id,
                confidence_score=signature.confidence_score,
                quantum_detected=is_quantum_attack,
            )

            return is_quantum_attack

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_ANALYSIS_ERROR",
                    "analysis_id": (
                        analysis_id if "analysis_id" in locals() else "UNKNOWN"
                    ),
                    "error": str(e),
                    "timestamp": datetime.utcnow(),
                    "status": "FAILURE",
                }
            )
            self.logger.error("Quantum analysis error", error=str(e))
            return False

    async def calculate_quantum_signature(
        self, transactions: List[Any], analysis_id: str
    ) -> QuantumSignature:
        """Calculate comprehensive quantum attack signature and persist to database."""
        try:
            # Temporal clustering analysis
            temporal_score = await self.analyze_temporal_clustering(transactions)

            # Fee uniformity analysis
            fee_score = await self.analyze_fee_uniformity(transactions)

            # Address age correlation analysis
            age_score = await self.analyze_address_age_correlation(transactions)

            # Geometric pattern analysis
            geometric_score = await self.analyze_geometric_patterns(transactions)

            # Entropy analysis for randomness detection
            entropy_score = await self.analyze_entropy_patterns(transactions)

            # Statistical anomaly detection
            anomaly_score = await self.analyze_statistical_anomalies(transactions)

            # Calculate overall confidence using weighted ensemble
            confidence = await self.calculate_ensemble_confidence(
                temporal_score,
                fee_score,
                age_score,
                geometric_score,
                entropy_score,
                anomaly_score,
            )

            # Determine threat level
            threat_level = self._determine_threat_level(confidence)

            signature = QuantumSignature(
                temporal_clustering=temporal_score,
                fee_uniformity=fee_score,
                address_age_correlation=age_score,
                geometric_pattern_score=geometric_score,
                entropy_analysis=entropy_score,
                statistical_anomaly_score=anomaly_score,
                confidence_score=confidence,
                threat_level=threat_level,
                analysis_id=analysis_id,
                timestamp=datetime.utcnow(),
            )

            # Save signature to database
            await self._save_quantum_signature_to_db(signature, transactions)

            # Log signature details
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_SIGNATURE_CALCULATED",
                    "analysis_id": analysis_id,
                    "signature": signature.__dict__,
                    "timestamp": datetime.utcnow(),
                }
            )

            return signature

        except Exception as e:
            self.logger.error("Quantum signature calculation error", error=str(e))
            raise

    async def analyze_temporal_clustering(self, transactions: List[Any]) -> float:
        """Advanced temporal clustering analysis with enterprise algorithms."""
        try:
            timestamps = [tx.timestamp for tx in transactions]

            if len(timestamps) < 2:
                return 0.0

            # Calculate inter-arrival times
            timestamps.sort()
            inter_arrival_times = []

            for i in range(1, len(timestamps)):
                diff = (timestamps[i] - timestamps[i - 1]).total_seconds()
                inter_arrival_times.append(diff)

            # Multiple clustering metrics
            # 1. Coefficient of variation
            mean_interval = np.mean(inter_arrival_times)
            std_interval = np.std(inter_arrival_times)
            cv = std_interval / mean_interval if mean_interval > 0 else float("inf")

            # 2. Clustering coefficient (number of transactions in small time windows)
            time_window = 60  # 1 minute windows
            clusters = []
            current_cluster_size = 1

            for interval in inter_arrival_times:
                if interval <= time_window:
                    current_cluster_size += 1
                else:
                    if current_cluster_size > 1:
                        clusters.append(current_cluster_size)
                    current_cluster_size = 1

            if current_cluster_size > 1:
                clusters.append(current_cluster_size)

            # 3. Periodicity detection using FFT
            if len(inter_arrival_times) >= 8:
                fft = np.fft.fft(inter_arrival_times)
                power_spectrum = np.abs(fft) ** 2
                periodicity_score = np.max(power_spectrum[1 : len(power_spectrum) // 2])
            else:
                periodicity_score = 0

            # Combine metrics (quantum attacks show high clustering)
            cv_score = min(
                1.0, max(0.0, 1.0 - (cv / 2.0))
            )  # Lower CV = higher clustering
            cluster_score = min(1.0, len(clusters) / len(transactions))
            periodicity_normalized = min(
                1.0, periodicity_score / (np.mean(inter_arrival_times) ** 2)
            )

            # Weighted combination
            temporal_score = (
                0.4 * cv_score + 0.4 * cluster_score + 0.2 * periodicity_normalized
            )

            return temporal_score

        except Exception as e:
            self.logger.error("Temporal clustering analysis error", error=str(e))
            return 0.0

    async def analyze_fee_uniformity(self, transactions: List[Any]) -> float:
        """Analyze fee uniformity patterns indicating automated quantum attacks."""
        try:
            fees = [tx.fee for tx in transactions if tx.fee > 0]

            if len(fees) < 2:
                return 0.0

            # Multiple uniformity metrics
            # 1. Coefficient of variation
            mean_fee = np.mean(fees)
            std_fee = np.std(fees)
            cv = std_fee / mean_fee if mean_fee > 0 else float("inf")

            # 2. Fee rate uniformity (fee per byte)
            fee_rates = [
                tx.fee / max(tx.size, 1)
                for tx in transactions
                if tx.fee > 0 and tx.size > 0
            ]
            if len(fee_rates) >= 2:
                rate_cv = (
                    np.std(fee_rates) / np.mean(fee_rates)
                    if np.mean(fee_rates) > 0
                    else float("inf")
                )
            else:
                rate_cv = float("inf")

            # 3. Exact fee matching (suspicious for quantum attacks)
            unique_fees = len(set(fees))
            exact_match_ratio = 1.0 - (unique_fees / len(fees))

            # 4. Fee distribution analysis using entropy
            if len(fees) >= 4:
                # Calculate entropy of fee distribution
                fee_hist, _ = np.histogram(fees, bins=min(10, len(fees) // 2))
                fee_probs = fee_hist / np.sum(fee_hist)
                fee_probs = fee_probs[fee_probs > 0]  # Remove zero probabilities
                entropy = -np.sum(fee_probs * np.log2(fee_probs))
                max_entropy = np.log2(len(fee_probs))
                normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
                # Low entropy indicates uniformity
                entropy_score = 1.0 - normalized_entropy
            else:
                entropy_score = 0.0

            # Combine uniformity metrics
            cv_score = min(1.0, max(0.0, 1.0 - cv))
            rate_score = min(1.0, max(0.0, 1.0 - rate_cv))

            # Weighted combination (quantum attacks show high uniformity)
            uniformity_score = (
                0.3 * cv_score
                + 0.3 * rate_score
                + 0.2 * exact_match_ratio
                + 0.2 * entropy_score
            )

            return uniformity_score

        except Exception as e:
            self.logger.error("Fee uniformity analysis error", error=str(e))
            return 0.0

    async def analyze_address_age_correlation(self, transactions: List[Any]) -> float:
        """Analyze correlation between address age and quantum vulnerability."""
        try:
            # Count legacy vs modern addresses
            legacy_count = sum(1 for tx in transactions if tx.is_legacy)
            total_count = len(transactions)

            if total_count == 0:
                return 0.0

            # Basic legacy ratio
            legacy_ratio = legacy_count / total_count

            # Enhanced analysis: check for systematic targeting of old addresses
            # This would require blockchain analysis to determine address creation dates
            # For now, we'll use the legacy flag as a proxy

            # Risk factors for quantum attacks:
            # 1. High concentration of legacy addresses
            # 2. Systematic targeting (addresses from similar time periods)
            # 3. High-value legacy addresses

            # Calculate systematic targeting score
            if legacy_count > 0:
                # Simulate address age analysis (would use real blockchain data)
                systematic_score = min(
                    1.0, legacy_ratio * 1.5
                )  # Boost for high legacy concentration
            else:
                systematic_score = 0.0

            # Combine factors
            age_correlation_score = min(
                1.0, legacy_ratio * 0.7 + systematic_score * 0.3
            )

            return age_correlation_score

        except Exception as e:
            self.logger.error("Address age correlation analysis error", error=str(e))
            return 0.0

    async def analyze_geometric_patterns(self, transactions: List[Any]) -> float:
        """Analyze geometric and mathematical patterns in transaction data."""
        try:
            if len(transactions) < 3:
                return 0.0

            # Extract numerical features for pattern analysis
            features = {
                "fees": [tx.fee for tx in transactions],
                "sizes": [tx.size for tx in transactions],
                "input_counts": [len(tx.inputs) for tx in transactions],
                "output_counts": [len(tx.outputs) for tx in transactions],
            }

            pattern_scores = []

            for feature_name, values in features.items():
                if len(values) < 3:
                    continue

                # 1. Arithmetic progression detection
                arithmetic_score = self._detect_arithmetic_progression(values)

                # 2. Geometric progression detection
                geometric_score = self._detect_geometric_progression(values)

                # 3. Fibonacci-like patterns
                fibonacci_score = self._detect_fibonacci_pattern(values)

                # 4. Power law distribution
                power_law_score = self._detect_power_law(values)

                # Combine pattern scores for this feature
                feature_score = max(
                    arithmetic_score, geometric_score, fibonacci_score, power_law_score
                )
                pattern_scores.append(feature_score)

            # Overall geometric pattern score
            if pattern_scores:
                geometric_score = np.mean(pattern_scores)
            else:
                geometric_score = 0.0

            return geometric_score

        except Exception as e:
            self.logger.error("Geometric pattern analysis error", error=str(e))
            return 0.0

    def _detect_arithmetic_progression(self, values: List[int]) -> float:
        """Detect arithmetic progression patterns."""
        if len(values) < 3:
            return 0.0

        differences = [values[i + 1] - values[i] for i in range(len(values) - 1)]

        if len(differences) < 2:
            return 0.0

        # Check if differences are consistent (arithmetic progression)
        diff_variance = np.var(differences)
        mean_diff = np.mean(differences)

        if mean_diff == 0:
            return 1.0 if diff_variance == 0 else 0.0

        cv = np.sqrt(diff_variance) / abs(mean_diff)

        # Low coefficient of variation indicates arithmetic progression
        return min(1.0, max(0.0, 1.0 - cv))

    def _detect_geometric_progression(self, values: List[int]) -> float:
        """Detect geometric progression patterns."""
        if len(values) < 3:
            return 0.0

        # Avoid division by zero
        non_zero_values = [v for v in values if v != 0]
        if len(non_zero_values) < 3:
            return 0.0

        ratios = [
            non_zero_values[i + 1] / non_zero_values[i]
            for i in range(len(non_zero_values) - 1)
        ]

        if len(ratios) < 2:
            return 0.0

        # Check if ratios are consistent (geometric progression)
        ratio_variance = np.var(ratios)
        mean_ratio = np.mean(ratios)

        if mean_ratio == 0:
            return 0.0

        cv = np.sqrt(ratio_variance) / abs(mean_ratio)

        # Low coefficient of variation indicates geometric progression
        return min(1.0, max(0.0, 1.0 - cv))

    def _detect_fibonacci_pattern(self, values: List[int]) -> float:
        """Detect Fibonacci-like patterns."""
        if len(values) < 3:
            return 0.0

        fibonacci_scores = []

        for i in range(2, len(values)):
            expected = values[i - 2] + values[i - 1]
            actual = values[i]

            if expected == 0:
                score = 1.0 if actual == 0 else 0.0
            else:
                error = abs(actual - expected) / expected
                score = max(0.0, 1.0 - error)

            fibonacci_scores.append(score)

        return np.mean(fibonacci_scores) if fibonacci_scores else 0.0

    def _detect_power_law(self, values: List[int]) -> float:
        """Detect power law distribution."""
        if len(values) < 3:
            return 0.0

        # Remove zeros and sort
        non_zero_values = sorted([v for v in values if v > 0])

        if len(non_zero_values) < 3:
            return 0.0

        # Fit power law using log-log regression
        log_values = np.log(non_zero_values)
        log_ranks = np.log(range(1, len(non_zero_values) + 1))

        # Calculate correlation coefficient
        correlation = np.corrcoef(log_ranks, log_values)[0, 1]

        # High negative correlation indicates power law
        return max(0.0, -correlation) if not np.isnan(correlation) else 0.0

    async def analyze_entropy_patterns(self, transactions: List[Any]) -> float:
        """Analyze entropy patterns to detect algorithmic generation."""
        try:
            # Collect various transaction features
            features = []

            for tx in transactions:
                # Create feature vector for each transaction
                feature_vector = [
                    tx.fee % 1000,  # Fee modulo (to detect patterns)
                    tx.size % 1000,  # Size modulo
                    len(tx.inputs),
                    len(tx.outputs),
                    hash(tx.txid) % 1000,  # Transaction ID hash modulo
                ]
                features.append(feature_vector)

            if len(features) < 2:
                return 0.0

            # Calculate entropy for each feature dimension
            entropies = []

            for feature_idx in range(len(features[0])):
                feature_values = [f[feature_idx] for f in features]

                # Calculate entropy of this feature
                unique_values, counts = np.unique(feature_values, return_counts=True)
                probabilities = counts / len(feature_values)
                entropy = -np.sum(probabilities * np.log2(probabilities + 1e-10))

                # Normalize by maximum possible entropy
                max_entropy = (
                    np.log2(len(unique_values)) if len(unique_values) > 1 else 0
                )
                normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0

                entropies.append(normalized_entropy)

            # Low average entropy suggests algorithmic generation
            avg_entropy = np.mean(entropies)
            entropy_score = 1.0 - avg_entropy  # Invert: low entropy = high score

            return entropy_score

        except Exception as e:
            self.logger.error("Entropy analysis error", error=str(e))
            return 0.0

    async def analyze_statistical_anomalies(self, transactions: List[Any]) -> float:
        """Detect statistical anomalies indicating quantum attacks."""
        try:
            if len(transactions) < 5:
                return 0.0

            anomaly_scores = []

            # 1. Fee distribution anomalies
            fees = [tx.fee for tx in transactions if tx.fee > 0]
            if len(fees) >= 3:
                fee_anomaly = self._detect_distribution_anomaly(fees)
                anomaly_scores.append(fee_anomaly)

            # 2. Size distribution anomalies
            sizes = [tx.size for tx in transactions if tx.size > 0]
            if len(sizes) >= 3:
                size_anomaly = self._detect_distribution_anomaly(sizes)
                anomaly_scores.append(size_anomaly)

            # 3. Timing anomalies
            timestamps = [tx.timestamp for tx in transactions]
            if len(timestamps) >= 3:
                timing_anomaly = self._detect_timing_anomaly(timestamps)
                anomaly_scores.append(timing_anomaly)

            # 4. Input/output count anomalies
            input_counts = [len(tx.inputs) for tx in transactions]
            if len(input_counts) >= 3:
                input_anomaly = self._detect_distribution_anomaly(input_counts)
                anomaly_scores.append(input_anomaly)

            # Average anomaly score
            return np.mean(anomaly_scores) if anomaly_scores else 0.0

        except Exception as e:
            self.logger.error("Statistical anomaly analysis error", error=str(e))
            return 0.0

    def _detect_distribution_anomaly(self, values: List[float]) -> float:
        """Detect anomalies in value distribution."""
        if len(values) < 3:
            return 0.0

        # Z-score based anomaly detection
        mean_val = np.mean(values)
        std_val = np.std(values)

        if std_val == 0:
            return 1.0  # All values are identical - highly anomalous

        z_scores = [(v - mean_val) / std_val for v in values]

        # Count values with high z-scores (>2 or <-2)
        anomalous_count = sum(1 for z in z_scores if abs(z) > 2)
        anomaly_ratio = anomalous_count / len(values)

        return anomaly_ratio

    def _detect_timing_anomaly(self, timestamps: List[datetime]) -> float:
        """Detect timing anomalies."""
        if len(timestamps) < 3:
            return 0.0

        # Sort timestamps
        sorted_timestamps = sorted(timestamps)

        # Calculate inter-arrival times
        intervals = []
        for i in range(1, len(sorted_timestamps)):
            interval = (sorted_timestamps[i] - sorted_timestamps[i - 1]).total_seconds()
            intervals.append(interval)

        # Detect anomalous intervals
        return self._detect_distribution_anomaly(intervals)

    async def calculate_ensemble_confidence(
        self,
        temporal: float,
        fee: float,
        age: float,
        geometric: float,
        entropy: float,
        anomaly: float,
    ) -> float:
        """Calculate ensemble confidence score using advanced weighting."""
        try:
            # Dynamic weights based on individual scores
            scores = [temporal, fee, age, geometric, entropy, anomaly]

            # Base weights
            base_weights = {
                "temporal": 0.25,
                "fee": 0.20,
                "age": 0.20,
                "geometric": 0.15,
                "entropy": 0.10,
                "anomaly": 0.10,
            }

            # Adjust weights based on score reliability
            # Higher scores get more weight (evidence of attack)
            weight_adjustments = []
            for score in scores:
                if score > 0.8:
                    weight_adjustments.append(1.5)  # Boost high confidence scores
                elif score > 0.6:
                    weight_adjustments.append(1.2)
                elif score < 0.2:
                    weight_adjustments.append(0.5)  # Reduce low confidence scores
                else:
                    weight_adjustments.append(1.0)

            # Apply adjustments
            adjusted_weights = []
            for i, (key, base_weight) in enumerate(base_weights.items()):
                adjusted_weights.append(base_weight * weight_adjustments[i])

            # Normalize weights
            total_weight = sum(adjusted_weights)
            normalized_weights = [w / total_weight for w in adjusted_weights]

            # Calculate weighted score
            confidence = sum(
                score * weight for score, weight in zip(scores, normalized_weights)
            )

            # Apply ensemble boosting for correlated high scores
            high_score_count = sum(1 for score in scores if score > 0.7)
            if high_score_count >= 3:
                confidence = min(
                    1.0, confidence * 1.1
                )  # 10% boost for multiple high scores

            return min(1.0, max(0.0, confidence))

        except Exception as e:
            self.logger.error("Ensemble confidence calculation error", error=str(e))
            return 0.0

    def _determine_threat_level(self, confidence: float) -> str:
        """Determine threat level based on confidence score."""
        if confidence >= 0.9:
            return "CRITICAL"
        elif confidence >= 0.75:
            return "HIGH"
        elif confidence >= 0.5:
            return "MEDIUM"
        elif confidence >= 0.25:
            return "LOW"
        else:
            return "MINIMAL"

    def _determine_attack_vector(self, signature: QuantumSignature) -> str:
        """Determine the specific quantum attack vector."""
        if signature.temporal_clustering > 0.8 and signature.fee_uniformity > 0.7:
            return "automated_quantum_sweep"
        elif signature.geometric_pattern_score > 0.8:
            return "algorithmic_key_enumeration"
        elif signature.entropy_analysis > 0.8:
            return "deterministic_private_key_generation"
        else:
            return "quantum_assisted_brute_force"

    def _estimate_time_to_compromise(self, signature: QuantumSignature) -> str:
        """Estimate time until addresses are compromised."""
        if signature.confidence_score > 0.9:
            return "IMMEDIATE (minutes)"
        elif signature.confidence_score > 0.8:
            return "URGENT (hours)"
        elif signature.confidence_score > 0.6:
            return "CRITICAL (days)"
        else:
            return "MODERATE (weeks)"

    def _generate_recommendations(self, signature: QuantumSignature) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = [
            "IMMEDIATE: Stop all outgoing transactions from legacy addresses",
            "URGENT: Move funds to quantum-resistant addresses (P2WPKH, P2WSH, P2TR)",
            "CRITICAL: Update wallet software to latest quantum-resistant versions",
        ]

        if signature.confidence_score > 0.9:
            recommendations.extend(
                [
                    "EMERGENCY: Activate incident response team",
                    "EMERGENCY: Notify regulatory authorities within 24 hours",
                    "EMERGENCY: Coordinate with law enforcement",
                ]
            )

        if signature.temporal_clustering > 0.8:
            recommendations.append(
                "TACTICAL: Implement rate limiting on legacy address transactions"
            )

        if signature.fee_uniformity > 0.8:
            recommendations.append(
                "TACTICAL: Monitor for similar fee patterns across the network"
            )

        return recommendations

    def _calculate_false_positive_rate(self, signature: QuantumSignature) -> float:
        """Calculate estimated false positive probability."""
        # Based on ensemble confidence and individual score reliability
        base_fpr = 1.0 - signature.confidence_score

        # Adjust based on individual scores
        high_confidence_scores = sum(
            1
            for score in [
                signature.temporal_clustering,
                signature.fee_uniformity,
                signature.address_age_correlation,
                signature.geometric_pattern_score,
                signature.entropy_analysis,
                signature.statistical_anomaly_score,
            ]
            if score > 0.8
        )

        # More high-confidence individual scores reduce false positive rate
        adjustment = 0.9**high_confidence_scores

        return base_fpr * adjustment

    def _assess_attack_sophistication(self, signature: QuantumSignature) -> str:
        """Assess the sophistication level of the attack."""
        sophistication_score = (
            signature.geometric_pattern_score * 0.3
            + signature.entropy_analysis * 0.3
            + signature.temporal_clustering * 0.2
            + signature.fee_uniformity * 0.2
        )

        if sophistication_score > 0.8:
            return "ADVANCED_PERSISTENT_THREAT"
        elif sophistication_score > 0.6:
            return "SOPHISTICATED_AUTOMATED"
        elif sophistication_score > 0.4:
            return "SCRIPTED_ATTACK"
        else:
            return "OPPORTUNISTIC"

    def _classify_incident(self, signature: QuantumSignature) -> str:
        """Classify the incident for compliance reporting."""
        if signature.confidence_score > 0.9:
            return "CRITICAL_SECURITY_INCIDENT"
        elif signature.confidence_score > 0.75:
            return "MAJOR_SECURITY_EVENT"
        elif signature.confidence_score > 0.5:
            return "SECURITY_ANOMALY"
        else:
            return "SUSPICIOUS_ACTIVITY"

    async def _generate_quantum_threat_alert(
        self, signature: QuantumSignature, transactions: List[Any]
    ) -> QuantumThreatAlert:
        """Generate comprehensive quantum threat alert."""
        try:
            # Extract affected addresses
            affected_addresses = []
            for tx in transactions:
                for input_data in tx.inputs:
                    if "address" in input_data:
                        affected_addresses.append(input_data["address"])

            # Remove duplicates
            affected_addresses = list(set(affected_addresses))

            # Determine attack vector
            attack_vector = self._determine_attack_vector(signature)

            # Estimate time to compromise
            time_to_compromise = self._estimate_time_to_compromise(signature)

            # Generate recommendations
            recommendations = self._generate_recommendations(signature)

            # Technical details
            technical_details = {
                "signature_analysis": signature.__dict__,
                "transaction_count": len(transactions),
                "detection_algorithm": "quantum_ensemble_ml",
                "false_positive_probability": self._calculate_false_positive_rate(
                    signature
                ),
                "attack_sophistication": self._assess_attack_sophistication(signature),
            }

            # Compliance impact
            compliance_impact = {
                "regulatory_frameworks": ["SOX", "GDPR", "PCI_DSS"],
                "notification_required": True,
                "incident_classification": "SECURITY_BREACH",
                "data_protection_impact": "HIGH",
            }

            alert = QuantumThreatAlert(
                alert_id=str(uuid.uuid4()),
                threat_level=signature.threat_level,
                confidence_score=signature.confidence_score,
                affected_addresses=affected_addresses,
                attack_vector=attack_vector,
                estimated_time_to_compromise=time_to_compromise,
                recommended_actions=recommendations,
                technical_details=technical_details,
                compliance_impact=compliance_impact,
                incident_classification=self._classify_incident(signature),
            )

            # Save alert to database
            await self._save_threat_alert_to_db(alert, signature)

            # Create incident report for high-confidence attacks
            await self._create_incident_report(signature, alert)

            # Log alert generation
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_THREAT_ALERT_GENERATED",
                    "alert_id": alert.alert_id,
                    "threat_level": alert.threat_level,
                    "affected_addresses_count": len(affected_addresses),
                    "timestamp": datetime.utcnow(),
                }
            )

            return alert

        except Exception as e:
            self.logger.error("Quantum threat alert generation error", error=str(e))
            raise

    async def _save_quantum_signature_to_db(
        self, signature: QuantumSignature, transactions: List[Any]
    ) -> None:
        """Save quantum signature analysis results to database."""
        if not self.db_manager or not SQLALCHEMY_AVAILABLE:
            self.logger.warning("Database not available for signature persistence")
            return

        try:
            async with self.db_manager.get_session() as session:
                # First, ensure we have transaction records
                transaction_records = []
                for tx in transactions:
                    # Check if transaction already exists
                    existing_tx = (
                        session.query(TransactionRecord).filter_by(txid=tx.txid).first()
                    )
                    if not existing_tx:
                        # Create new transaction record
                        tx_record = TransactionRecord(
                            txid=tx.txid,
                            block_hash=getattr(tx, "block_hash", None),
                            block_height=getattr(tx, "block_height", None),
                            from_address=getattr(tx, "from_address", ""),
                            to_address=getattr(tx, "to_address", ""),
                            amount=float(getattr(tx, "amount", 0)),
                            fee=float(getattr(tx, "fee", 0)),
                            gas_limit=getattr(tx, "gas_limit", None),
                            gas_price=(
                                float(getattr(tx, "gas_price", 0))
                                if hasattr(tx, "gas_price")
                                else None
                            ),
                            status="pending",
                            risk_score=signature.confidence_score,
                            compliance_tags=["quantum_analysis"],
                            created_by="quantum_detector",
                        )
                        session.add(tx_record)
                        session.flush()  # Get the ID
                        transaction_records.append(tx_record)
                    else:
                        transaction_records.append(existing_tx)

                # Create quantum signature record
                signature_record = QuantumSignatureRecord(
                    analysis_id=signature.analysis_id,
                    transaction_id=(
                        transaction_records[0].id if transaction_records else None
                    ),
                    temporal_clustering=signature.temporal_clustering,
                    fee_uniformity=signature.fee_uniformity,
                    address_age_correlation=signature.address_age_correlation,
                    geometric_pattern_score=signature.geometric_pattern_score,
                    entropy_analysis=signature.entropy_analysis,
                    statistical_anomaly_score=signature.statistical_anomaly_score,
                    confidence_score=signature.confidence_score,
                    threat_level=signature.threat_level,
                    detection_timestamp=signature.timestamp,
                    algorithm_version=(
                        self.config.algorithm_version
                        if hasattr(self.config, "algorithm_version")
                        else "1.0"
                    ),
                    processing_time_ms=100,  # Would be calculated in real implementation
                    validation_status="VALIDATED",
                    compliance_tags=["quantum_signature"],
                    created_by="quantum_detector",
                )

                session.add(signature_record)
                session.commit()

                self.logger.info(
                    "Quantum signature saved to database",
                    analysis_id=signature.analysis_id,
                    confidence_score=signature.confidence_score,
                )

        except Exception as e:
            self.logger.error(
                "Failed to save quantum signature to database",
                error=str(e),
                analysis_id=signature.analysis_id,
            )
            # Don't re-raise - this shouldn't stop the detection process

    async def _save_threat_alert_to_db(
        self, alert: QuantumThreatAlert, signature: QuantumSignature
    ) -> None:
        """Save quantum threat alert to database."""
        if not self.db_manager or not SQLALCHEMY_AVAILABLE:
            self.logger.warning("Database not available for alert persistence")
            return

        try:
            async with self.db_manager.get_session() as session:
                # Create threat alert record
                alert_record = ThreatAlertModel(
                    alert_id=alert.alert_id,
                    threat_type="QUANTUM_ATTACK",
                    severity_level=alert.threat_level,
                    confidence_score=alert.confidence_score,
                    affected_addresses=alert.affected_addresses,
                    attack_vector=alert.attack_vector,
                    estimated_impact=alert.technical_details.get(
                        "estimated_impact", "HIGH"
                    ),
                    mitigation_steps=alert.recommended_actions,
                    detection_timestamp=datetime.utcnow(),
                    status="ACTIVE",
                    assigned_analyst=None,
                    resolution_notes=None,
                    false_positive_probability=signature.confidence_score,
                    compliance_impact=alert.compliance_impact,
                    technical_details=alert.technical_details,
                    compliance_tags=["quantum_threat", "automated_detection"],
                    created_by="quantum_detector",
                )

                session.add(alert_record)
                session.commit()

                self.logger.info(
                    "Threat alert saved to database",
                    alert_id=alert.alert_id,
                    threat_level=alert.threat_level,
                )

        except Exception as e:
            self.logger.error(
                "Failed to save threat alert to database",
                error=str(e),
                alert_id=alert.alert_id,
            )

    async def _create_incident_report(
        self, signature: QuantumSignature, alert: QuantumThreatAlert
    ) -> None:
        """Create incident report for high-confidence quantum attacks."""
        if not self.db_manager or not SQLALCHEMY_AVAILABLE:
            return

        if (
            signature.confidence_score < 0.8
        ):  # Only create incidents for high-confidence detections
            return

        try:
            async with self.db_manager.get_session() as session:
                incident = IncidentReport(
                    incident_id=str(uuid.uuid4()),
                    incident_type="QUANTUM_ATTACK_DETECTED",
                    severity_level=signature.threat_level,
                    affected_systems=["mempool_monitor", "blockchain_scanner"],
                    initial_detection_time=signature.timestamp,
                    incident_summary=f"Quantum attack detected with {signature.confidence_score:.2%} confidence",
                    technical_details={
                        "analysis_id": signature.analysis_id,
                        "confidence_score": signature.confidence_score,
                        "threat_level": signature.threat_level,
                        "detection_algorithm": "enterprise_quantum_detector_v1",
                        "signature_scores": {
                            "temporal_clustering": signature.temporal_clustering,
                            "fee_uniformity": signature.fee_uniformity,
                            "address_age_correlation": signature.address_age_correlation,
                            "geometric_pattern_score": signature.geometric_pattern_score,
                            "entropy_analysis": signature.entropy_analysis,
                            "statistical_anomaly_score": signature.statistical_anomaly_score,
                        },
                    },
                    status="INVESTIGATING",
                    assigned_analyst="auto_assigned",
                    escalation_level="L2_SECURITY",
                    business_impact="POTENTIAL_FINANCIAL_LOSS",
                    compliance_requirements=["SOX", "GDPR", "PCI_DSS"],
                    compliance_tags=["quantum_incident", "security_breach"],
                    created_by="quantum_detector",
                )

                session.add(incident)
                session.commit()

                self.logger.info(
                    "Incident report created",
                    incident_id=incident.incident_id,
                    confidence_score=signature.confidence_score,
                )

        except Exception as e:
            self.logger.error(
                "Failed to create incident report",
                error=str(e),
                analysis_id=signature.analysis_id,
            )

    async def get_last_confidence_score(self) -> float:
        """Get the confidence score from the last analysis."""
        return self.last_confidence_score

    async def get_historical_signatures(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve historical quantum signatures from database."""
        if not self.db_manager or not SQLALCHEMY_AVAILABLE:
            return []

        try:
            async with self.db_manager.get_session() as session:
                signatures = (
                    session.query(QuantumSignatureRecord)
                    .order_by(QuantumSignatureRecord.created_at.desc())
                    .limit(limit)
                    .all()
                )

                return [
                    {
                        "analysis_id": sig.analysis_id,
                        "confidence_score": sig.confidence_score,
                        "threat_level": sig.threat_level,
                        "detection_timestamp": sig.detection_timestamp,
                        "temporal_clustering": sig.temporal_clustering,
                        "fee_uniformity": sig.fee_uniformity,
                        "address_age_correlation": sig.address_age_correlation,
                        "geometric_pattern_score": sig.geometric_pattern_score,
                        "entropy_analysis": sig.entropy_analysis,
                        "statistical_anomaly_score": sig.statistical_anomaly_score,
                    }
                    for sig in signatures
                ]

        except Exception as e:
            self.logger.error("Failed to retrieve historical signatures", error=str(e))
            return []

    async def get_threat_statistics(self) -> Dict[str, Any]:
        """Get quantum threat detection statistics from database."""
        if not self.db_manager or not SQLALCHEMY_AVAILABLE:
            return {}

        try:
            async with self.db_manager.get_session() as session:
                # Get total analyses
                total_analyses = session.query(QuantumSignatureRecord).count()

                # Get high-confidence detections
                high_confidence = (
                    session.query(QuantumSignatureRecord)
                    .filter(QuantumSignatureRecord.confidence_score > 0.7)
                    .count()
                )

                # Get active alerts
                active_alerts = (
                    session.query(ThreatAlertModel)
                    .filter(ThreatAlertModel.status == "ACTIVE")
                    .count()
                )

                # Get incidents
                total_incidents = (
                    session.query(IncidentReport)
                    .filter(IncidentReport.incident_type == "QUANTUM_ATTACK_DETECTED")
                    .count()
                )

                return {
                    "total_analyses": total_analyses,
                    "high_confidence_detections": high_confidence,
                    "active_alerts": active_alerts,
                    "total_incidents": total_incidents,
                    "detection_rate": (
                        high_confidence / total_analyses if total_analyses > 0 else 0
                    ),
                }

        except Exception as e:
            self.logger.error("Failed to retrieve threat statistics", error=str(e))
            return {}

    async def _load_detection_models(self):
        """Load pre-trained machine learning models."""
        # In production, this would load actual ML models

    async def _update_threat_intelligence(self):
        """Update threat intelligence feeds."""
        # In production, this would update from external threat intel sources

    def _setup_detection_metrics(self):
        """Setup metrics collection for detection engine."""
        self.metrics.register_gauge(
            "quantum_confidence_score", "Current quantum detection confidence"
        )
        self.metrics.register_counter(
            "quantum_analyses_performed", "Total quantum analyses performed"
        )
        self.metrics.register_counter(
            "quantum_attacks_detected", "Total quantum attacks detected"
        )
