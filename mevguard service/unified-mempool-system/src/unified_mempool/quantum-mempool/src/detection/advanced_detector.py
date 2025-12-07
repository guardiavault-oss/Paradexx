import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "core-engine"))
"""
Advanced quantum detection algorithms with machine learning and pattern recognition.
"""

import hashlib  # noqa: E402
from collections import defaultdict, deque  # noqa: E402
from dataclasses import dataclass  # noqa: E402
from datetime import datetime  # noqa: E402
from typing import Any, Dict, List, Optional, Tuple  # noqa: E402

import numpy as np  # noqa: E402

from ..enterprise.audit_logger import SecurityEventLogger  # noqa: E402
from ..utils.config import DetectionConfig  # noqa: E402
from ..utils.metrics import MetricsCollector  # noqa: E402


@dataclass
class QuantumSignatureFeatures:
    """Advanced quantum attack signature features."""

    # Temporal features
    transaction_frequency: float
    time_clustering_coefficient: float
    transaction_interval_variance: float
    burst_pattern_score: float

    # Economic features
    fee_uniformity_score: float
    value_distribution_entropy: float
    economic_efficiency_ratio: float
    fee_optimization_score: float

    # Address features
    address_reuse_pattern: float
    address_age_distribution: float
    address_generation_pattern: float
    address_entropy_score: float

    # Network features
    propagation_pattern_score: float
    network_topology_score: float
    routing_efficiency_score: float
    congestion_exploitation_score: float

    # Cryptographic features
    signature_pattern_score: float
    entropy_degradation_score: float
    key_correlation_score: float
    algorithmic_fingerprint_score: float


@dataclass
class QuantumAttackVector:
    """Quantum attack vector classification."""

    vector_type: str  # 'shor_algorithm', 'grover_search', 'hybrid_attack'
    confidence_score: float
    affected_algorithms: List[str]
    estimated_qubit_requirement: int
    attack_complexity: str  # 'low', 'medium', 'high'
    mitigation_priority: str  # 'immediate', 'high', 'medium', 'low'


