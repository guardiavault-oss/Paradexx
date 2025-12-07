#!/usr/bin/env python3
"""
Local ML Model for On-Device Safety & Habit Learning
Runs entirely on-device for privacy and real-time protection
"""

import json
import os
import pickle
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np
import onnxruntime as ort
import structlog

logger = structlog.get_logger(__name__)


@dataclass
class UserHabit:
    """User transaction habits for learning"""
    wallet_address: str
    typical_amounts: deque = field(default_factory=lambda: deque(maxlen=100))
    typical_recipients: Dict[str, int] = field(default_factory=dict)
    typical_times: List[int] = field(default_factory=list)
    approval_patterns: Dict[str, float] = field(default_factory=dict)
    swap_patterns: Dict[str, Any] = field(default_factory=dict)
    risk_tolerance: float = 0.5  # 0.0 = very cautious, 1.0 = very permissive
    last_updated: float = field(default_factory=time.time)


@dataclass
class MLPrediction:
    """ML model prediction result"""
    risk_score: float  # 0.0 = safe, 1.0 = dangerous
    confidence: float  # 0.0 = uncertain, 1.0 = very confident
    category: str  # "safe", "risky", "dangerous"
    factors: List[str] = field(default_factory=list)
    habit_based_adjustment: float = 0.0  # Adjustment based on user habits
    recommendation: str = ""


