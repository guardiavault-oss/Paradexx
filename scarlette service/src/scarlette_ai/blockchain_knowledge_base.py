"""
Blockchain Knowledge Base for Scarlette AI Service
Provides domain-specific knowledge for blockchain security and estate planning.
"""

import json
import logging
from typing import Any

import redis.asyncio as redis

logger = logging.getLogger(__name__)

WILL_PLANNING_KNOWLEDGE = {
    "templates": {
        "standard": {
            "name": "Standard Will",
            "description": "Simple asset distribution to beneficiaries",
            "best_for": ["Single beneficiaries", "Simple estates", "Direct inheritance"],
            "allocation_tips": [
                "Consider equal splits for fairness",
                "Primary beneficiaries typically receive 60-80%",
                "Keep 5-10% for contingencies"
            ],
            "conditions": ["Time-lock release", "Age milestone", "Guardian approval"],
            "security_level": "basic"
        },
        "trust-fund": {
            "name": "Trust Fund",
            "description": "Structured release with guardian oversight",
            "best_for": ["Minor beneficiaries", "Large estates", "Multi-generational wealth"],
            "allocation_tips": [
                "Use vesting schedules for minors",
                "Consider 25/25/25/25 split at ages 18/21/25/30",
                "Appoint at least 2 guardians for oversight"
            ],
            "conditions": ["Age milestone", "Educational achievement", "Guardian multi-sig"],
            "security_level": "high"
        },
        "charitable": {
            "name": "Charitable Will",
            "description": "Includes charitable donations alongside beneficiaries",
            "best_for": ["Philanthropic goals", "Tax optimization", "Legacy giving"],
            "allocation_tips": [
                "10-30% to charity is typical",
                "Consider DAFs for tax benefits",
                "Split between multiple causes for impact"
            ],
            "conditions": ["Charity verification", "Immediate release", "Annual distributions"],
            "security_level": "medium"
        },
        "business": {
            "name": "Business Succession",
            "description": "Complex distributions for business assets",
            "best_for": ["Business owners", "Partnership stakes", "Corporate governance"],
            "allocation_tips": [
                "Separate business and personal assets",
                "Consider voting rights transfer",
                "Include buyout clauses for partners"
            ],
            "conditions": ["Business continuity clause", "Partner approval", "Vesting schedules"],
            "security_level": "high"
        },
        "multi-chain": {
            "name": "Multi-Chain Will",
            "description": "Cross-chain asset distribution",
            "best_for": ["DeFi portfolios", "Multi-chain holdings", "NFT collections"],
            "allocation_tips": [
                "Group assets by chain for efficiency",
                "Consider gas costs for each chain",
                "Use bridge-compatible solutions"
            ],
            "conditions": ["Chain-specific conditions", "Bridge verification", "Multi-sig across chains"],
            "security_level": "expert"
        },
        "conditional": {
            "name": "Conditional Release",
            "description": "Milestone-based distributions",
            "best_for": ["Educational goals", "Career milestones", "Behavior incentives"],
            "allocation_tips": [
                "Define clear, verifiable conditions",
                "Include fallback beneficiaries",
                "Set realistic timelines"
            ],
            "conditions": ["Oracle verification", "Third-party attestation", "Time-lock combinations"],
            "security_level": "advanced"
        }
    },
    "allocation_strategies": {
        "equal_split": {
            "description": "Equal distribution among all beneficiaries",
            "formula": "100% / number_of_beneficiaries",
            "pros": ["Fair", "Simple", "No disputes"],
            "cons": ["May not reflect relationships", "Ignores individual needs"]
        },
        "need_based": {
            "description": "Distribution based on beneficiary needs",
            "formula": "Custom based on circumstances",
            "pros": ["Addresses individual situations", "More equitable"],
            "cons": ["Subjective", "May cause disputes"]
        },
        "tiered": {
            "description": "Primary and secondary beneficiary tiers",
            "formula": "Primary: 60-70%, Secondary: 20-30%, Contingency: 10%",
            "pros": ["Clear hierarchy", "Protects key beneficiaries"],
            "cons": ["May seem unfair to secondary"]
        }
    },
    "security_recommendations": {
        "basic": [
            "Use hardware wallet for signing",
            "Enable 2FA on all accounts",
            "Store recovery phrases securely"
        ],
        "medium": [
            "Implement multi-sig requirements",
            "Regular security audits",
            "Time-lock for major changes"
        ],
        "high": [
            "Social recovery system",
            "Dead man's switch mechanism",
            "Regular check-in requirements"
        ],
        "expert": [
            "Threshold signatures",
            "Cross-chain verification",
            "Zero-knowledge proofs for privacy"
        ]
    },
    "common_conditions": [
        {
            "type": "age_milestone",
            "description": "Release when beneficiary reaches specified age",
            "parameters": ["target_age"],
            "verification": "Oracle or guardian attestation"
        },
        {
            "type": "time_based",
            "description": "Release after specific date or period",
            "parameters": ["release_date", "waiting_period"],
            "verification": "Block timestamp"
        },
        {
            "type": "guardian_approval",
            "description": "Requires signature from designated guardians",
            "parameters": ["guardian_addresses", "threshold"],
            "verification": "Multi-sig"
        },
        {
            "type": "vesting",
            "description": "Gradual release over time",
            "parameters": ["cliff_period", "vesting_period", "release_frequency"],
            "verification": "Smart contract"
        },
        {
            "type": "achievement",
            "description": "Release upon verified milestone completion",
            "parameters": ["milestone_type", "verification_method"],
            "verification": "Oracle or third-party"
        }
    ]
}


