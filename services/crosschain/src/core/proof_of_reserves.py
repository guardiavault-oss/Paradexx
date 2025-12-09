#!/usr/bin/env python3
"""
Proof of Reserves Monitor - Guardian quorum diversity scoring and reserve verification
"""

import logging
import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class GuardianStatus(str, Enum):
    """Guardian status types"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    COMPROMISED = "compromised"
    UNKNOWN = "unknown"


class ReserveStatus(str, Enum):
    """Reserve verification status"""

    VERIFIED = "verified"
    DISCREPANCY = "discrepancy"
    INSUFFICIENT = "insufficient"
    PENDING = "pending"
    FAILED = "failed"


class DiversityMetric(str, Enum):
    """Diversity metrics for guardian quorum"""

    GEOGRAPHIC = "geographic"
    INSTITUTIONAL = "institutional"
    TECHNICAL = "technical"
    REPUTATIONAL = "reputational"
    ECONOMIC = "economic"


@dataclass
class Guardian:
    """Guardian information and metrics"""

    address: str
    name: str
    status: GuardianStatus
    reputation_score: float
    stake_amount: float
    geographic_region: str
    institutional_type: str
    technical_expertise: list[str]
    last_activity: datetime
    attestation_count: int
    accuracy_rate: float
    response_time_avg: float
    diversity_scores: dict[DiversityMetric, float]
    metadata: dict[str, Any]


@dataclass
class ReserveProof:
    """Proof of reserves verification"""

    bridge_address: str
    network: str
    total_reserves: float
    verified_reserves: float
    discrepancy_amount: float
    verification_timestamp: datetime
    status: ReserveStatus
    verification_method: str
    guardian_consensus: int
    required_consensus: int
    evidence: dict[str, Any]
    confidence_score: float


@dataclass
class QuorumDiversityScore:
    """Quorum diversity scoring result"""

    bridge_address: str
    timestamp: datetime
    overall_diversity_score: float
    geographic_diversity: float
    institutional_diversity: float
    technical_diversity: float
    reputational_diversity: float
    economic_diversity: float
    active_guardians: int
    total_guardians: int
    diversity_breakdown: dict[str, Any]
    recommendations: list[str]


class ProofOfReservesMonitor:
    """Proof of reserves monitoring and guardian quorum diversity analysis"""

    def __init__(self):
        self.guardians: dict[str, Guardian] = {}
        self.reserve_proofs: list[ReserveProof] = []
        self.diversity_scores: list[QuorumDiversityScore] = []
        self.attestation_history: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.consensus_requirements: dict[str, int] = {}

        # Configuration
        self.diversity_weights = {
            DiversityMetric.GEOGRAPHIC: 0.25,
            DiversityMetric.INSTITUTIONAL: 0.20,
            DiversityMetric.TECHNICAL: 0.20,
            DiversityMetric.REPUTATIONAL: 0.20,
            DiversityMetric.ECONOMIC: 0.15,
        }

        self.consensus_thresholds = {
            "minimum_guardians": 3,
            "consensus_percentage": 0.67,
            "diversity_threshold": 0.6,
            "reputation_threshold": 0.7,
        }

        logger.info("ProofOfReservesMonitor initialized")

    async def register_guardian(self, guardian_data: dict[str, Any]) -> Guardian:
        """Register a new guardian"""
        guardian = Guardian(
            address=guardian_data["address"],
            name=guardian_data["name"],
            status=GuardianStatus(guardian_data.get("status", "active")),
            reputation_score=guardian_data.get("reputation_score", 0.5),
            stake_amount=guardian_data.get("stake_amount", 0.0),
            geographic_region=guardian_data.get("geographic_region", "unknown"),
            institutional_type=guardian_data.get("institutional_type", "individual"),
            technical_expertise=guardian_data.get("technical_expertise", []),
            last_activity=datetime.utcnow(),
            attestation_count=0,
            accuracy_rate=1.0,
            response_time_avg=0.0,
            diversity_scores={},
            metadata=guardian_data.get("metadata", {}),
        )

        # Calculate initial diversity scores
        await self._calculate_guardian_diversity_scores(guardian)

        self.guardians[guardian.address] = guardian
        logger.info(f"Registered guardian: {guardian.name} ({guardian.address})")

        return guardian

    async def _calculate_guardian_diversity_scores(self, guardian: Guardian):
        """Calculate diversity scores for a guardian"""
        # Geographic diversity (based on region distribution)
        regions = [
            g.geographic_region for g in self.guardians.values() if g.address != guardian.address
        ]
        if regions:
            region_count = len(set(regions))
            total_guardians = len(regions)
            guardian.diversity_scores[DiversityMetric.GEOGRAPHIC] = min(
                region_count / max(total_guardians, 1), 1.0
            )
        else:
            guardian.diversity_scores[DiversityMetric.GEOGRAPHIC] = 1.0

        # Institutional diversity
        institutional_types = [
            g.institutional_type for g in self.guardians.values() if g.address != guardian.address
        ]
        if institutional_types:
            type_count = len(set(institutional_types))
            total_guardians = len(institutional_types)
            guardian.diversity_scores[DiversityMetric.INSTITUTIONAL] = min(
                type_count / max(total_guardians, 1), 1.0
            )
        else:
            guardian.diversity_scores[DiversityMetric.INSTITUTIONAL] = 1.0

        # Technical diversity (based on expertise overlap)
        all_expertise = []
        for g in self.guardians.values():
            if g.address != guardian.address:
                all_expertise.extend(g.technical_expertise)

        if all_expertise:
            unique_expertise = len(set(all_expertise))
            total_expertise = len(all_expertise)
            guardian.diversity_scores[DiversityMetric.TECHNICAL] = min(
                unique_expertise / max(total_expertise, 1), 1.0
            )
        else:
            guardian.diversity_scores[DiversityMetric.TECHNICAL] = 1.0

        # Reputational diversity (based on reputation score distribution)
        reputation_scores = [
            g.reputation_score for g in self.guardians.values() if g.address != guardian.address
        ]
        if reputation_scores:
            score_variance = (
                statistics.variance(reputation_scores) if len(reputation_scores) > 1 else 0
            )
            guardian.diversity_scores[DiversityMetric.REPUTATIONAL] = min(
                score_variance * 4, 1.0
            )  # Scale variance
        else:
            guardian.diversity_scores[DiversityMetric.REPUTATIONAL] = 1.0

        # Economic diversity (based on stake distribution)
        stake_amounts = [
            g.stake_amount for g in self.guardians.values() if g.address != guardian.address
        ]
        if stake_amounts:
            stake_variance = statistics.variance(stake_amounts) if len(stake_amounts) > 1 else 0
            max_stake = max(stake_amounts) if stake_amounts else 1
            guardian.diversity_scores[DiversityMetric.ECONOMIC] = min(
                stake_variance / (max_stake**2), 1.0
            )
        else:
            guardian.diversity_scores[DiversityMetric.ECONOMIC] = 1.0

    async def update_guardian_activity(
        self, guardian_address: str, attestation_data: dict[str, Any]
    ):
        """Update guardian activity and performance metrics"""
        if guardian_address not in self.guardians:
            logger.warning(f"Guardian {guardian_address} not found")
            return

        guardian = self.guardians[guardian_address]

        # Update activity
        guardian.last_activity = datetime.utcnow()
        guardian.attestation_count += 1

        # Update accuracy rate
        is_correct = attestation_data.get("is_correct", True)
        if guardian.attestation_count == 1:
            guardian.accuracy_rate = 1.0 if is_correct else 0.0
        else:
            # Exponential moving average
            alpha = 0.1
            guardian.accuracy_rate = (
                alpha * (1.0 if is_correct else 0.0) + (1 - alpha) * guardian.accuracy_rate
            )

        # Update response time
        response_time = attestation_data.get("response_time", 0.0)
        if guardian.response_time_avg == 0.0:
            guardian.response_time_avg = response_time
        else:
            # Exponential moving average
            alpha = 0.1
            guardian.response_time_avg = (
                alpha * response_time + (1 - alpha) * guardian.response_time_avg
            )

        # Store attestation history
        self.attestation_history[guardian_address].append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "is_correct": is_correct,
                "response_time": response_time,
                "bridge_address": attestation_data.get("bridge_address"),
                "metadata": attestation_data.get("metadata", {}),
            }
        )

        # Keep only recent history (last 1000 attestations)
        if len(self.attestation_history[guardian_address]) > 1000:
            self.attestation_history[guardian_address] = self.attestation_history[guardian_address][
                -1000:
            ]

    async def verify_reserves(
        self, bridge_address: str, network: str, verification_data: dict[str, Any]
    ) -> ReserveProof:
        """Verify proof of reserves for a bridge"""
        logger.info(f"Verifying reserves for bridge {bridge_address} on {network}")

        # Get active guardians for this bridge
        active_guardians = [
            g
            for g in self.guardians.values()
            if g.status == GuardianStatus.ACTIVE
            and g.reputation_score >= self.consensus_thresholds["reputation_threshold"]
        ]

        if len(active_guardians) < self.consensus_thresholds["minimum_guardians"]:
            return ReserveProof(
                bridge_address=bridge_address,
                network=network,
                total_reserves=0.0,
                verified_reserves=0.0,
                discrepancy_amount=0.0,
                verification_timestamp=datetime.utcnow(),
                status=ReserveStatus.FAILED,
                verification_method="insufficient_guardians",
                guardian_consensus=0,
                required_consensus=len(active_guardians),
                evidence={"error": "Insufficient active guardians"},
                confidence_score=0.0,
            )

        # Simulate guardian verification (in production, this would be actual verification)
        total_reserves = verification_data.get("total_reserves", 0.0)
        guardian_verifications = []

        for guardian in active_guardians:
            # Simulate verification result based on guardian accuracy
            verification_confidence = guardian.accuracy_rate * guardian.reputation_score
            verified_amount = total_reserves * (
                0.95 + 0.1 * verification_confidence
            )  # ±5% variation

            guardian_verifications.append(
                {
                    "guardian_address": guardian.address,
                    "verified_amount": verified_amount,
                    "confidence": verification_confidence,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )

        # Calculate consensus
        verified_amounts = [v["verified_amount"] for v in guardian_verifications]
        median_verified = statistics.median(verified_amounts)

        # Count guardians within 5% of median
        consensus_threshold = median_verified * 0.05
        consensus_count = sum(
            1 for amount in verified_amounts if abs(amount - median_verified) <= consensus_threshold
        )

        required_consensus = max(
            1, int(len(active_guardians) * self.consensus_thresholds["consensus_percentage"])
        )

        # Determine status
        if consensus_count >= required_consensus:
            status = ReserveStatus.VERIFIED
            verified_reserves = median_verified
            discrepancy_amount = abs(total_reserves - verified_reserves)
        else:
            status = ReserveStatus.DISCREPANCY
            verified_reserves = median_verified
            discrepancy_amount = abs(total_reserves - verified_reserves)

        # Calculate confidence score
        confidence_score = min(consensus_count / len(active_guardians), 1.0)

        reserve_proof = ReserveProof(
            bridge_address=bridge_address,
            network=network,
            total_reserves=total_reserves,
            verified_reserves=verified_reserves,
            discrepancy_amount=discrepancy_amount,
            verification_timestamp=datetime.utcnow(),
            status=status,
            verification_method="guardian_consensus",
            guardian_consensus=consensus_count,
            required_consensus=required_consensus,
            evidence={
                "guardian_verifications": guardian_verifications,
                "median_verified": median_verified,
                "consensus_threshold": consensus_threshold,
            },
            confidence_score=confidence_score,
        )

        self.reserve_proofs.append(reserve_proof)
        return reserve_proof

    async def calculate_quorum_diversity(self, bridge_address: str) -> QuorumDiversityScore:
        """Calculate quorum diversity score for a bridge"""
        # Get active guardians
        active_guardians = [g for g in self.guardians.values() if g.status == GuardianStatus.ACTIVE]

        if not active_guardians:
            return QuorumDiversityScore(
                bridge_address=bridge_address,
                timestamp=datetime.utcnow(),
                overall_diversity_score=0.0,
                geographic_diversity=0.0,
                institutional_diversity=0.0,
                technical_diversity=0.0,
                reputational_diversity=0.0,
                economic_diversity=0.0,
                active_guardians=0,
                total_guardians=len(self.guardians),
                diversity_breakdown={},
                recommendations=["No active guardians found"],
            )

        # Calculate individual diversity metrics
        geographic_diversity = self._calculate_geographic_diversity(active_guardians)
        institutional_diversity = self._calculate_institutional_diversity(active_guardians)
        technical_diversity = self._calculate_technical_diversity(active_guardians)
        reputational_diversity = self._calculate_reputational_diversity(active_guardians)
        economic_diversity = self._calculate_economic_diversity(active_guardians)

        # Calculate weighted overall score
        overall_score = (
            geographic_diversity * self.diversity_weights[DiversityMetric.GEOGRAPHIC]
            + institutional_diversity * self.diversity_weights[DiversityMetric.INSTITUTIONAL]
            + technical_diversity * self.diversity_weights[DiversityMetric.TECHNICAL]
            + reputational_diversity * self.diversity_weights[DiversityMetric.REPUTATIONAL]
            + economic_diversity * self.diversity_weights[DiversityMetric.ECONOMIC]
        )

        # Generate recommendations
        recommendations = self._generate_diversity_recommendations(
            geographic_diversity,
            institutional_diversity,
            technical_diversity,
            reputational_diversity,
            economic_diversity,
            active_guardians,
        )

        diversity_score = QuorumDiversityScore(
            bridge_address=bridge_address,
            timestamp=datetime.utcnow(),
            overall_diversity_score=overall_score,
            geographic_diversity=geographic_diversity,
            institutional_diversity=institutional_diversity,
            technical_diversity=technical_diversity,
            reputational_diversity=reputational_diversity,
            economic_diversity=economic_diversity,
            active_guardians=len(active_guardians),
            total_guardians=len(self.guardians),
            diversity_breakdown={
                "geographic_regions": len(set(g.geographic_region for g in active_guardians)),
                "institutional_types": len(set(g.institutional_type for g in active_guardians)),
                "technical_expertise": len(
                    set(expertise for g in active_guardians for expertise in g.technical_expertise)
                ),
                "reputation_range": {
                    "min": min(g.reputation_score for g in active_guardians),
                    "max": max(g.reputation_score for g in active_guardians),
                    "std": (
                        statistics.stdev([g.reputation_score for g in active_guardians])
                        if len(active_guardians) > 1
                        else 0
                    ),
                },
                "stake_distribution": {
                    "min": min(g.stake_amount for g in active_guardians),
                    "max": max(g.stake_amount for g in active_guardians),
                    "std": (
                        statistics.stdev([g.stake_amount for g in active_guardians])
                        if len(active_guardians) > 1
                        else 0
                    ),
                },
            },
            recommendations=recommendations,
        )

        self.diversity_scores.append(diversity_score)
        return diversity_score

    def _calculate_geographic_diversity(self, guardians: list[Guardian]) -> float:
        """Calculate geographic diversity score"""
        regions = [g.geographic_region for g in guardians]
        unique_regions = len(set(regions))
        total_guardians = len(guardians)

        if total_guardians <= 1:
            return 0.0

        # Normalize by expected diversity (more guardians should have more regions)
        expected_diversity = min(unique_regions / total_guardians, 1.0)
        return expected_diversity

    def _calculate_institutional_diversity(self, guardians: list[Guardian]) -> float:
        """Calculate institutional diversity score"""
        institutional_types = [g.institutional_type for g in guardians]
        unique_types = len(set(institutional_types))
        total_guardians = len(guardians)

        if total_guardians <= 1:
            return 0.0

        return min(unique_types / total_guardians, 1.0)

    def _calculate_technical_diversity(self, guardians: list[Guardian]) -> float:
        """Calculate technical diversity score"""
        all_expertise = []
        for g in guardians:
            all_expertise.extend(g.technical_expertise)

        if not all_expertise:
            return 0.0

        unique_expertise = len(set(all_expertise))
        total_expertise = len(all_expertise)

        return min(unique_expertise / total_expertise, 1.0)

    def _calculate_reputational_diversity(self, guardians: list[Guardian]) -> float:
        """Calculate reputational diversity score"""
        reputation_scores = [g.reputation_score for g in guardians]

        if len(reputation_scores) <= 1:
            return 0.0

        # Calculate coefficient of variation
        mean_reputation = statistics.mean(reputation_scores)
        if mean_reputation == 0:
            return 0.0

        std_reputation = statistics.stdev(reputation_scores)
        cv = std_reputation / mean_reputation

        # Normalize to 0-1 range (higher variation = higher diversity)
        return min(cv, 1.0)

    def _calculate_economic_diversity(self, guardians: list[Guardian]) -> float:
        """Calculate economic diversity score"""
        stake_amounts = [g.stake_amount for g in guardians]

        if len(stake_amounts) <= 1 or max(stake_amounts) == 0:
            return 0.0

        # Calculate Gini coefficient (simplified)
        sorted_stakes = sorted(stake_amounts)
        n = len(sorted_stakes)
        total = sum(sorted_stakes)

        if total == 0:
            return 0.0

        gini = 0.0
        for i, stake in enumerate(sorted_stakes):
            gini += (2 * (i + 1) - n - 1) * stake

        gini = gini / (n * total)

        # Convert to diversity score (1 - gini)
        return 1.0 - gini

    def _generate_diversity_recommendations(
        self,
        geo_diversity: float,
        inst_diversity: float,
        tech_diversity: float,
        rep_diversity: float,
        econ_diversity: float,
        guardians: list[Guardian],
    ) -> list[str]:
        """Generate recommendations for improving diversity"""
        recommendations = []

        if geo_diversity < 0.5:
            recommendations.append(
                "Increase geographic diversity by recruiting guardians from different regions"
            )

        if inst_diversity < 0.5:
            recommendations.append(
                "Improve institutional diversity by including different types of organizations"
            )

        if tech_diversity < 0.5:
            recommendations.append(
                "Enhance technical diversity by recruiting guardians with varied expertise"
            )

        if rep_diversity < 0.3:
            recommendations.append(
                "Improve reputational diversity by including guardians with different reputation levels"
            )

        if econ_diversity < 0.5:
            recommendations.append(
                "Increase economic diversity by including guardians with varied stake amounts"
            )

        if len(guardians) < 5:
            recommendations.append(
                "Consider increasing the number of active guardians for better decentralization"
            )

        if not recommendations:
            recommendations.append("Guardian quorum diversity is well-balanced")

        return recommendations

    async def get_guardian_performance(self, guardian_address: str) -> dict[str, Any]:
        """Get detailed performance metrics for a guardian"""
        if guardian_address not in self.guardians:
            return {"error": "Guardian not found"}

        guardian = self.guardians[guardian_address]
        history = self.attestation_history[guardian_address]

        # Calculate recent performance (last 30 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=30)
        recent_history = [
            h for h in history if datetime.fromisoformat(h["timestamp"]) > recent_cutoff
        ]

        recent_accuracy = 0.0
        if recent_history:
            recent_accuracy = sum(1 for h in recent_history if h["is_correct"]) / len(
                recent_history
            )

        return {
            "guardian_address": guardian_address,
            "name": guardian.name,
            "status": guardian.status.value,
            "reputation_score": guardian.reputation_score,
            "stake_amount": guardian.stake_amount,
            "total_attestations": guardian.attestation_count,
            "accuracy_rate": guardian.accuracy_rate,
            "recent_accuracy": recent_accuracy,
            "response_time_avg": guardian.response_time_avg,
            "last_activity": guardian.last_activity.isoformat(),
            "diversity_scores": {k.value: v for k, v in guardian.diversity_scores.items()},
            "geographic_region": guardian.geographic_region,
            "institutional_type": guardian.institutional_type,
            "technical_expertise": guardian.technical_expertise,
        }

    async def get_reserve_verification_history(
        self, bridge_address: str = None, days: int = 30
    ) -> list[dict[str, Any]]:
        """Get reserve verification history"""
        cutoff_time = datetime.utcnow() - timedelta(days=days)

        filtered_proofs = [
            proof
            for proof in self.reserve_proofs
            if (bridge_address is None or proof.bridge_address == bridge_address)
            and proof.verification_timestamp > cutoff_time
        ]

        return [
            {
                "bridge_address": proof.bridge_address,
                "network": proof.network,
                "total_reserves": proof.total_reserves,
                "verified_reserves": proof.verified_reserves,
                "discrepancy_amount": proof.discrepancy_amount,
                "status": proof.status.value,
                "verification_timestamp": proof.verification_timestamp.isoformat(),
                "guardian_consensus": proof.guardian_consensus,
                "required_consensus": proof.required_consensus,
                "confidence_score": proof.confidence_score,
                "evidence": proof.evidence,
            }
            for proof in sorted(
                filtered_proofs, key=lambda x: x.verification_timestamp, reverse=True
            )
        ]

    async def get_quorum_health_summary(self) -> dict[str, Any]:
        """Get overall quorum health summary"""
        active_guardians = [g for g in self.guardians.values() if g.status == GuardianStatus.ACTIVE]

        if not active_guardians:
            return {
                "status": "critical",
                "message": "No active guardians",
                "active_guardians": 0,
                "total_guardians": len(self.guardians),
                "diversity_score": 0.0,
            }

        # Calculate average diversity scores
        avg_geo_diversity = statistics.mean(
            [g.diversity_scores.get(DiversityMetric.GEOGRAPHIC, 0) for g in active_guardians]
        )
        avg_inst_diversity = statistics.mean(
            [g.diversity_scores.get(DiversityMetric.INSTITUTIONAL, 0) for g in active_guardians]
        )
        avg_tech_diversity = statistics.mean(
            [g.diversity_scores.get(DiversityMetric.TECHNICAL, 0) for g in active_guardians]
        )
        avg_rep_diversity = statistics.mean(
            [g.diversity_scores.get(DiversityMetric.REPUTATIONAL, 0) for g in active_guardians]
        )
        avg_econ_diversity = statistics.mean(
            [g.diversity_scores.get(DiversityMetric.ECONOMIC, 0) for g in active_guardians]
        )

        overall_diversity = (
            avg_geo_diversity * self.diversity_weights[DiversityMetric.GEOGRAPHIC]
            + avg_inst_diversity * self.diversity_weights[DiversityMetric.INSTITUTIONAL]
            + avg_tech_diversity * self.diversity_weights[DiversityMetric.TECHNICAL]
            + avg_rep_diversity * self.diversity_weights[DiversityMetric.REPUTATIONAL]
            + avg_econ_diversity * self.diversity_weights[DiversityMetric.ECONOMIC]
        )

        # Determine status
        if overall_diversity >= 0.8 and len(active_guardians) >= 5:
            status = "excellent"
        elif overall_diversity >= 0.6 and len(active_guardians) >= 3:
            status = "good"
        elif overall_diversity >= 0.4:
            status = "fair"
        else:
            status = "poor"

        return {
            "status": status,
            "active_guardians": len(active_guardians),
            "total_guardians": len(self.guardians),
            "overall_diversity_score": overall_diversity,
            "diversity_breakdown": {
                "geographic": avg_geo_diversity,
                "institutional": avg_inst_diversity,
                "technical": avg_tech_diversity,
                "reputational": avg_rep_diversity,
                "economic": avg_econ_diversity,
            },
            "average_reputation": statistics.mean([g.reputation_score for g in active_guardians]),
            "average_accuracy": statistics.mean([g.accuracy_rate for g in active_guardians]),
            "average_response_time": statistics.mean(
                [g.response_time_avg for g in active_guardians]
            ),
        }