class LocalMLModel:
    """
    On-device ML model for transaction risk assessment
    Learns user habits and adapts over time
    """
    
    def __init__(self, model_path: Optional[str] = None, habits_path: Optional[str] = None):
        self.model_path = model_path or "models/risk-scorer.onnx"
        self.habits_path = habits_path or "models/user-habits.pkl"
        self.session: Optional[ort.InferenceSession] = None
        self.user_habits: Dict[str, UserHabit] = {}
        self.model_loaded = False
        
        # Feature normalization parameters
        self.feature_stats = {
            'value_mean': 0.5,
            'value_std': 0.3,
            'gas_mean': 0.5,
            'gas_std': 0.3,
        }
        
        self._load_model()
        self._load_habits()
    
    def _load_model(self):
        """Load ONNX model"""
        try:
            if os.path.exists(self.model_path):
                self.session = ort.InferenceSession(
                    self.model_path,
                    providers=['CPUExecutionProvider']  # On-device CPU
                )
                self.model_loaded = True
                logger.info("Local ML model loaded", path=self.model_path)
            else:
                logger.warning("ML model not found, using fallback", path=self.model_path)
        except Exception as e:
            logger.error("Failed to load ML model", error=str(e))
            self.model_loaded = False
    
    def _load_habits(self):
        """Load user habits"""
        try:
            if os.path.exists(self.habits_path):
                with open(self.habits_path, 'rb') as f:
                    self.user_habits = pickle.load(f)
                logger.info("User habits loaded", count=len(self.user_habits))
        except Exception as e:
            logger.warning("Failed to load habits, starting fresh", error=str(e))
            self.user_habits = {}
    
    def _save_habits(self):
        """Save user habits"""
        try:
            os.makedirs(os.path.dirname(self.habits_path), exist_ok=True)
            with open(self.habits_path, 'wb') as f:
                pickle.dump(self.user_habits, f)
        except Exception as e:
            logger.error("Failed to save habits", error=str(e))
    
    def _extract_features(self, transaction: Dict[str, Any], wallet_address: str) -> np.ndarray:
        """Extract features from transaction"""
        # Get user habits
        habit = self.user_habits.get(wallet_address, UserHabit(wallet_address=wallet_address))
        
        # Normalize transaction value
        value = int(transaction.get('value', '0'), 16) if isinstance(transaction.get('value'), str) else transaction.get('value', 0)
        value_eth = value / 1e18
        normalized_value = min(value_eth / 100.0, 1.0)  # Cap at 100 ETH
        
        # Normalize gas price
        gas_price = transaction.get('gasPrice', 0)
        if isinstance(gas_price, str):
            gas_price = int(gas_price, 16)
        normalized_gas = min(gas_price / 1e12, 1.0)  # Cap at 1000 Gwei
        
        # Has data
        has_data = 1.0 if transaction.get('data') and len(transaction.get('data', '')) > 2 else 0.0
        
        # Data length (normalized)
        data_length = len(transaction.get('data', '')) if transaction.get('data') else 0
        normalized_data_length = min(data_length / 10000.0, 1.0)
        
        # Is contract (would need to check, simplified here)
        is_contract = 0.0  # Would check if to_address is contract
        
        # Approval amount (extract from data if approval)
        approval_amount = 0.0
        if has_data and 'approve' in str(transaction.get('data', '')).lower():
            # Simplified - would parse actual approval amount
            approval_amount = normalized_value
        
        # Is swap transaction
        is_swap = 1.0 if 'swap' in str(transaction.get('data', '')).lower() else 0.0
        
        # Slippage (would extract from swap data)
        slippage = 0.0
        
        # High gas price flag
        high_gas = 1.0 if normalized_gas > 0.5 else 0.0
        
        # Contract age (would check contract creation time)
        contract_age = 0.5  # Default
        
        # Habit-based features
        typical_amount = 1.0 if habit.typical_amounts and abs(value_eth - np.mean(habit.typical_amounts)) < np.std(habit.typical_amounts) else 0.0
        typical_recipient = 1.0 if transaction.get('to', '').lower() in habit.typical_recipients else 0.0
        
        features = np.array([
            normalized_value,
            normalized_gas,
            has_data,
            normalized_data_length,
            is_contract,
            approval_amount,
            is_swap,
            slippage,
            high_gas,
            contract_age,
            typical_amount,
            typical_recipient,
        ], dtype=np.float32)
        
        return features
    
    def predict(self, transaction: Dict[str, Any], wallet_address: str) -> MLPrediction:
        """
        Predict transaction risk using local ML model
        """
        try:
            # Extract features
            features = self._extract_features(transaction, wallet_address)
            
            # Get user habits
            habit = self.user_habits.get(wallet_address, UserHabit(wallet_address=wallet_address))
            
            # Run model if available
            if self.model_loaded and self.session:
                # Prepare input
                input_name = self.session.get_inputs()[0].name
                output_name = self.session.get_outputs()[0].name
                
                # Run inference
                outputs = self.session.run([output_name], {input_name: features.reshape(1, -1)})
                predictions = outputs[0][0]
                
                # Get risk score (weighted average of predictions)
                risk_score = float(predictions[2] * 0.7 + predictions[1] * 0.3)  # Dangerous + Risky
                confidence = float(max(predictions))
                
                # Determine category
                category_idx = np.argmax(predictions)
                categories = ["safe", "risky", "dangerous"]
                category = categories[category_idx]
            else:
                # Fallback scoring
                risk_score = features[0] * 0.3 + features[5] * 0.4 + (1 - features[10]) * 0.3
                confidence = 0.7
                category = "dangerous" if risk_score > 0.7 else "risky" if risk_score > 0.4 else "safe"
            
            # Apply habit-based adjustment
            habit_adjustment = 0.0
            if habit.typical_amounts and len(habit.typical_amounts) > 5:
                value = int(transaction.get('value', '0'), 16) if isinstance(transaction.get('value'), str) else transaction.get('value', 0)
                value_eth = value / 1e18
                avg_amount = np.mean(habit.typical_amounts)
                std_amount = np.std(habit.typical_amounts)
                
                # If transaction is within user's typical range, reduce risk
                if abs(value_eth - avg_amount) < 2 * std_amount:
                    habit_adjustment = -0.2 * habit.risk_tolerance
            
            # Adjust risk score based on habits
            adjusted_risk = max(0.0, min(1.0, risk_score + habit_adjustment))
            
            # Generate factors
            factors = []
            if features[0] > 0.7:
                factors.append("High transaction value")
            if features[5] > 0.5:
                factors.append("Large approval amount")
            if features[10] < 0.5:
                factors.append("Unusual transaction amount")
            if features[11] < 0.5:
                factors.append("Unknown recipient")
            
            # Generate recommendation
            if adjusted_risk < 0.3:
                recommendation = "Transaction appears safe based on your patterns"
            elif adjusted_risk < 0.7:
                recommendation = "Review transaction details carefully"
            else:
                recommendation = "High risk detected - consider blocking or rewriting"
            
            return MLPrediction(
                risk_score=adjusted_risk,
                confidence=confidence,
                category=category,
                factors=factors,
                habit_based_adjustment=habit_adjustment,
                recommendation=recommendation
            )
            
        except Exception as e:
            logger.error("ML prediction error", error=str(e))
            # Return safe default
            return MLPrediction(
                risk_score=0.5,
                confidence=0.0,
                category="risky",
                factors=["ML model error"],
                recommendation="Unable to assess risk - proceed with caution"
            )
    
    def learn_from_transaction(
        self,
        wallet_address: str,
        transaction: Dict[str, Any],
        user_action: str,  # "approved", "rejected", "rewritten"
        final_risk_score: float
    ):
        """
        Learn from user actions to improve future predictions
        """
        if wallet_address not in self.user_habits:
            self.user_habits[wallet_address] = UserHabit(wallet_address=wallet_address)
        
        habit = self.user_habits[wallet_address]
        
        # Extract transaction details
        value = int(transaction.get('value', '0'), 16) if isinstance(transaction.get('value'), str) else transaction.get('value', 0)
        value_eth = value / 1e18
        to_address = transaction.get('to', '').lower()
        
        # Update typical amounts
        habit.typical_amounts.append(value_eth)
        
        # Update typical recipients
        if to_address:
            habit.typical_recipients[to_address] = habit.typical_recipients.get(to_address, 0) + 1
        
        # Update typical times
        current_hour = time.localtime().tm_hour
        habit.typical_times.append(current_hour)
        if len(habit.typical_times) > 100:
            habit.typical_times = habit.typical_times[-100:]
        
        # Update risk tolerance based on user actions
        if user_action == "approved" and final_risk_score > 0.7:
            # User approved high-risk transaction - increase tolerance
            habit.risk_tolerance = min(1.0, habit.risk_tolerance + 0.05)
        elif user_action == "rejected" and final_risk_score < 0.3:
            # User rejected low-risk transaction - decrease tolerance
            habit.risk_tolerance = max(0.0, habit.risk_tolerance - 0.05)
        
        # Update approval patterns if applicable
        if transaction.get('data') and 'approve' in str(transaction.get('data', '')).lower():
            # Extract approval amount (simplified)
            approval_key = f"{to_address}_approval"
            habit.approval_patterns[approval_key] = value_eth
        
        habit.last_updated = time.time()
        
        # Save habits periodically
        if time.time() - habit.last_updated > 300:  # Save every 5 minutes
            self._save_habits()
    
    def get_user_habits(self, wallet_address: str) -> Optional[UserHabit]:
        """Get user habits"""
        return self.user_habits.get(wallet_address)
    
    def reset_habits(self, wallet_address: str):
        """Reset user habits"""
        if wallet_address in self.user_habits:
            del self.user_habits[wallet_address]
            self._save_habits()


