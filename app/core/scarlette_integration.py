#!/usr/bin/env python3
"""
Scarlette AI Integration for GuardianX
Integrates Scarlette AI assistant with GuardianX security engines
"""

import os
import sys
import time
from typing import Any, Dict, List, Optional
from pathlib import Path

import structlog

# Add Scarlette path to sys.path
scarlette_path = Path(__file__).parent.parent.parent / "scarlette-ai-service-standalone" / "src"
if scarlette_path.exists():
    sys.path.insert(0, str(scarlette_path))

logger = structlog.get_logger(__name__)

# Try to import Scarlette components
try:
    from scarlette_ai.ai_core import ScarletteAI
    from scarlette_ai.conversation_manager import ConversationManager
    SCARLETTE_AVAILABLE = True
except ImportError as e:
    logger.warning("Scarlette AI not available", error=str(e))
    SCARLETTE_AVAILABLE = False
    ScarletteAI = None
    ConversationManager = None

# Import GuardianX modules
try:
    from .threat_detection import threat_detection_engine
    from .contract_analysis import contract_analysis_engine
    from .blockchain import blockchain_manager
    from .memory_graph import memory_graph
    from .attestations import attestation_engine
    from .local_ml_model import LocalAIAgent
    LOCAL_AI_AGENT_AVAILABLE = True
except ImportError as e:
    logger.warning("Some GuardianX modules not available", error=str(e))
    threat_detection_engine = None
    contract_analysis_engine = None
    blockchain_manager = None
    memory_graph = None
    attestation_engine = None
    LocalAIAgent = None
    LOCAL_AI_AGENT_AVAILABLE = False