class BlockchainKnowledgeBase:
    """
    Knowledge base for blockchain security and estate planning.
    Provides domain-specific context for AI responses.
    """

    def __init__(self, redis_client: redis.Redis | None = None):
        self.redis_client = redis_client
        self.knowledge = WILL_PLANNING_KNOWLEDGE
        self._initialized = False

    async def initialize(self):
        """Initialize the knowledge base."""
        logger.info("Initializing Blockchain Knowledge Base...")

        if self.redis_client:
            try:
                await self.redis_client.ping()
                await self._cache_knowledge()
                logger.info("Knowledge base cached in Redis")
            except Exception as e:
                logger.warning(f"Redis not available for caching: {e}")

        self._initialized = True
        logger.info("Blockchain Knowledge Base initialized")

    async def _cache_knowledge(self):
        """Cache knowledge base in Redis for faster access."""
        if not self.redis_client:
            return

        try:
            await self.redis_client.set(
                "knowledge:will_planning",
                json.dumps(self.knowledge),
                ex=3600
            )
        except Exception as e:
            logger.exception(f"Failed to cache knowledge: {e}")

    async def query_knowledge(
        self,
        query: str,
        blockchain: str = "ethereum",
        limit: int = 5
    ) -> list[dict[str, Any]]:
        """Query the knowledge base for relevant information."""
        results = []
        query_lower = query.lower()

        if any(word in query_lower for word in ["will", "inheritance", "estate", "beneficiary"]):
            for template_id, template in self.knowledge["templates"].items():
                if any(word in query_lower for word in [template_id, template["name"].lower()]):
                    results.append({
                        "type": "template",
                        "id": template_id,
                        "content": template["description"],
                        "data": template
                    })

        if any(word in query_lower for word in ["allocation", "split", "distribute"]):
            for strategy_id, strategy in self.knowledge["allocation_strategies"].items():
                results.append({
                    "type": "allocation_strategy",
                    "id": strategy_id,
                    "content": strategy["description"],
                    "data": strategy
                })

        if any(word in query_lower for word in ["condition", "release", "trigger"]):
            for condition in self.knowledge["common_conditions"]:
                if condition["type"] in query_lower or any(word in query_lower for word in condition["description"].lower().split()):
                    results.append({
                        "type": "condition",
                        "id": condition["type"],
                        "content": condition["description"],
                        "data": condition
                    })

        return results[:limit]

    async def get_template_recommendations(
        self,
        portfolio_value: float | None = None,
        num_beneficiaries: int = 1,
        has_minors: bool = False,
        has_charity: bool = False,
        has_business: bool = False,
        multi_chain: bool = False
    ) -> list[dict[str, Any]]:
        """Get template recommendations based on user situation."""
        recommendations = []

        if has_business:
            recommendations.append({
                "template_id": "business",
                "score": 0.95,
                "reason": "Recommended for business asset succession"
            })

        if has_minors:
            recommendations.append({
                "template_id": "trust-fund",
                "score": 0.90,
                "reason": "Trust fund structure protects minor beneficiaries"
            })

        if has_charity:
            recommendations.append({
                "template_id": "charitable",
                "score": 0.85,
                "reason": "Includes structured charitable giving"
            })

        if multi_chain:
            recommendations.append({
                "template_id": "multi-chain",
                "score": 0.80,
                "reason": "Optimized for cross-chain asset distribution"
            })

        if not recommendations:
            recommendations.append({
                "template_id": "standard",
                "score": 0.75,
                "reason": "Simple and effective for most situations"
            })

        return sorted(recommendations, key=lambda x: x["score"], reverse=True)

    async def get_allocation_suggestions(
        self,
        template_id: str,
        num_beneficiaries: int,
        beneficiary_types: list[str] | None = None
    ) -> dict[str, Any]:
        """Get allocation suggestions based on template and beneficiaries."""
        template = self.knowledge["templates"].get(template_id, {})
        tips = template.get("allocation_tips", [])

        if num_beneficiaries == 1:
            return {
                "strategy": "single_beneficiary",
                "suggested_allocation": [100],
                "tips": ["Single beneficiary receives full inheritance"],
                "template_tips": tips
            }

        if num_beneficiaries == 2:
            return {
                "strategy": "equal_split",
                "suggested_allocation": [50, 50],
                "tips": ["Equal split is common for two beneficiaries"],
                "template_tips": tips
            }

        if num_beneficiaries <= 4:
            equal = 100 // num_beneficiaries
            remainder = 100 % num_beneficiaries
            allocations = [equal] * num_beneficiaries
            allocations[0] += remainder
            return {
                "strategy": "equal_split",
                "suggested_allocation": allocations,
                "tips": ["Consider if all beneficiaries should receive equal shares"],
                "template_tips": tips
            }

        return {
            "strategy": "tiered",
            "suggested_allocation": None,
            "tips": [
                "With many beneficiaries, consider tiered distribution",
                "Primary beneficiaries: 60-70%",
                "Secondary beneficiaries: 20-30%",
                "Reserve 5-10% for contingencies"
            ],
            "template_tips": tips
        }

    async def get_condition_suggestions(
        self,
        template_id: str,
        has_minors: bool = False
    ) -> list[dict[str, Any]]:
        """Get condition suggestions based on template type."""
        template = self.knowledge["templates"].get(template_id, {})
        suggested_conditions = template.get("conditions", [])

        result = []
        for condition_type in suggested_conditions:
            for condition in self.knowledge["common_conditions"]:
                if condition["type"].replace("_", " ") in condition_type.lower() or condition_type.lower() in condition["type"].replace("_", " "):
                    result.append({
                        "condition": condition,
                        "recommended": True,
                        "reason": f"Recommended for {template.get('name', template_id)} template"
                    })
                    break

        if has_minors and not any(c["condition"]["type"] == "age_milestone" for c in result):
            for condition in self.knowledge["common_conditions"]:
                if condition["type"] == "age_milestone":
                    result.append({
                        "condition": condition,
                        "recommended": True,
                        "reason": "Recommended for minor beneficiaries"
                    })
                    break

        return result

    async def get_security_tips(self, security_level: str = "basic") -> list[str]:
        """Get security tips based on required security level."""
        tips = []
        levels = ["basic", "medium", "high", "expert"]
        target_index = levels.index(security_level) if security_level in levels else 0

        for i in range(target_index + 1):
            tips.extend(self.knowledge["security_recommendations"].get(levels[i], []))

        return tips

    async def cache_portfolio_snapshot(
        self,
        user_id: str,
        portfolio: dict[str, Any]
    ) -> bool:
        """Cache user portfolio snapshot for AI context."""
        if not self.redis_client:
            return False

        try:
            await self.redis_client.set(
                f"portfolio:{user_id}",
                json.dumps(portfolio),
                ex=3600
            )
            return True
        except Exception as e:
            logger.exception(f"Failed to cache portfolio: {e}")
            return False

    async def get_portfolio_snapshot(self, user_id: str) -> dict[str, Any] | None:
        """Get cached portfolio snapshot."""
        if not self.redis_client:
            return None

        try:
            data = await self.redis_client.get(f"portfolio:{user_id}")
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.exception(f"Failed to get portfolio: {e}")
            return None

    async def warm_start(self):
        """Pre-load common knowledge for faster access."""
        logger.info("Warming up knowledge base cache...")
        if self.redis_client:
            await self._cache_knowledge()
        logger.info("Knowledge base warmed up")