# Global instance
_local_ml_model: Optional[LocalMLModel] = None


def get_local_ml_model() -> LocalMLModel:
    """Get or create global ML model instance"""
    global _local_ml_model
    if _local_ml_model is None:
        _local_ml_model = LocalMLModel()
    return _local_ml_model


@dataclass
class TransactionIntent:
    """
    Transaction intent descriptor for AI agent analysis
    """
    wallet_address: str
    network: str = "ethereum"
    to_address: Optional[str] = None
    value: int = 0  # in wei
    data: str = "0x"
    gas_limit: Optional[int] = None
    gas_price: Optional[int] = None
    nonce: Optional[int] = None
    
    # Context
    contracts: List[str] = field(default_factory=list)  # Contract addresses involved
    tokens: List[str] = field(default_factory=list)  # Token addresses involved
    route: Optional[str] = None  # DEX route if swap
    slippage: Optional[float] = None  # Slippage tolerance
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AIAgentRecommendation:
    """
    AI agent recommendation for a transaction
    """
    risk_score: float  # 0.0 = safe, 1.0 = dangerous
    risk_level: str  # "safe", "low", "medium", "high", "critical"
    recommendation: str  # Action recommendation
    explanation: str  # Human-readable explanation
    suggested_route: Optional[str] = None  # Alternative route if available
    suggested_slippage: Optional[float] = None  # Suggested slippage
    use_private_relayer: bool = False  # Whether to use private relayer
    factors: List[str] = field(default_factory=list)  # Risk factors identified
    confidence: float = 0.0  # Confidence in recommendation (0.0-1.0)


