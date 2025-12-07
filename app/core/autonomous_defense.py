#!/usr/bin/env python3
"""
GuardianX Autonomous Defense System
Unified orchestrator that integrates all protection layers:
- Transaction rewriting (dangerous → safe)
- On-chain blocking (guardian contracts)
- Habit learning (memory graph)
- Private mempool routing
- AI-powered analysis (Scarlette + Local ML)

This is NOT a plugin or extension - it's a fully autonomous defense system.
"""

import asyncio
import hashlib
import json
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog

logger = structlog.get_logger(__name__)


class DefenseAction(Enum):
    """Actions the autonomous defense system can take"""
    ALLOW = "allow"
    REWRITE = "rewrite"
    BLOCK = "block"
    ROUTE_PRIVATE = "route_private"
    REQUIRE_GUARDIAN = "require_guardian"
    QUARANTINE = "quarantine"


@dataclass
class DefenseResult:
    """Result of autonomous defense analysis"""
    action: DefenseAction
    original_transaction: Dict[str, Any]
    final_transaction: Optional[Dict[str, Any]] = None
    risk_score: float = 0.0
    risk_level: str = "safe"
    threat_types: List[str] = field(default_factory=list)
    protection_applied: List[str] = field(default_factory=list)
    rewrite_changes: List[str] = field(default_factory=list)
    guardian_contract_required: bool = False
    private_mempool_routed: bool = False
    habit_confidence: float = 0.0
    ai_recommendation: str = ""
    attestation_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class AutonomousDefenseSystem:
    """
    GuardianX Autonomous Defense System
    Fully autonomous protection that works without user intervention
    """
    
    def __init__(self):
        """Initialize the unified defense system"""
        self.enabled = True
        self.auto_rewrite_enabled = True
        self.auto_block_enabled = True
        self.private_mempool_enabled = True
        self.guardian_contracts_enabled = True
        self.habit_learning_enabled = True
        
        # Initialize all subsystems
        self._initialize_subsystems()
        
        logger.info("GuardianX Autonomous Defense System initialized")
    
    def _initialize_subsystems(self):
        """Initialize all GuardianX subsystems"""
        try:
            # Core protection engines
            from .threat_detection import threat_detection_engine
            from .contract_analysis import contract_analysis_engine
            from .wallet_simulation import wallet_simulation_engine
            from .transaction_rewriter import get_transaction_rewriter
            from .mempool_defense import get_mempool_defense
            from .guardian_contracts import get_guardian_contracts
            from .memory_graph import memory_graph
            from .local_ml_model import LocalMLModel
            from .attestations import attestation_engine
            from .blockchain import blockchain_manager
            from .wallet_engine import get_wallet_engine
            
            # AI and intelligence
            from .scarlette_integration import get_scarlette_integration
            
            self.threat_detection = threat_detection_engine
            self.contract_analysis = contract_analysis_engine
            self.wallet_simulation = wallet_simulation_engine
            self.transaction_rewriter = get_transaction_rewriter()
            self.mempool_defense = get_mempool_defense()
            self.guardian_contracts = get_guardian_contracts()
            self.memory_graph = memory_graph
            self.local_ml = LocalMLModel()
            self.attestations = attestation_engine
            self.blockchain_manager = blockchain_manager
            self.wallet_engine = get_wallet_engine()
            
            # Scarlette AI
            try:
                self.scarlette = get_scarlette_integration()
                self.scarlette_available = True
            except Exception as e:
                logger.warning("Scarlette AI not available", error=str(e))
                self.scarlette = None
                self.scarlette_available = False
            
            logger.info("All GuardianX subsystems initialized")
            
        except Exception as e:
            logger.error("Failed to initialize subsystems", error=str(e))
            raise
    
    async def protect_transaction(
        self,
        transaction: Dict[str, Any],
        wallet_address: str,
        chain_id: int = 1,
        network: str = "ethereum",
        auto_execute: bool = False
    ) -> DefenseResult:
        """
        Main entry point: Protect a transaction autonomously
        
        This is the unified defense system that:
        1. Analyzes transaction with all engines
        2. Learns from user habits
        3. Rewrites dangerous transactions
        4. Routes through private mempool
        5. Deploys guardian contracts if needed
        6. Creates attestations
        
        Args:
            transaction: Transaction to protect
            wallet_address: Wallet address
            chain_id: Chain ID
            network: Network name
            auto_execute: If True, automatically execute the protected transaction
        
        Returns:
            DefenseResult with action taken
        """
        if not self.enabled:
            return DefenseResult(
                action=DefenseAction.ALLOW,
                original_transaction=transaction,
                final_transaction=transaction
            )
        
        logger.info(
            "Protecting transaction",
            wallet=wallet_address,
            network=network,
            to=transaction.get("to", "unknown")
        )
        
        # Step 1: Multi-layer threat analysis
        threat_analysis = await self._analyze_threats(transaction, wallet_address, network)
        
        # Step 2: Habit-based learning and adjustment
        habit_analysis = await self._analyze_habits(transaction, wallet_address, network)
        
        # Step 3: Combined risk scoring
        risk_score = self._calculate_combined_risk(threat_analysis, habit_analysis)
        
        # Step 4: AI-powered recommendation (Scarlette)
        ai_recommendation = await self._get_ai_recommendation(
            transaction, threat_analysis, habit_analysis, risk_score
        )
        
        # Step 5: Determine defense action
        defense_action = self._determine_action(risk_score, threat_analysis, habit_analysis)
        
        # Step 6: Apply protections
        protected_tx = transaction.copy()
        protection_applied = []
        rewrite_changes = []
        guardian_required = False
        private_routed = False
        
        # Apply transaction rewriting if dangerous
        if defense_action in [DefenseAction.REWRITE, DefenseAction.BLOCK]:
            rewrite_result = self.transaction_rewriter.analyze_and_rewrite(
                protected_tx,
                threat_analysis.get("risk_factors", []),
                risk_score
            )
            
            if rewrite_result and rewrite_result.risk_reduction > 0.1:
                protected_tx = rewrite_result.rewritten_tx
                rewrite_changes = rewrite_result.changes
                protection_applied.append("transaction_rewritten")
                defense_action = DefenseAction.REWRITE
            elif risk_score > 0.9:
                # Too dangerous, block it
                defense_action = DefenseAction.BLOCK
                protection_applied.append("transaction_blocked")
        
        # Route through private mempool (always for risky transactions)
        if risk_score > 0.3 or self.private_mempool_enabled:
            try:
                mempool_result = await self.mempool_defense.route_transaction(
                    protected_tx,
                    chain_id,
                    protection_level="high" if risk_score > 0.5 else "medium"
                )
                
                if mempool_result.success:
                    private_routed = True
                    protection_applied.append("private_mempool_routed")
                    protected_tx["mempool_route"] = mempool_result.relayer_used
            except Exception as e:
                logger.warning("Private mempool routing failed", error=str(e))
        
        # Check if guardian contract is needed
        if risk_score > 0.6 or self.guardian_contracts_enabled:
            guardian_contract = self.guardian_contracts.get_contract(wallet_address, chain_id)
            if not guardian_contract or not guardian_contract.deployed:
                guardian_required = True
                protection_applied.append("guardian_contract_recommended")
        
        # Step 7: Create attestation
        attestation_id = None
        try:
            attestation = await self.attestations.create_decision_attestation(
                wallet_address=wallet_address,
                transaction_hash=hashlib.sha256(
                    json.dumps(transaction, sort_keys=True).encode()
                ).hexdigest(),
                risk_score=risk_score,
                decision=defense_action.value,
                inputs_hash=hashlib.sha256(
                    json.dumps(transaction, sort_keys=True).encode()
                ).hexdigest(),
                model_version="guardianx-v1.0"
            )
            attestation_id = attestation.attestation_id
        except Exception as e:
            logger.warning("Failed to create attestation", error=str(e))
        
        # Step 8: Learn from this transaction
        if self.habit_learning_enabled:
            await self._learn_from_transaction(
                transaction, protected_tx, wallet_address, network,
                risk_score, defense_action
            )
        
        # Step 9: Auto-execute if requested and safe
        if auto_execute and defense_action == DefenseAction.ALLOW:
            try:
                await self._execute_transaction(protected_tx, wallet_address, network)
                protection_applied.append("auto_executed")
            except Exception as e:
                logger.error("Auto-execution failed", error=str(e))
        
        # Build result
        result = DefenseResult(
            action=defense_action,
            original_transaction=transaction,
            final_transaction=protected_tx if defense_action != DefenseAction.BLOCK else None,
            risk_score=risk_score,
            risk_level=self._get_risk_level(risk_score),
            threat_types=threat_analysis.get("threat_types", []),
            protection_applied=protection_applied,
            rewrite_changes=rewrite_changes,
            guardian_contract_required=guardian_required,
            private_mempool_routed=private_routed,
            habit_confidence=habit_analysis.get("confidence", 0.0),
            ai_recommendation=ai_recommendation,
            attestation_id=attestation_id,
            metadata={
                "threat_analysis": threat_analysis,
                "habit_analysis": habit_analysis,
                "network": network,
                "chain_id": chain_id
            }
        )
        
        logger.info(
            "Transaction protection complete",
            action=defense_action.value,
            risk_score=risk_score,
            protections=protection_applied
        )
        
        return result
    
    async def _analyze_threats(
        self,
        transaction: Dict[str, Any],
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """Multi-layer threat analysis using all GuardianX engines"""
        threats = []
        risk_factors = []
        threat_types = []
        
        try:
            # 1. MEV and threat detection
            mev_threats = await self.threat_detection.detect_mev_attack(
                transaction, network
            )
            if mev_threats:
                threats.extend(mev_threats)
                threat_types.append("mev_attack")
                risk_factors.append("MEV vulnerability detected")
            
            # 2. Contract analysis
            to_address = transaction.get("to")
            if to_address and to_address != "0x0":
                contract_analysis = await self.contract_analysis.analyze_contract(
                    to_address, network
                )
                if contract_analysis:
                    if contract_analysis.risk_score > 0.7:
                        threats.append({
                            "type": "malicious_contract",
                            "severity": "high",
                            "details": contract_analysis.vulnerabilities
                        })
                        threat_types.append("malicious_contract")
                        risk_factors.append(f"Contract risk: {contract_analysis.risk_score}")
            
            # 3. Wallet simulation
            simulation = await self.wallet_simulation.simulate_transaction(
                transaction, network
            )
            if simulation:
                if simulation.risk_score > 0.6:
                    threats.append({
                        "type": "simulation_failure",
                        "severity": "medium",
                        "details": simulation.warnings
                    })
                    threat_types.append("simulation_risk")
                    risk_factors.append("Transaction simulation indicates risk")
            
        except Exception as e:
            logger.error("Threat analysis error", error=str(e))
        
        return {
            "threats": threats,
            "risk_factors": risk_factors,
            "threat_types": threat_types,
            "threat_count": len(threats)
        }
    
    async def _analyze_habits(
        self,
        transaction: Dict[str, Any],
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """Analyze transaction against learned user habits"""
        try:
            # Get behavior profile from memory graph
            profile = await self.memory_graph.get_wallet_behavior_profile(
                wallet_address, network
            )
            
            if not profile:
                return {
                    "confidence": 0.0,
                    "anomaly_score": 0.0,
                    "habit_match": False
                }
            
            # Check if transaction matches habits
            value = int(transaction.get("value", "0"), 16) if isinstance(
                transaction.get("value"), str
            ) else transaction.get("value", 0)
            value_eth = value / 1e18
            
            # Check amount anomaly
            typical_amounts = list(profile.typical_amounts)
            if typical_amounts:
                avg_amount = sum(typical_amounts) / len(typical_amounts)
                amount_anomaly = abs(value_eth - avg_amount) / max(avg_amount, 0.01)
            else:
                amount_anomaly = 0.0
            
            # Check recipient anomaly
            to_address = transaction.get("to", "").lower()
            recipient_familiarity = profile.typical_recipients.get(to_address, 0)
            recipient_anomaly = 1.0 - min(recipient_familiarity / 10.0, 1.0)
            
            # Combined anomaly score
            anomaly_score = (amount_anomaly * 0.5 + recipient_anomaly * 0.5)
            habit_match = anomaly_score < 0.3
            
            # Use local ML for habit-based adjustment
            ml_prediction = self.local_ml.predict_risk(
                transaction, wallet_address
            )
            
            return {
                "confidence": 1.0 - anomaly_score,
                "anomaly_score": anomaly_score,
                "habit_match": habit_match,
                "amount_anomaly": amount_anomaly,
                "recipient_anomaly": recipient_anomaly,
                "ml_adjustment": ml_prediction.habit_based_adjustment if ml_prediction else 0.0,
                "profile": profile
            }
            
        except Exception as e:
            logger.error("Habit analysis error", error=str(e))
            return {
                "confidence": 0.0,
                "anomaly_score": 0.0,
                "habit_match": False
            }
    
    def _calculate_combined_risk(
        self,
        threat_analysis: Dict[str, Any],
        habit_analysis: Dict[str, Any]
    ) -> float:
        """Calculate combined risk score from all sources"""
        # Base threat risk
        threat_count = threat_analysis.get("threat_count", 0)
        threat_risk = min(threat_count * 0.3, 1.0)
        
        # Habit anomaly risk
        anomaly_score = habit_analysis.get("anomaly_score", 0.0)
        habit_risk = anomaly_score * 0.4
        
        # ML adjustment
        ml_adjustment = habit_analysis.get("ml_adjustment", 0.0)
        
        # Combined risk (weighted)
        combined_risk = (
            threat_risk * 0.6 +  # Threats are primary
            habit_risk * 0.3 +    # Habits are secondary
            abs(ml_adjustment) * 0.1  # ML provides fine-tuning
        )
        
        return min(combined_risk, 1.0)
    
    async def _get_ai_recommendation(
        self,
        transaction: Dict[str, Any],
        threat_analysis: Dict[str, Any],
        habit_analysis: Dict[str, Any],
        risk_score: float
    ) -> str:
        """Get AI recommendation from Scarlette"""
        if not self.scarlette_available or not self.scarlette:
            return ""
        
        try:
            # Build context for Scarlette
            context = {
                "transaction": transaction,
                "threat_analysis": threat_analysis,
                "habit_analysis": habit_analysis,
                "risk_score": risk_score
            }
            
            # Query Scarlette for recommendation
            message = f"Analyze this transaction: risk score {risk_score:.2f}, "
            message += f"threats: {', '.join(threat_analysis.get('threat_types', []))}, "
            message += f"habit match: {habit_analysis.get('habit_match', False)}. "
            message += "What should I do?"
            
            response = await self.scarlette.chat(
                message=message,
                user_id="guardianx_system",
                context=context,
                execute_tasks=False
            )
            
            if response and "response" in response:
                return response["response"]
            
        except Exception as e:
            logger.warning("Scarlette recommendation failed", error=str(e))
        
        return ""
    
    def _determine_action(
        self,
        risk_score: float,
        threat_analysis: Dict[str, Any],
        habit_analysis: Dict[str, Any]
    ) -> DefenseAction:
        """Determine what action to take based on analysis"""
        # Block if extremely dangerous
        if risk_score > 0.9:
            return DefenseAction.BLOCK
        
        # Rewrite if dangerous but fixable
        if risk_score > 0.5:
            return DefenseAction.REWRITE
        
        # Route privately if moderately risky
        if risk_score > 0.3:
            return DefenseAction.ROUTE_PRIVATE
        
        # Allow if safe
        return DefenseAction.ALLOW
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Convert risk score to level"""
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.4:
            return "medium"
        elif risk_score >= 0.2:
            return "low"
        else:
            return "safe"
    
    async def _learn_from_transaction(
        self,
        original_tx: Dict[str, Any],
        final_tx: Dict[str, Any],
        wallet_address: str,
        network: str,
        risk_score: float,
        action: DefenseAction
    ):
        """Learn from transaction outcome"""
        try:
            # Record transaction decision in memory graph
            tx_hash = hashlib.sha256(
                json.dumps(original_tx, sort_keys=True).encode()
            ).hexdigest()
            
            await self.memory_graph.record_transaction_decision(
                wallet_address=wallet_address,
                transaction_hash=tx_hash,
                network=network,
                risk_score=risk_score,
                decision=action.value,
                outcome="pending",
                metadata={
                    "rewritten": action == DefenseAction.REWRITE,
                    "blocked": action == DefenseAction.BLOCK,
                    "private_routed": True
                }
            )
            
            # Update local ML habits
            self.local_ml.learn_from_transaction(
                original_tx, wallet_address, action.value, risk_score
            )
            
        except Exception as e:
            logger.error("Failed to learn from transaction", error=str(e))
    
    async def _execute_transaction(
        self,
        transaction: Dict[str, Any],
        wallet_address: str,
        network: str
    ):
        """Execute the protected transaction"""
        try:
            # Get network provider
            provider = self.blockchain_manager.get_provider(network)
            if not provider:
                raise ValueError(f"Network {network} not supported")
            
            w3, _ = provider.get_best_provider()
            
            # Ensure transaction has from address
            if "from" not in transaction:
                transaction["from"] = wallet_address
            
            # Sign transaction using wallet engine
            signed_tx = self.wallet_engine.sign_transaction(transaction)
            
            # Send through private mempool if configured
            if transaction.get("mempool_route"):
                # Already routed, just send
                tx_hash = w3.eth.send_raw_transaction(signed_tx)
            else:
                # Route through private mempool first
                mempool_result = await self.mempool_defense.route_transaction(
                    transaction,
                    transaction.get("chainId", 1),
                    protection_level="high"
                )
                
                if mempool_result.success and mempool_result.transaction_hash:
                    tx_hash = mempool_result.transaction_hash
                else:
                    # Fallback to standard send
                    tx_hash = w3.eth.send_raw_transaction(signed_tx)
            
            logger.info("Transaction executed", tx_hash=tx_hash.hex() if hasattr(tx_hash, 'hex') else str(tx_hash))
            return tx_hash
            
        except Exception as e:
            logger.error("Transaction execution failed", error=str(e))
            raise
    
    async def deploy_guardian_contract(
        self,
        wallet_address: str,
        chain_id: int,
        rules: Optional[List] = None
    ) -> str:
        """Deploy guardian contract for on-chain protection"""
        try:
            contract = await self.guardian_contracts.deploy_contract(
                wallet_address, chain_id, rules or []
            )
            
            if contract and contract.deployed:
                logger.info(
                    "Guardian contract deployed",
                    address=contract.contract_address,
                    wallet=wallet_address
                )
                return contract.contract_address
            
        except Exception as e:
            logger.error("Guardian contract deployment failed", error=str(e))
        
        return ""
    
    def get_protection_status(self, wallet_address: str) -> Dict[str, Any]:
        """Get current protection status for a wallet"""
        return {
            "enabled": self.enabled,
            "auto_rewrite": self.auto_rewrite_enabled,
            "auto_block": self.auto_block_enabled,
            "private_mempool": self.private_mempool_enabled,
            "guardian_contracts": self.guardian_contracts_enabled,
            "habit_learning": self.habit_learning_enabled,
            "wallet_address": wallet_address
        }


# Global instance
_autonomous_defense: Optional[AutonomousDefenseSystem] = None


def get_autonomous_defense() -> AutonomousDefenseSystem:
    """Get or create the global autonomous defense system"""
    global _autonomous_defense
    if _autonomous_defense is None:
        _autonomous_defense = AutonomousDefenseSystem()
    return _autonomous_defense