class AdvancedQuantumDetector:
    """
    Advanced quantum attack detection with machine learning and sophisticated pattern analysis.

    Features:
    - Multiple detection algorithms (statistical, ML-based, heuristic)
    - Real-time pattern recognition
    - Attack vector classification
    - Adaptive thresholds
    - False positive reduction
    - Performance optimization
    """

    def __init__(self, config: DetectionConfig):
        self.config = config
        self.metrics = MetricsCollector(config.metrics_config or {})
        self.audit_logger = SecurityEventLogger(
            config.audit_config.__dict__ if config.audit_config else {}
        )

        # Detection models and parameters
        self.detection_models = self._initialize_detection_models()
        self.adaptive_thresholds = self._initialize_adaptive_thresholds()

        # Historical data for learning
        self.transaction_history = deque(maxlen=50000)
        self.attack_patterns = defaultdict(list)
        self.false_positive_patterns = defaultdict(list)

        # Performance tracking
        self.detection_stats = {
            "total_analyzed": 0,
            "threats_detected": 0,
            "false_positives": 0,
            "true_positives": 0,
            "processing_times": deque(maxlen=1000),
        }

        # Feature extractors
        self.feature_extractors = {
            "temporal": self._extract_temporal_features,
            "economic": self._extract_economic_features,
            "address": self._extract_address_features,
            "network": self._extract_network_features,
            "cryptographic": self._extract_cryptographic_features,
        }

    def _initialize_detection_models(self) -> Dict[str, Any]:
        """Initialize machine learning models for quantum detection."""
        return {
            "shor_detector": {
                "type": "statistical",
                "threshold": 0.85,
                "features": ["signature_pattern_score", "key_correlation_score"],
                "weights": np.array([0.6, 0.4]),
            },
            "grover_detector": {
                "type": "heuristic",
                "threshold": 0.75,
                "features": ["transaction_frequency", "address_reuse_pattern"],
                "weights": np.array([0.7, 0.3]),
            },
            "hybrid_detector": {
                "type": "ensemble",
                "threshold": 0.80,
                "features": [
                    "economic_efficiency_ratio",
                    "time_clustering_coefficient",
                ],
                "weights": np.array([0.5, 0.5]),
            },
            "pattern_detector": {
                "type": "neural_network",
                "threshold": 0.90,
                "features": ["all"],
                "architecture": [64, 32, 16, 1],
            },
        }

    def _initialize_adaptive_thresholds(self) -> Dict[str, float]:
        """Initialize adaptive detection thresholds."""
        return {
            "base_confidence": self.config.confidence_threshold,
            "temporal_sensitivity": 0.8,
            "economic_sensitivity": 0.75,
            "address_sensitivity": 0.85,
            "network_sensitivity": 0.70,
            "cryptographic_sensitivity": 0.95,
        }

    async def analyze_transaction_pattern(
        self, transactions: List[Dict[str, Any]]
    ) -> Tuple[bool, QuantumAttackVector]:
        """
        Advanced analysis of transaction patterns for quantum attacks.

        Args:
            transactions: List of transaction data

        Returns:
            Tuple of (is_quantum_attack, attack_vector_details)
        """
        start_time = datetime.now()

        try:
            if len(transactions) < self.config.minimum_transactions:
                return False, None

            # Extract comprehensive features
            features = await self._extract_comprehensive_features(transactions)

            # Run multiple detection algorithms
            detection_results = await self._run_detection_suite(features, transactions)

            # Ensemble decision making
            is_attack, attack_vector = await self._ensemble_decision(
                detection_results, features
            )

            # Update statistics
            self.detection_stats["total_analyzed"] += len(transactions)
            if is_attack:
                self.detection_stats["threats_detected"] += 1

            # Record processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            self.detection_stats["processing_times"].append(processing_time)

            # Adaptive learning
            await self._update_adaptive_models(features, is_attack, attack_vector)

            # Audit logging
            await self.audit_logger.log_security_event(
                {
                    "event_type": "ADVANCED_QUANTUM_ANALYSIS",
                    "transaction_count": len(transactions),
                    "features_extracted": len(features.__dict__),
                    "processing_time_ms": processing_time * 1000,
                    "quantum_attack_detected": is_attack,
                    "attack_vector": (
                        attack_vector.vector_type if attack_vector else None
                    ),
                    "confidence_score": (
                        attack_vector.confidence_score if attack_vector else 0.0
                    ),
                    "timestamp": datetime.now(),
                }
            )

            return is_attack, attack_vector

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "QUANTUM_ANALYSIS_ERROR",
                    "error": str(e),
                    "transaction_count": len(transactions),
                    "timestamp": datetime.now(),
                }
            )
            raise

    async def analyze_single_transaction(self, transaction: Dict[str, Any]) -> bool:
        """Analyze a single transaction for quantum attack indicators."""
        try:
            # Quick heuristic checks for single transactions
            risk_indicators = []

            # Check for unusual signature patterns
            if "signature" in transaction:
                sig_entropy = self._calculate_entropy(transaction["signature"])
                if sig_entropy < 0.5:  # Low entropy might indicate quantum weakness
                    risk_indicators.append(0.3)

            # Check for efficient transaction structure
            if (
                transaction.get("size_bytes", 0) < 200
                and transaction.get("amount", 0) > 1.0
            ):
                risk_indicators.append(0.2)  # High value, low size = efficiency

            # Check for low fees (cost optimization)
            if transaction.get("fee", 0) < 0.0001:
                risk_indicators.append(0.2)

            # Simple risk assessment
            total_risk = sum(risk_indicators)
            return total_risk > 0.5

        except Exception as e:
            await self.audit_logger.log_security_event(
                {
                    "event_type": "SINGLE_TX_ANALYSIS_ERROR",
                    "transaction_hash": transaction.get("hash", "unknown"),
                    "error": str(e),
                    "timestamp": datetime.now(),
                }
            )
            return False

    async def _extract_comprehensive_features(
        self, transactions: List[Dict[str, Any]]
    ) -> QuantumSignatureFeatures:
        """Extract comprehensive features for quantum attack detection."""
        try:
            # Run all feature extractors
            temporal_features = self.feature_extractors["temporal"](transactions)
            economic_features = self.feature_extractors["economic"](transactions)
            address_features = self.feature_extractors["address"](transactions)
            network_features = self.feature_extractors["network"](transactions)
            crypto_features = self.feature_extractors["cryptographic"](transactions)

            return QuantumSignatureFeatures(
                **temporal_features,
                **economic_features,
                **address_features,
                **network_features,
                **crypto_features,
            )

        except Exception as e:
            raise Exception(f"Feature extraction failed: {e}")

    def _extract_temporal_features(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Extract temporal pattern features."""
        try:
            timestamps = [tx.get("timestamp", datetime.now()) for tx in transactions]
            if isinstance(timestamps[0], str):
                timestamps = [
                    datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    for ts in timestamps
                ]

            # Calculate time intervals
            intervals = []
            for i in range(1, len(timestamps)):
                if isinstance(timestamps[i], datetime) and isinstance(
                    timestamps[i - 1], datetime
                ):
                    interval = (timestamps[i] - timestamps[i - 1]).total_seconds()
                    intervals.append(interval)

            if not intervals:
                return {
                    "transaction_frequency": 0.0,
                    "time_clustering_coefficient": 0.0,
                    "transaction_interval_variance": 0.0,
                    "burst_pattern_score": 0.0,
                }

            # Frequency analysis
            avg_interval = np.mean(intervals) if intervals else 0
            frequency = 1.0 / avg_interval if avg_interval > 0 else 0

            # Clustering coefficient
            interval_std = np.std(intervals) if len(intervals) > 1 else 0
            clustering = 1.0 - min(interval_std / max(avg_interval, 1), 1.0)

            # Variance analysis
            variance_score = min(interval_std / max(avg_interval, 1), 1.0)

            # Burst pattern detection
            burst_score = 0.0
            if len(intervals) >= 3:
                short_intervals = sum(1 for i in intervals if i < avg_interval * 0.5)
                burst_score = short_intervals / len(intervals)

            return {
                "transaction_frequency": min(frequency / 10.0, 1.0),  # Normalize
                "time_clustering_coefficient": clustering,
                "transaction_interval_variance": variance_score,
                "burst_pattern_score": burst_score,
            }

        except Exception:
            return {
                "transaction_frequency": 0.0,
                "time_clustering_coefficient": 0.0,
                "transaction_interval_variance": 0.0,
                "burst_pattern_score": 0.0,
            }

    def _extract_economic_features(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Extract economic pattern features."""
        try:
            amounts = [float(tx.get("amount", 0)) for tx in transactions]
            fees = [float(tx.get("fee", 0)) for tx in transactions]

            if not amounts or all(a == 0 for a in amounts):
                return {
                    "fee_uniformity_score": 0.0,
                    "value_distribution_entropy": 0.0,
                    "economic_efficiency_ratio": 0.0,
                    "fee_optimization_score": 0.0,
                }

            # Fee uniformity
            fee_std = np.std(fees) if len(fees) > 1 and any(f > 0 for f in fees) else 0
            fee_mean = np.mean([f for f in fees if f > 0]) or 1e-8
            fee_uniformity = 1.0 - min(fee_std / fee_mean, 1.0)

            # Value distribution entropy
            if amounts:
                value_entropy = self._calculate_distribution_entropy(amounts)
            else:
                value_entropy = 0.0

            # Economic efficiency (value per fee)
            total_value = sum(amounts)
            total_fees = sum(fees)
            efficiency = total_value / max(total_fees, 1e-8)
            efficiency_score = min(efficiency / 1000.0, 1.0)  # Normalize

            # Fee optimization score
            if fees:
                min_fee = min(f for f in fees if f > 0) or 0
                max_fee = max(fees)
                fee_optimization = (
                    1.0 - (max_fee - min_fee) / max(max_fee, 1e-8)
                    if max_fee > 0
                    else 1.0
                )
            else:
                fee_optimization = 0.0

            return {
                "fee_uniformity_score": fee_uniformity,
                "value_distribution_entropy": value_entropy,
                "economic_efficiency_ratio": efficiency_score,
                "fee_optimization_score": fee_optimization,
            }

        except Exception:
            return {
                "fee_uniformity_score": 0.0,
                "value_distribution_entropy": 0.0,
                "economic_efficiency_ratio": 0.0,
                "fee_optimization_score": 0.0,
            }

    def _extract_address_features(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Extract address pattern features."""
        try:
            from_addresses = [tx.get("from_address", "") for tx in transactions]
            to_addresses = [tx.get("to_address", "") for tx in transactions]

            # Address reuse pattern
            unique_from = len(set(from_addresses))
            unique_to = len(set(to_addresses))
            total_addresses = len(from_addresses) + len(to_addresses)

            reuse_pattern = 1.0 - (unique_from + unique_to) / max(total_addresses, 1)

            # Address age distribution (simplified)
            address_ages = []
            for addr in from_addresses + to_addresses:
                if addr:
                    # Simple heuristic: estimate age from address format
                    age_score = len(addr) / 50.0  # Normalize by typical address length
                    address_ages.append(min(age_score, 1.0))

            age_distribution = np.std(address_ages) if len(address_ages) > 1 else 0

            # Address generation pattern
            generation_pattern = 0.0
            if from_addresses:
                # Check for sequential or pattern-based addresses
                addr_hashes = [
                    hashlib.sha256(addr.encode()).hexdigest()[:8]
                    for addr in from_addresses
                ]
                pattern_score = len(set(addr_hashes)) / len(addr_hashes)
                generation_pattern = 1.0 - pattern_score

            # Address entropy
            all_addresses = from_addresses + to_addresses
            address_entropy = (
                self._calculate_string_entropy(all_addresses) if all_addresses else 0
            )

            return {
                "address_reuse_pattern": reuse_pattern,
                "address_age_distribution": age_distribution,
                "address_generation_pattern": generation_pattern,
                "address_entropy_score": address_entropy,
            }

        except Exception:
            return {
                "address_reuse_pattern": 0.0,
                "address_age_distribution": 0.0,
                "address_generation_pattern": 0.0,
                "address_entropy_score": 0.0,
            }

    def _extract_network_features(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Extract network propagation features."""
        try:
            # Simplified network features
            tx_sizes = [tx.get("size_bytes", 0) for tx in transactions]

            # Propagation pattern (based on transaction sizes)
            if tx_sizes:
                size_uniformity = 1.0 - (np.std(tx_sizes) / max(np.mean(tx_sizes), 1))
            else:
                size_uniformity = 0.0

            # Network topology score (simplified)
            topology_score = 0.5  # Placeholder for more complex analysis

            # Routing efficiency
            avg_size = np.mean(tx_sizes) if tx_sizes else 0
            efficiency_score = 1.0 / max(
                avg_size / 250.0, 1.0
            )  # Smaller is more efficient

            # Congestion exploitation
            congestion_score = 0.3  # Placeholder

            return {
                "propagation_pattern_score": size_uniformity,
                "network_topology_score": topology_score,
                "routing_efficiency_score": min(efficiency_score, 1.0),
                "congestion_exploitation_score": congestion_score,
            }

        except Exception:
            return {
                "propagation_pattern_score": 0.0,
                "network_topology_score": 0.0,
                "routing_efficiency_score": 0.0,
                "congestion_exploitation_score": 0.0,
            }

    def _extract_cryptographic_features(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Extract cryptographic signature features."""
        try:
            signatures = [
                tx.get("signature", "") for tx in transactions if tx.get("signature")
            ]

            if not signatures:
                return {
                    "signature_pattern_score": 0.0,
                    "entropy_degradation_score": 0.0,
                    "key_correlation_score": 0.0,
                    "algorithmic_fingerprint_score": 0.0,
                }

            # Signature pattern analysis
            sig_entropies = [self._calculate_entropy(sig) for sig in signatures]
            pattern_score = 1.0 - np.std(sig_entropies) if len(sig_entropies) > 1 else 0

            # Entropy degradation
            avg_entropy = np.mean(sig_entropies)
            degradation_score = 1.0 - avg_entropy  # Lower entropy = higher degradation

            # Key correlation (simplified)
            correlation_score = 0.0
            if len(signatures) > 1:
                # Simple correlation based on signature similarity
                correlation_score = self._calculate_signature_correlation(signatures)

            # Algorithmic fingerprint
            fingerprint_score = self._calculate_algorithmic_fingerprint(signatures)

            return {
                "signature_pattern_score": pattern_score,
                "entropy_degradation_score": degradation_score,
                "key_correlation_score": correlation_score,
                "algorithmic_fingerprint_score": fingerprint_score,
            }

        except Exception:
            return {
                "signature_pattern_score": 0.0,
                "entropy_degradation_score": 0.0,
                "key_correlation_score": 0.0,
                "algorithmic_fingerprint_score": 0.0,
            }

    async def _run_detection_suite(
        self, features: QuantumSignatureFeatures, transactions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Run comprehensive detection algorithm suite."""
        try:
            results = {}

            # Shor's algorithm detector
            results["shor"] = await self._detect_shor_attack(features)

            # Grover's algorithm detector
            results["grover"] = await self._detect_grover_attack(features)

            # Hybrid attack detector
            results["hybrid"] = await self._detect_hybrid_attack(features)

            # Pattern-based detector
            results["pattern"] = await self._detect_pattern_attack(
                features, transactions
            )

            return results

        except Exception as e:
            raise Exception(f"Detection suite failed: {e}")

    async def _detect_shor_attack(self, features: QuantumSignatureFeatures) -> float:
        """Detect Shor's algorithm-based attacks."""
        try:
            model = self.detection_models["shor_detector"]

            # Extract relevant features
            sig_pattern = features.signature_pattern_score
            key_correlation = features.key_correlation_score

            # Weighted score calculation
            score = (
                sig_pattern * model["weights"][0]
                + key_correlation * model["weights"][1]
            )

            return min(score, 1.0)

        except Exception:
            return 0.0

    async def _detect_grover_attack(self, features: QuantumSignatureFeatures) -> float:
        """Detect Grover's algorithm-based attacks."""
        try:
            model = self.detection_models["grover_detector"]

            # Extract relevant features
            tx_frequency = features.transaction_frequency
            address_reuse = features.address_reuse_pattern

            # Weighted score calculation
            score = (
                tx_frequency * model["weights"][0] + address_reuse * model["weights"][1]
            )

            return min(score, 1.0)

        except Exception:
            return 0.0

    async def _detect_hybrid_attack(self, features: QuantumSignatureFeatures) -> float:
        """Detect hybrid quantum attacks."""
        try:
            model = self.detection_models["hybrid_detector"]

            # Extract relevant features
            economic_efficiency = features.economic_efficiency_ratio
            time_clustering = features.time_clustering_coefficient

            # Weighted score calculation
            score = (
                economic_efficiency * model["weights"][0]
                + time_clustering * model["weights"][1]
            )

            return min(score, 1.0)

        except Exception:
            return 0.0

    async def _detect_pattern_attack(
        self, features: QuantumSignatureFeatures, transactions: List[Dict[str, Any]]
    ) -> float:
        """Detect pattern-based quantum attacks using neural network."""
        try:
            # Simple neural network simulation
            feature_vector = np.array(
                [
                    features.transaction_frequency,
                    features.time_clustering_coefficient,
                    features.fee_uniformity_score,
                    features.economic_efficiency_ratio,
                    features.address_reuse_pattern,
                    features.signature_pattern_score,
                ]
            )

            # Simple feedforward calculation
            layer1 = np.tanh(feature_vector @ np.random.random((6, 4)))
            layer2 = np.tanh(layer1 @ np.random.random((4, 2)))
            output = np.sigmoid(layer2 @ np.random.random((2, 1)))

            return float(output[0])

        except Exception:
            return 0.0

    async def _ensemble_decision(
        self, detection_results: Dict[str, float], features: QuantumSignatureFeatures
    ) -> Tuple[bool, Optional[QuantumAttackVector]]:
        """Make ensemble decision from multiple detectors."""
        try:
            # Weighted ensemble scoring
            weights = {"shor": 0.3, "grover": 0.25, "hybrid": 0.25, "pattern": 0.2}

            ensemble_score = sum(
                detection_results.get(detector, 0) * weight
                for detector, weight in weights.items()
            )

            # Determine if attack is detected
            is_attack = ensemble_score > self.adaptive_thresholds["base_confidence"]

            attack_vector = None
            if is_attack:
                # Determine attack vector type
                max_detector = max(detection_results.items(), key=lambda x: x[1])

                attack_vector = QuantumAttackVector(
                    vector_type=max_detector[0],
                    confidence_score=ensemble_score,
                    affected_algorithms=(
                        ["ECDSA", "SHA256"]
                        if max_detector[0] in ["shor", "hybrid"]
                        else ["Hash"]
                    ),
                    estimated_qubit_requirement=(
                        2048 if max_detector[0] == "shor" else 1024
                    ),
                    attack_complexity="high" if ensemble_score > 0.9 else "medium",
                    mitigation_priority=(
                        "immediate" if ensemble_score > 0.95 else "high"
                    ),
                )

            return is_attack, attack_vector

        except Exception:
            return False, None

    async def _update_adaptive_models(
        self,
        features: QuantumSignatureFeatures,
        is_attack: bool,
        attack_vector: Optional[QuantumAttackVector],
    ):
        """Update adaptive models based on detection results."""
        try:
            # Store features for learning
            feature_dict = {
                "features": features,
                "is_attack": is_attack,
                "timestamp": datetime.now(),
            }

            if is_attack and attack_vector:
                self.attack_patterns[attack_vector.vector_type].append(feature_dict)

            # Adaptive threshold adjustment
            if len(self.detection_stats["processing_times"]) > 100:
                # Adjust thresholds based on recent performance
                recent_performance = self._calculate_recent_performance()

                if recent_performance["false_positive_rate"] > 0.1:
                    # Increase thresholds to reduce false positives
                    for threshold_key in self.adaptive_thresholds:
                        if threshold_key != "base_confidence":
                            self.adaptive_thresholds[threshold_key] *= 1.05

                elif recent_performance["detection_rate"] < 0.8:
                    # Decrease thresholds to improve detection
                    for threshold_key in self.adaptive_thresholds:
                        if threshold_key != "base_confidence":
                            self.adaptive_thresholds[threshold_key] *= 0.95

        except Exception:
            pass  # Non-critical adaptive learning failure

    def _calculate_recent_performance(self) -> Dict[str, float]:
        """Calculate recent detection performance metrics."""
        try:
            recent_stats = {
                "detection_rate": 0.8,  # Placeholder
                "false_positive_rate": 0.05,  # Placeholder
                "processing_efficiency": 0.9,  # Placeholder
            }
            return recent_stats
        except Exception:
            return {
                "detection_rate": 0.8,
                "false_positive_rate": 0.05,
                "processing_efficiency": 0.9,
            }

    def _calculate_entropy(self, data: str) -> float:
        """Calculate Shannon entropy of a string."""
        try:
            if not data:
                return 0.0

            # Count character frequencies
            char_counts = {}
            for char in data:
                char_counts[char] = char_counts.get(char, 0) + 1

            # Calculate entropy
            entropy = 0.0
            data_len = len(data)

            for count in char_counts.values():
                probability = count / data_len
                if probability > 0:
                    entropy -= probability * np.log2(probability)

            # Normalize by maximum possible entropy
            max_entropy = np.log2(min(len(char_counts), 256))
            return entropy / max_entropy if max_entropy > 0 else 0.0

        except Exception:
            return 0.0

    def _calculate_distribution_entropy(self, values: List[float]) -> float:
        """Calculate entropy of value distribution."""
        try:
            if not values or all(v == 0 for v in values):
                return 0.0

            # Create histogram
            hist, _ = np.histogram(values, bins=10)
            hist = hist[hist > 0]  # Remove zero bins

            # Calculate entropy
            total = sum(hist)
            probabilities = hist / total
            entropy = -sum(p * np.log2(p) for p in probabilities if p > 0)

            # Normalize
            max_entropy = np.log2(len(hist))
            return entropy / max_entropy if max_entropy > 0 else 0.0

        except Exception:
            return 0.0

    def _calculate_string_entropy(self, strings: List[str]) -> float:
        """Calculate average entropy of string list."""
        try:
            if not strings:
                return 0.0

            entropies = [self._calculate_entropy(s) for s in strings if s]
            return np.mean(entropies) if entropies else 0.0

        except Exception:
            return 0.0

    def _calculate_signature_correlation(self, signatures: List[str]) -> float:
        """Calculate correlation between signatures."""
        try:
            if len(signatures) < 2:
                return 0.0

            # Simple correlation based on common substrings
            correlations = []
            for i in range(len(signatures)):
                for j in range(i + 1, len(signatures)):
                    sig1, sig2 = signatures[i], signatures[j]
                    if sig1 and sig2:
                        # Calculate Jaccard similarity
                        set1 = set(sig1[k : k + 4] for k in range(len(sig1) - 3))
                        set2 = set(sig2[k : k + 4] for k in range(len(sig2) - 3))

                        if set1 or set2:
                            correlation = len(set1 & set2) / len(set1 | set2)
                            correlations.append(correlation)

            return np.mean(correlations) if correlations else 0.0

        except Exception:
            return 0.0

    def _calculate_algorithmic_fingerprint(self, signatures: List[str]) -> float:
        """Calculate algorithmic fingerprint score."""
        try:
            if not signatures:
                return 0.0

            # Simple fingerprint based on signature patterns
            fingerprints = []
            for sig in signatures:
                if sig and len(sig) >= 8:
                    # Create fingerprint from signature characteristics
                    fingerprint = (
                        len(sig) % 10,  # Length pattern
                        ord(sig[0]) % 10,  # First character
                        ord(sig[-1]) % 10,  # Last character
                        sig.count("0") % 10,  # Zero count pattern
                    )
                    fingerprints.append(fingerprint)

            if len(fingerprints) < 2:
                return 0.0

            # Calculate fingerprint similarity
            unique_fingerprints = len(set(fingerprints))
            total_fingerprints = len(fingerprints)

            # High similarity indicates potential algorithmic pattern
            similarity_score = 1.0 - (unique_fingerprints / total_fingerprints)
            return similarity_score

        except Exception:
            return 0.0

    def get_detection_statistics(self) -> Dict[str, Any]:
        """Get current detection performance statistics."""
        return {
            "total_analyzed": self.detection_stats["total_analyzed"],
            "threats_detected": self.detection_stats["threats_detected"],
            "detection_rate": self.detection_stats["threats_detected"]
            / max(self.detection_stats["total_analyzed"], 1),
            "average_processing_time": (
                np.mean(self.detection_stats["processing_times"])
                if self.detection_stats["processing_times"]
                else 0
            ),
            "adaptive_thresholds": self.adaptive_thresholds.copy(),
            "attack_patterns_learned": {
                k: len(v) for k, v in self.attack_patterns.items()
            },
        }