class LocalAIAgent:
    """
    Local AI Agent for autonomous DeFi intelligence
    Analyzes gas trends, slippage, MEV, token safety, and suggests/auto-executes actions
    Enhanced with Moralis on-chain data integration
    """
    
    def __init__(self):
        self.ml_model = get_local_ml_model()
        
        # Import core modules
        from .threat_detection import threat_detection_engine
        from .contract_analysis import contract_analysis_engine
        from .wallet_simulation import wallet_simulation_engine
        from .mempool_monitor import mempool_manager
        from .enhanced_memory import get_enhanced_memory_graph
        from .attestations import attestation_engine
        
        self.threat_detection = threat_detection_engine
        self.contract_analysis = contract_analysis_engine
        self.wallet_simulation = wallet_simulation_engine
        self.mempool_monitor = mempool_manager
        self.enhanced_memory = get_enhanced_memory_graph()
        self.attestation_engine = attestation_engine
        
        logger.info("Local AI Agent initialized with Moralis integration")
    
    async def analyze_transaction_intent(
        self,
        intent: TransactionIntent
    ) -> AIAgentRecommendation:
        """
        Analyze a transaction intent and provide recommendation
        Enhanced with Moralis on-chain data and behavioral analysis
        
        Args:
            intent: TransactionIntent object
        
        Returns:
            AIAgentRecommendation with risk assessment and suggestions
        """
        try:
            logger.info(
                "Analyzing transaction intent with enhanced intelligence",
                wallet=intent.wallet_address,
                network=intent.network,
                to_address=intent.to_address
            )
            
            # 1. Get enhanced wallet profile (includes Moralis data)
            enhanced_profile = await self.enhanced_memory.get_enhanced_wallet_profile(
                intent.wallet_address, intent.network
            )
            
            # 2. Get traditional behavior profile for compatibility
            behavior_profile = enhanced_profile.guardian_profile
            
            # 3. Evaluate MEV risk
            mev_risk = await self._evaluate_mev_risk(intent)
            
            # 4. Analyze contracts
            contract_risks = await self._analyze_contracts(intent)
            
            # 5. Check token safety (enhanced with Moralis token data)
            token_safety = await self._check_token_safety_enhanced(intent, enhanced_profile)
            
            # 6. Compute risk score using wallet simulation and enhanced profile
            risk_score = await self._compute_risk_score_enhanced(intent, enhanced_profile)
            
            # 7. Get ML model prediction
            ml_prediction = self.ml_model.predict(
                self._intent_to_transaction_dict(intent),
                intent.wallet_address
            )
            
            # 8. Get Moralis behavioral insights
            moralis_insights = await self._get_moralis_behavioral_insights(
                intent, enhanced_profile
            )
            
            # 9. Combine all factors with enhanced weighting
            final_risk_score = self._combine_risk_scores_enhanced(
                risk_score,
                ml_prediction.risk_score,
                mev_risk,
                contract_risks,
                token_safety
            )
            
            # 8. Determine risk level
            risk_level = self._determine_risk_level(final_risk_score)
            
            # 9. Generate recommendation
            recommendation = self._generate_recommendation(
                intent, final_risk_score, risk_level, mev_risk, contract_risks
            )
            
            # 10. Create attestation
            attestation = self.attestation_engine.create_decision_attestation(
                wallet_address=intent.wallet_address,
                transaction_id=None,  # Will be set when transaction is created
                network=intent.network,
                inputs=self._intent_to_inputs_dict(intent),
                risk_score=final_risk_score,
                decision=recommendation.recommendation,
                explanation=recommendation.explanation
            )
            
            # 11. Build recommendation object
            ai_recommendation = AIAgentRecommendation(
                risk_score=final_risk_score,
                risk_level=risk_level,
                recommendation=recommendation.recommendation,
                explanation=recommendation.explanation,
                suggested_route=recommendation.suggested_route,
                suggested_slippage=recommendation.suggested_slippage,
                use_private_relayer=recommendation.use_private_relayer,
                factors=recommendation.factors,
                confidence=ml_prediction.confidence
            )
            
            logger.info(
                "Transaction intent analyzed",
                wallet=intent.wallet_address,
                risk_score=final_risk_score,
                risk_level=risk_level,
                recommendation=recommendation.recommendation
            )
            
            return ai_recommendation
            
        except Exception as e:
            logger.error("Error analyzing transaction intent", error=str(e))
            # Return safe default
            return AIAgentRecommendation(
                risk_score=0.5,
                risk_level="medium",
                recommendation="Unable to assess - proceed with caution",
                explanation=f"Error during analysis: {str(e)}",
                confidence=0.0
            )
    
    async def _evaluate_mev_risk(self, intent: TransactionIntent) -> float:
        """Evaluate MEV risk for transaction intent"""
        try:
            # Check if transaction is vulnerable to MEV
            if intent.to_address and intent.data and intent.data != "0x":
                # This would use mempool_monitor and threat_detection
                # For now, return a placeholder
                return 0.3  # Medium risk by default
            return 0.1  # Low risk for simple transfers
        except Exception as e:
            logger.warning("Error evaluating MEV risk", error=str(e))
            return 0.5  # Unknown risk
    
    async def _analyze_contracts(self, intent: TransactionIntent) -> float:
        """Analyze contract risks"""
        try:
            if not intent.contracts:
                return 0.0
            
            max_risk = 0.0
            for contract_address in intent.contracts:
                vulnerabilities = await self.contract_analysis.analyze_contract(
                    contract_address, intent.network
                )
                
                # Calculate risk from vulnerabilities
                if vulnerabilities:
                    critical_count = sum(1 for v in vulnerabilities if v.severity.value == "critical")
                    high_count = sum(1 for v in vulnerabilities if v.severity.value == "high")
                    contract_risk = min(1.0, critical_count * 0.5 + high_count * 0.3)
                    max_risk = max(max_risk, contract_risk)
            
            return max_risk
        except Exception as e:
            logger.warning("Error analyzing contracts", error=str(e))
            return 0.5
    
    async def _check_token_safety(self, intent: TransactionIntent) -> float:
        """Check token safety"""
        try:
            if not intent.tokens:
                return 0.0
            
            max_risk = 0.0
            for token_address in intent.tokens:
                safety_score = self.memory_graph.get_token_safety_score(
                    token_address, intent.network
                )
                
                if safety_score is not None:
                    token_risk = 1.0 - safety_score
                    max_risk = max(max_risk, token_risk)
                else:
                    # Unknown token - medium risk
                    max_risk = max(max_risk, 0.5)
            
            return max_risk
        except Exception as e:
            logger.warning("Error checking token safety", error=str(e))
            return 0.5
    
    async def _compute_risk_score(
        self,
        intent: TransactionIntent,
        behavior_profile: Any
    ) -> float:
        """Compute risk score using wallet simulation"""
        try:
            # Convert intent to transaction dict
            transaction = self._intent_to_transaction_dict(intent)
            
            # Use wallet simulation engine (simplified)
            # In production, would call wallet_simulation_engine.simulate_transaction
            return 0.3  # Placeholder
        except Exception as e:
            logger.warning("Error computing risk score", error=str(e))
            return 0.5
    
    def _combine_risk_scores(
        self,
        base_risk: float,
        ml_risk: float,
        mev_risk: float,
        contract_risk: float,
        token_risk: float
    ) -> float:
        """Combine multiple risk scores"""
        # Weighted combination
        combined = (
            base_risk * 0.3 +
            ml_risk * 0.3 +
            mev_risk * 0.2 +
            contract_risk * 0.15 +
            token_risk * 0.05
        )
        return min(1.0, max(0.0, combined))
    
    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level from score"""
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
    
    def _generate_recommendation(
        self,
        intent: TransactionIntent,
        risk_score: float,
        risk_level: str,
        mev_risk: float,
        contract_risk: float
    ) -> AIAgentRecommendation:
        """Generate recommendation based on analysis"""
        factors = []
        use_private_relayer = False
        suggested_route = None
        suggested_slippage = None
        
        if mev_risk > 0.5:
            factors.append("High MEV risk detected")
            use_private_relayer = True
        
        if contract_risk > 0.5:
            factors.append("Contract vulnerabilities detected")
        
        if risk_level == "critical":
            recommendation = "block"
            explanation = "Critical risk detected - transaction should be blocked"
        elif risk_level == "high":
            recommendation = "review"
            explanation = "High risk detected - review carefully before proceeding"
        elif risk_level == "medium":
            recommendation = "proceed_with_caution"
            explanation = "Medium risk detected - proceed with caution"
        else:
            recommendation = "approve"
            explanation = "Low risk - transaction appears safe"
        
        return AIAgentRecommendation(
            risk_score=risk_score,
            risk_level=risk_level,
            recommendation=recommendation,
            explanation=explanation,
            suggested_route=suggested_route,
            suggested_slippage=suggested_slippage,
            use_private_relayer=use_private_relayer,
            factors=factors
        )
    
    async def _check_token_safety_enhanced(
        self, 
        intent: TransactionIntent, 
        enhanced_profile: Any
    ) -> Dict[str, Any]:
        """Enhanced token safety check using Moralis data"""
        safety_info = {"risk_score": 0.0, "warnings": []}
        
        # Check tokens in the transaction
        for token_address in intent.tokens:
            # Get safety record from memory graph
            safety_records = self.enhanced_memory.get_token_safety_history(
                token_address, intent.network
            )
            
            if safety_records:
                latest = safety_records[-1]
                if latest.safety_level.value in ["risky", "unsafe"]:
                    safety_info["risk_score"] += 0.3
                    safety_info["warnings"].append(
                        f"Token {token_address[:8]}... flagged as {latest.safety_level.value}"
                    )
        
        # Check tokens in wallet portfolio (from Moralis)
        if enhanced_profile.moralis_profile:
            for token in enhanced_profile.moralis_profile.token_balances:
                if not token.verified_contract:
                    safety_info["warnings"].append(
                        f"Unverified token detected: {token.symbol}"
                    )
                    safety_info["risk_score"] += 0.1
        
        return safety_info
    
    async def _compute_risk_score_enhanced(
        self, 
        intent: TransactionIntent, 
        enhanced_profile: Any
    ) -> float:
        """Enhanced risk scoring using Moralis behavioral data"""
        base_risk = await self._compute_risk_score(intent, enhanced_profile.guardian_profile)
        
        # Adjust based on enhanced profile scores
        if enhanced_profile.risk_score > 0.7:
            base_risk += 0.2  # High-risk wallet
        elif enhanced_profile.trust_score > 0.8:
            base_risk -= 0.1  # High-trust wallet
        
        # Activity-based adjustments
        if enhanced_profile.activity_score < 0.3:
            base_risk += 0.1  # Low activity = higher risk for unusual transactions
        
        # Diversity-based adjustments
        if enhanced_profile.diversity_score < 0.3:
            base_risk += 0.05  # Concentrated portfolio = slightly higher risk
        
        return max(0.0, min(1.0, base_risk))
    
    async def _get_moralis_behavioral_insights(
        self, 
        intent: TransactionIntent, 
        enhanced_profile: Any
    ) -> Dict[str, Any]:
        """Get behavioral insights from Moralis data"""
        insights = {
            "unusual_amount": False,
            "unusual_recipient": False,
            "risk_indicators": []
        }
        
        # Check if transaction amount is unusual
        if enhanced_profile.moralis_profile:
            # Compare with typical amounts from Moralis transaction analysis
            moralis_data = enhanced_profile.moralis_profile
            
            # If we have transaction history, compare amounts
            if hasattr(moralis_data, 'transaction_count') and moralis_data.transaction_count > 10:
                tx_value_eth = intent.value / 1e18
                # Simplified: flag if > 10x typical (would need historical analysis)
                if tx_value_eth > 10.0:  # Placeholder logic
                    insights["unusual_amount"] = True
                    insights["risk_indicators"].append("Large transaction amount detected")
        
        # Add enhanced profile risk indicators
        insights["risk_indicators"].extend(enhanced_profile.risk_indicators[:3])
        
        return insights
    
    def _combine_risk_scores_enhanced(
        self, 
        base_risk: float, 
        ml_risk: float, 
        mev_risk: float,
        contract_risk: float,
        token_safety_risk: float,
        enhanced_insights: Dict[str, Any]
    ) -> float:
        """Enhanced risk score combination with Moralis insights"""
        # Base combination
        combined_risk = self._combine_risk_scores(
            base_risk, ml_risk, mev_risk, contract_risk, token_safety_risk
        )
        
        # Add Moralis insights
        moralis_risk = 0.0
        if enhanced_insights.get("unusual_amount"):
            moralis_risk += 0.1
        if enhanced_insights.get("unusual_recipient"):
            moralis_risk += 0.05
        
        # Risk indicators from behavioral analysis
        risk_indicator_count = len(enhanced_insights.get("risk_indicators", []))
        moralis_risk += min(0.2, risk_indicator_count * 0.05)
        
        # Weighted combination (80% traditional, 20% Moralis insights)
        final_risk = (combined_risk * 0.8) + (moralis_risk * 0.2)
        
        return max(0.0, min(1.0, final_risk))
    
    def _intent_to_transaction_dict(self, intent: TransactionIntent) -> Dict[str, Any]:
        """Convert TransactionIntent to transaction dict"""
        return {
            "from": intent.wallet_address,
            "to": intent.to_address,
            "value": hex(intent.value) if intent.value else "0x0",
            "data": intent.data,
            "gas": hex(intent.gas_limit) if intent.gas_limit else None,
            "gasPrice": hex(intent.gas_price) if intent.gas_price else None,
            "nonce": intent.nonce
        }
    
    def _intent_to_inputs_dict(self, intent: TransactionIntent) -> Dict[str, Any]:
        """Convert TransactionIntent to inputs dict for attestation"""
        return {
            "wallet_address": intent.wallet_address,
            "to_address": intent.to_address,
            "value": intent.value,
            "network": intent.network,
            "contracts": intent.contracts,
            "tokens": intent.tokens,
            "route": intent.route,
            "slippage": intent.slippage
        }
    
    async def get_wallet_intelligence_summary(
        self, 
        wallet_address: str, 
        network: str = "ethereum"
    ) -> Dict[str, Any]:
        """
        Get comprehensive wallet intelligence summary using Moralis data
        """
        try:
            # Get enhanced profile
            enhanced_profile = await self.enhanced_memory.get_enhanced_wallet_profile(
                wallet_address, network
            )
            
            # Get recommendations
            recommendations = await self.enhanced_memory.get_wallet_recommendations(
                wallet_address, network
            )
            
            # Combine into intelligence summary
            summary = {
                "wallet_address": wallet_address,
                "network": network,
                "intelligence_scores": {
                    "risk_score": enhanced_profile.risk_score,
                    "trust_score": enhanced_profile.trust_score,
                    "activity_score": enhanced_profile.activity_score,
                    "diversity_score": enhanced_profile.diversity_score
                },
                "portfolio_summary": {},
                "behavioral_insights": {},
                "recommendations": recommendations,
                "last_updated": enhanced_profile.last_updated
            }
            
            # Add portfolio summary if available
            if enhanced_profile.moralis_profile:
                moralis = enhanced_profile.moralis_profile
                summary["portfolio_summary"] = {
                    "native_balance_formatted": moralis.native_balance_formatted,
                    "estimated_usd_value": moralis.usd_balance,
                    "token_count": len(moralis.token_balances),
                    "nft_count": len(moralis.nfts),
                    "transaction_count": moralis.transaction_count
                }
            
            # Add behavioral insights
            if enhanced_profile.guardian_profile:
                guardian = enhanced_profile.guardian_profile
                summary["behavioral_insights"] = {
                    "risk_tolerance": guardian.risk_tolerance,
                    "transaction_count": guardian.transaction_count,
                    "typical_recipients_count": len(guardian.typical_recipients),
                    "approval_patterns_count": len(guardian.approval_patterns),
                    "total_value_sent": guardian.total_value_sent,
                    "total_value_received": guardian.total_value_received
                }
            
            logger.info("Wallet intelligence summary generated", 
                       address=wallet_address,
                       risk_score=enhanced_profile.risk_score)
            
            return summary
            
        except Exception as e:
            logger.error("Failed to generate wallet intelligence summary",
                        address=wallet_address, error=str(e))
            raise


# Global AI agent instance
_local_ai_agent: Optional[LocalAIAgent] = None


def get_local_ai_agent() -> LocalAIAgent:
    """Get or create global AI agent instance"""
    global _local_ai_agent
    if _local_ai_agent is None:
        _local_ai_agent = LocalAIAgent()
    return _local_ai_agent