class BlockchainKnowledgeBase:
    """
    GuardianX-powered knowledge base for Scarlette
    Uses GuardianX security engines to provide blockchain intelligence
    """
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self._initialized = False
    
    async def initialize(self):
        """Initialize the knowledge base"""
        self._initialized = True
        logger.info("GuardianX knowledge base initialized")
    
    async def query_knowledge(
        self,
        query: str,
        blockchain: str = "ethereum",
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """Query knowledge using GuardianX engines and memory graph"""
        results = []
        
        # Query memory graph for historical context
        if memory_graph:
            try:
                # Extract addresses from query
                import re
                addresses = re.findall(r"0x[a-fA-F0-9]{40}", query)
                
                for address in addresses[:3]:  # Limit to first 3 addresses
                    profile = memory_graph.get_wallet_behavior_profile(address, blockchain)
                    if profile:
                        results.append({
                            "type": "memory_graph",
                            "content": f"Wallet behavior profile: {profile.total_transactions} transactions, {profile.unique_contracts} contracts",
                            "description": f"Historical behavior for {address}",
                            "data": {
                                "total_transactions": profile.total_transactions,
                                "unique_contracts": profile.unique_contracts,
                                "total_value_sent": profile.total_value_sent,
                                "total_value_received": profile.total_value_received,
                            }
                        })
            except Exception as e:
                logger.warning("Memory graph query failed", error=str(e))
        
        # Extract addresses from query
        import re
        addresses = re.findall(r"0x[a-fA-F0-9]{40}", query)
        hashes = re.findall(r"0x[a-fA-F0-9]{64}", query)
        
        # If query contains contract address, use contract analysis
        if addresses and contract_analysis_engine:
            try:
                contract_address = addresses[0]
                analysis = await contract_analysis_engine.analyze_contract(
                    contract_address=contract_address,
                    network=blockchain
                )
                if analysis:
                    results.append({
                        "type": "contract_analysis",
                        "content": f"Contract security analysis: {analysis.get('risk_level', 'Unknown')} risk",
                        "description": f"Security assessment for {contract_address}",
                        "data": analysis
                    })
            except Exception as e:
                logger.warning("Contract analysis failed", error=str(e))
        
        # If query contains transaction hash, provide transaction context
        if hashes and blockchain_manager:
            try:
                tx_hash = hashes[0]
                provider = blockchain_manager.get_provider(blockchain)
                if provider:
                    w3, _ = provider.get_best_provider()
                    tx = await provider.get_transaction(tx_hash)
                    if tx:
                        results.append({
                            "type": "transaction_info",
                            "content": f"Transaction {tx_hash[:10]}... on {blockchain}",
                            "description": f"Transaction details from {blockchain}",
                            "data": {"hash": tx_hash, "network": blockchain}
                        })
            except Exception as e:
                logger.warning("Transaction lookup failed", error=str(e))
        
        # General security knowledge
        if "security" in query.lower() or "vulnerability" in query.lower():
            results.append({
                "type": "security_knowledge",
                "content": "GuardianX provides comprehensive security analysis including MEV detection, honeypot identification, and smart contract vulnerability scanning.",
                "description": "GuardianX Security Capabilities"
            })
        
        return results[:limit]


class GuardianXScarletteIntegration:
    """
    Integration layer between Scarlette AI and GuardianX security engines
    """
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        use_openai: bool = True,
        use_huggingface: bool = False,
        redis_client = None
    ):
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.use_openai = use_openai
        self.use_huggingface = use_huggingface
        self.redis_client = redis_client
        
        self.scarlette_ai: Optional[ScarletteAI] = None
        self.knowledge_base: Optional[BlockchainKnowledgeBase] = None
        self.conversation_manager: Optional[ConversationManager] = None
        self.local_ai_agent: Optional[LocalAIAgent] = None
        self.memory_graph_instance = memory_graph if memory_graph else None
        self._initialized = False
    
    async def initialize(self):
        """Initialize Scarlette with GuardianX integration"""
        if not SCARLETTE_AVAILABLE:
            logger.warning("Scarlette AI not available, using fallback")
            return
        
        try:
            # Initialize GuardianX-powered knowledge base
            self.knowledge_base = BlockchainKnowledgeBase(self.redis_client)
            await self.knowledge_base.initialize()
            
            # Initialize conversation manager
            if ConversationManager:
                self.conversation_manager = ConversationManager(self.redis_client)
                await self.conversation_manager.initialize()
            
            # Initialize Scarlette AI
            if ScarletteAI:
                self.scarlette_ai = ScarletteAI(
                    model_path=None,
                    knowledge_base=self.knowledge_base,
                    conversation_manager=self.conversation_manager,
                    openai_api_key=self.openai_api_key,
                    use_openai=self.use_openai,
                    use_huggingface=self.use_huggingface
                )
                await self.scarlette_ai.initialize()
                logger.info("Scarlette AI initialized with GuardianX integration")
            
            # Initialize LocalAIAgent for enhanced intelligence
            if LOCAL_AI_AGENT_AVAILABLE and LocalAIAgent:
                try:
                    self.local_ai_agent = LocalAIAgent()
                    logger.info("LocalAIAgent integrated with Scarlette")
                except Exception as e:
                    logger.warning("LocalAIAgent initialization failed", error=str(e))
            
            self._initialized = True
            
        except Exception as e:
            logger.error("Failed to initialize Scarlette", error=str(e))
            self._initialized = False
    
    async def chat(
        self,
        message: str,
        user_id: str = "anonymous",
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        blockchain_focus: Optional[str] = None,
        execute_tasks: bool = True
    ) -> Dict[str, Any]:
        """
        Process a chat message with Scarlette, enhanced by GuardianX security engines
        """
        if not self._initialized or not self.scarlette_ai:
            return {
                "response": "Scarlette AI is not available. Please check configuration.",
                "session_id": session_id or f"{user_id}_fallback",
                "confidence": 0.0,
                "sources": [],
                "suggestions": [],
                "blockchain_context": {},
                "task_executed": False,
                "task_results": None
            }
        
        try:
            # Process message with Scarlette
            response = await self.scarlette_ai.process_message(
                message=message,
                user_id=user_id,
                session_id=session_id,
                context=context,
                blockchain_focus=blockchain_focus,
                execute_tasks=execute_tasks
            )
            
            # Store conversation in memory graph
            if self.memory_graph_instance and user_id and user_id != "anonymous":
                try:
                    # Extract wallet address from context if available
                    wallet_address = None
                    if context:
                        wallet_address = context.get("wallet_address") or context.get("address")
                    
                    if wallet_address:
                        # Record interaction in memory graph
                        self.memory_graph_instance.record_transaction_decision(
                            wallet_address=wallet_address,
                            transaction_hash=f"chat_{session_id}_{int(time.time())}",
                            network=blockchain_focus or "ethereum",
                            risk_score=0.0,
                            decision="ai_interaction",
                            outcome="completed",
                            metadata={
                                "message": message[:100],  # First 100 chars
                                "response_length": len(str(response.get("response", ""))),
                                "task_executed": response.get("task_executed", False),
                            }
                        )
                except Exception as e:
                    logger.warning("Memory graph recording failed", error=str(e))
            
            # Enhance response with LocalAIAgent intelligence if available
            if self.local_ai_agent and context:
                try:
                    # Use LocalAIAgent for transaction intent analysis
                    if context.get("transaction_intent"):
                        from .local_ml_model import TransactionIntent
                        intent = TransactionIntent(**context["transaction_intent"])
                        ai_recommendation = await self.local_ai_agent.analyze_transaction_intent(intent)
                        response["local_ai_recommendation"] = {
                            "risk_level": ai_recommendation.risk_level.value,
                            "recommendation": ai_recommendation.recommendation.value,
                            "confidence": ai_recommendation.confidence,
                            "risk_factors": ai_recommendation.risk_factors
                        }
                except Exception as e:
                    logger.warning("LocalAIAgent enhancement failed", error=str(e))
            
            # Enhance task results with GuardianX data if task was executed
            if response.get("task_executed") and response.get("task_results"):
                task_results = response["task_results"]
                task_name = task_results.get("task", "")
                
                # Enhance contract analysis with GuardianX contract_analysis_engine
                if task_name == "analyze_contract" and contract_analysis_engine:
                    contract_address = task_results.get("result", {}).get("address") or context.get("address")
                    if contract_address:
                        try:
                            guardianx_analysis = await contract_analysis_engine.analyze_contract(
                                contract_address=contract_address,
                                network=blockchain_focus or "ethereum"
                            )
                            if guardianx_analysis:
                                task_results["guardianx_analysis"] = guardianx_analysis
                                response["task_results"] = task_results
                        except Exception as e:
                            logger.warning("Failed to enhance with GuardianX analysis", error=str(e))
                
                # Enhance token security check with GuardianX threat detection
                elif task_name == "check_token_security" and threat_detection_engine:
                    token_address = task_results.get("result", {}).get("address") or context.get("address")
                    if token_address:
                        try:
                            # Use GuardianX threat detection for token analysis
                            threats = await threat_detection_engine.detect_token_threats(
                                token_address=token_address,
                                network=blockchain_focus or "ethereum"
                            )
                            if threats:
                                task_results["guardianx_threats"] = threats
                                response["task_results"] = task_results
                        except Exception as e:
                            logger.warning("Failed to enhance with GuardianX threats", error=str(e))
            
            return response
            
        except Exception as e:
            logger.error("Chat processing failed", error=str(e))
            return {
                "response": f"I encountered an error processing your request: {str(e)}",
                "session_id": session_id or f"{user_id}_error",
                "confidence": 0.0,
                "sources": [],
                "suggestions": ["Try rephrasing your question", "Check your network connection"],
                "blockchain_context": {},
                "task_executed": False,
                "task_results": None
            }
    
    async def execute_task(
        self,
        task_name: str,
        user_id: str = "anonymous",
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a task using Scarlette with GuardianX enhancement"""
        if not self._initialized or not self.scarlette_ai:
            return {
                "error": "Scarlette AI not available",
                "task": task_name,
                "status": "failed"
            }
        
        try:
            result = await self.scarlette_ai.execute_task(
                task_name=task_name,
                user_id=user_id,
                parameters=parameters or {}
            )
            
            # Enhance result with GuardianX data
            if task_name == "analyze_contract" and contract_analysis_engine:
                contract_address = (parameters or {}).get("address")
                if contract_address:
                    try:
                        guardianx_result = await contract_analysis_engine.analyze_contract(
                            contract_address=contract_address,
                            network=(parameters or {}).get("network", "ethereum")
                        )
                        if guardianx_result:
                            result["guardianx_enhanced"] = True
                            result["guardianx_analysis"] = guardianx_result
                    except Exception as e:
                        logger.warning("GuardianX enhancement failed", error=str(e))
            
            return result
            
        except Exception as e:
            logger.error("Task execution failed", error=str(e), task=task_name)
            return {
                "error": str(e),
                "task": task_name,
                "status": "failed"
            }
    
    async def generate_greeting(self, user_id: str) -> str:
        """Generate a personalized greeting"""
        if not self._initialized or not self.scarlette_ai:
            return "Hello! I'm Scarlette, your blockchain security AI assistant integrated with GuardianX."
        
        try:
            return await self.scarlette_ai.generate_greeting(user_id)
        except Exception as e:
            logger.warning("Greeting generation failed", error=str(e))
            return "Hello! I'm Scarlette, your blockchain security AI assistant. How can I help you today?"


# Global instance
_scarlette_integration: Optional[GuardianXScarletteIntegration] = None


def get_scarlette_integration() -> GuardianXScarletteIntegration:
    """Get or create global Scarlette integration instance"""
    global _scarlette_integration
    if _scarlette_integration is None:
        _scarlette_integration = GuardianXScarletteIntegration()
    return _scarlette_integration


async def initialize_scarlette():
    """Initialize Scarlette integration (call on startup)"""
    integration = get_scarlette_integration()
    await integration.initialize()
    return integration

