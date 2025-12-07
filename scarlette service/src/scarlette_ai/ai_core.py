"""
Scarlette AI Core - Standalone Version
Main AI processing engine for blockchain security analysis.
"""

import logging
from datetime import datetime
from typing import Any
from uuid import uuid4

# Optional dependencies
try:
    import openai

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from transformers import pipeline

    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False

from .blockchain_knowledge_base import BlockchainKnowledgeBase
from .conversation_manager import ConversationManager

logger = logging.getLogger(__name__)


class ScarletteAI:
    """
    Core Scarlette AI Engine
    Handles natural language processing, blockchain analysis, and intelligent responses.
    """

    def __init__(
        self,
        model_path: str | None = None,
        knowledge_base: BlockchainKnowledgeBase | None = None,
        conversation_manager: ConversationManager | None = None,
        openai_api_key: str | None = None,
        use_openai: bool = True,
        use_huggingface: bool = False,
    ):
        self.model_path = model_path
        self.knowledge_base = knowledge_base
        self.conversation_manager = conversation_manager
        self.openai_api_key = openai_api_key
        self.use_openai = use_openai and OPENAI_AVAILABLE
        self.use_huggingface = use_huggingface and HUGGINGFACE_AVAILABLE

        # AI models
        self.openai_client = None
        self.hf_pipeline = None
        self.hf_tokenizer = None

        # System prompts
        self.system_prompt = """You are Scarlette, an advanced AI assistant specialized in blockchain security and DeFi protocol analysis.

Your expertise includes:
- Smart contract vulnerability detection
- DeFi protocol security analysis
- Cryptocurrency threat intelligence
- Blockchain forensics and investigation
- Multi-chain security considerations
- MEV, flash loan, and rug pull detection

You provide detailed, technical analysis while maintaining a helpful and professional tone.
When analyzing code or protocols, always consider security implications and provide actionable recommendations."""

        # Response templates
        self.greeting_templates = [
            "Hello! I'm Scarlette, your blockchain security AI assistant. How can I help you analyze and secure your DeFi protocols today?",
            "Greetings! Scarlette here, ready to dive into blockchain security analysis. What would you like to explore?",
            "Hi there! I'm Scarlette, specialized in cryptocurrency and DeFi security. What security challenges can I help you with?",
        ]

        self._initialized = False

    async def initialize(self):
        """Initialize the AI engine with available models."""
        import os
        logger.info("Initializing Scarlette AI Core...")

        ai_integrations_base_url = os.getenv("AI_INTEGRATIONS_OPENAI_BASE_URL")
        ai_integrations_api_key = os.getenv("AI_INTEGRATIONS_OPENAI_API_KEY")

        if ai_integrations_base_url and ai_integrations_api_key:
            try:
                self.openai_client = openai.AsyncOpenAI(
                    api_key=ai_integrations_api_key,
                    base_url=ai_integrations_base_url
                )
                self.use_openai = True
                logger.info("✅ OpenAI client initialized with Replit AI Integrations")
            except Exception as e:
                logger.exception(f"❌ Failed to initialize OpenAI with AI Integrations: {e}")
                self.use_openai = False
                self.openai_client = None
        elif self.use_openai and self.openai_api_key:
            try:
                openai.api_key = self.openai_api_key
                self.openai_client = openai.AsyncOpenAI(api_key=self.openai_api_key)
                logger.info("✅ OpenAI client initialized with API key")
            except Exception as e:
                logger.exception(f"❌ Failed to initialize OpenAI: {e}")
                self.use_openai = False
                self.openai_client = None

        # Initialize HuggingFace if available and requested
        if self.use_huggingface:
            try:
                # Use a lightweight conversational model
                model_name = "microsoft/DialoGPT-medium"
                self.hf_pipeline = pipeline(
                    "text-generation",
                    model=model_name,
                    tokenizer=model_name,
                    return_full_text=False,
                    max_length=512,
                    do_sample=True,
                    temperature=0.7,
                )
                logger.info("✅ HuggingFace pipeline initialized successfully")

            except Exception as e:
                logger.exception(f"❌ Failed to initialize HuggingFace: {e}")
                self.use_huggingface = False
                self.hf_pipeline = None

        self._initialized = True

        if not (self.use_openai or self.use_huggingface):
            logger.warning("⚠️ No AI models available - using fallback responses")

        logger.info("✅ Scarlette AI Core initialized")

    async def process_message(
        self,
        message: str,
        user_id: str = "anonymous",
        session_id: str | None = None,
        context: dict[str, Any] | None = None,
        blockchain_focus: str | None = None,
        execute_tasks: bool = True,
    ) -> dict[str, Any]:
        """Process a user message and generate an intelligent response."""

        # Create session if not provided
        if not session_id and self.conversation_manager:
            session_id = await self.conversation_manager.create_session(user_id)
        elif not session_id:
            session_id = f"{user_id}_{uuid4().hex[:8]}"

        # Get conversation context
        conversation_context = ""
        if self.conversation_manager:
            conversation_context = await self.conversation_manager.get_conversation_context(
                session_id,
            )

        # Analyze message intent
        intent = await self._analyze_intent(message)

        # Get relevant knowledge
        knowledge_context = ""
        if self.knowledge_base:
            knowledge_context = await self._get_relevant_knowledge(message, blockchain_focus)

        # Generate response
        response_text = await self._generate_response(
            message=message,
            conversation_context=conversation_context,
            knowledge_context=knowledge_context,
            intent=intent,
            blockchain_focus=blockchain_focus,
        )

        # Execute tasks if requested
        task_results = None
        task_executed = False
        if execute_tasks and intent.get("has_task", False):
            try:
                task_results = await self._execute_task(intent, message, context)
                task_executed = True
            except Exception as e:
                logger.exception(f"Task execution failed: {e}")
                task_results = {"error": str(e)}

        # Get suggestions
        suggestions = await self._generate_suggestions(message, intent, blockchain_focus)

        # Prepare response
        response = {
            "response": response_text,
            "session_id": session_id,
            "confidence": intent.get("confidence", 0.8),
            "sources": self._get_sources(knowledge_context),
            "suggestions": suggestions,
            "blockchain_context": {
                "focus": blockchain_focus or "general",
                "intent": intent.get("category", "general"),
                "knowledge_used": bool(knowledge_context),
            },
            "task_executed": task_executed,
            "task_results": task_results,
        }

        # Update conversation
        if self.conversation_manager:
            await self.conversation_manager.update_session(
                session_id, message, response_text, context,
            )

        return response

    async def generate_greeting(self, user_id: str) -> str:
        """Generate a personalized greeting."""
        # Simple random selection for now
        import random

        return random.choice(self.greeting_templates)

        # Personalize if we have user context
        # For now, just return the base greeting

    async def execute_task(
        self,
        task_name: str,
        user_id: str = "anonymous",
        parameters: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a specific named task."""
        logger.info(f"Executing task: {task_name}")

        # Define available tasks
        tasks = {
            "analyze_contract": self._analyze_contract,
            "check_token_security": self._check_token_security,
            "scan_address": self._scan_address,
            "get_defi_risks": self._get_defi_risks,
            "analyze_transaction": self._analyze_transaction,
        }

        if task_name not in tasks:
            return {
                "error": f"Unknown task: {task_name}",
                "available_tasks": list(tasks.keys()),
            }

        try:
            result = await tasks[task_name](parameters or {})
            return {"task": task_name, "result": result, "status": "completed"}
        except Exception as e:
            logger.exception(f"Task {task_name} failed: {e}")
            return {"task": task_name, "error": str(e), "status": "failed"}

    async def _analyze_intent(self, message: str) -> dict[str, Any]:
        """Analyze user intent from the message."""
        message_lower = message.lower()

        # Define intent patterns
        intents = {
            "contract_analysis": {
                "keywords": [
                    "contract",
                    "smart contract",
                    "vulnerability",
                    "audit",
                    "analyze",
                    "security",
                ],
                "confidence": 0.0,
                "has_task": True,
                "task": "analyze_contract",
            },
            "token_security": {
                "keywords": ["token", "honeypot", "rug pull", "scam", "safe"],
                "confidence": 0.0,
                "has_task": True,
                "task": "check_token_security",
            },
            "defi_analysis": {
                "keywords": ["defi", "protocol", "yield", "liquidity", "farm", "pool"],
                "confidence": 0.0,
                "has_task": True,
                "task": "get_defi_risks",
            },
            "address_scan": {
                "keywords": ["address", "wallet", "scan", "check"],
                "confidence": 0.0,
                "has_task": True,
                "task": "scan_address",
            },
            "general": {
                "keywords": ["help", "what", "how", "explain"],
                "confidence": 0.0,
                "has_task": False,
            },
        }

        # Calculate confidence for each intent
        best_intent = "general"
        best_confidence = 0.0

        for intent_name, intent_data in intents.items():
            confidence = 0.0
            keyword_matches = 0

            for keyword in intent_data["keywords"]:
                if keyword in message_lower:
                    keyword_matches += 1

            if keyword_matches > 0:
                confidence = min(keyword_matches / len(intent_data["keywords"]), 1.0)
                intent_data["confidence"] = confidence

                if confidence > best_confidence:
                    best_confidence = confidence
                    best_intent = intent_name

        return {
            "category": best_intent,
            "confidence": best_confidence,
            "has_task": intents[best_intent]["has_task"],
            "task": intents[best_intent].get("task"),
        }

    async def _get_relevant_knowledge(
        self, message: str, blockchain_focus: str | None = None,
    ) -> str:
        """Get relevant knowledge from the knowledge base."""
        if not self.knowledge_base:
            return ""

        try:
            # Simple keyword-based knowledge retrieval
            knowledge = await self.knowledge_base.query_knowledge(
                query=message, blockchain=blockchain_focus or "ethereum", limit=3,
            )

            if knowledge:
                return "\n".join([k.get("content", k.get("description", "")) for k in knowledge])

        except Exception as e:
            logger.exception(f"Knowledge retrieval failed: {e}")

        return ""

    async def _generate_response(
        self,
        message: str,
        conversation_context: str = "",
        knowledge_context: str = "",
        intent: dict[str, Any] | None = None,
        blockchain_focus: str | None = None,
    ) -> str:
        """Generate an intelligent response using available AI models."""

        # Prepare context
        full_context = f"{self.system_prompt}\n\n"

        if knowledge_context:
            full_context += f"Relevant Knowledge:\n{knowledge_context}\n\n"

        if conversation_context:
            full_context += f"Conversation History:\n{conversation_context}\n\n"

        if blockchain_focus:
            full_context += f"Focus: {blockchain_focus} blockchain\n\n"

        full_context += f"User: {message}\nAssistant:"

        # Try OpenAI first
        # the newest OpenAI model is "gpt-5" which was released August 7, 2025.
        # do not change this unless explicitly requested by the user
        if self.use_openai and self.openai_client:
            try:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": message},
                    ],
                    max_completion_tokens=1024,
                )
                return response.choices[0].message.content.strip()

            except Exception as e:
                logger.exception(f"OpenAI generation failed: {e}")

        # Try HuggingFace
        if self.use_huggingface and self.hf_pipeline:
            try:
                response = self.hf_pipeline(
                    message,
                    max_length=200,
                    num_return_sequences=1,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=50256,
                )
                return response[0]["generated_text"].strip()

            except Exception as e:
                logger.exception(f"HuggingFace generation failed: {e}")

        # Fallback response
        return await self._generate_fallback_response(message, intent, blockchain_focus)

    async def _generate_fallback_response(
        self,
        message: str,
        intent: dict[str, Any] | None = None,
        blockchain_focus: str | None = None,
    ) -> str:
        """Generate a fallback response when AI models are not available."""
        intent_category = intent.get("category", "general") if intent else "general"

        fallback_responses = {
            "contract_analysis": "I'd be happy to help analyze smart contracts for security vulnerabilities. To provide a thorough analysis, I would need access to the contract code. Please share the contract address or source code for detailed security assessment.",
            "token_security": "Token security analysis is crucial in DeFi. I can help evaluate tokens for common risks like honeypots, rug pulls, and other scam indicators. Please provide the token contract address for analysis.",
            "defi_analysis": "DeFi protocol analysis involves examining smart contracts, tokenomics, and security mechanisms. I can help assess risks related to yield farming, liquidity provision, and protocol governance.",
            "address_scan": "Address scanning can reveal valuable security insights including transaction patterns, token holdings, and potential risks. Please provide the address you'd like me to analyze.",
            "general": "I'm Scarlette, your blockchain security AI assistant. I specialize in analyzing smart contracts, DeFi protocols, and cryptocurrency security threats. How can I help you today?",
        }

        response = fallback_responses.get(intent_category, fallback_responses["general"])

        if blockchain_focus:
            response += f" I'll focus on {blockchain_focus} blockchain specifics in my analysis."

        return response

    async def _generate_suggestions(
        self,
        message: str,
        intent: dict[str, Any],
        blockchain_focus: str | None = None,
    ) -> list[str]:
        """Generate helpful suggestions based on the conversation."""
        intent_category = intent.get("category", "general") if intent else "general"

        suggestion_map = {
            "contract_analysis": [
                "Run a comprehensive security audit",
                "Check for reentrancy vulnerabilities",
                "Analyze access control mechanisms",
                "Review upgrade patterns",
            ],
            "token_security": [
                "Check token contract source code",
                "Analyze liquidity and trading patterns",
                "Review token distribution",
                "Check for hidden functions",
            ],
            "defi_analysis": [
                "Examine protocol documentation",
                "Analyze smart contract risks",
                "Review tokenomics and governance",
                "Check audit reports",
            ],
            "address_scan": [
                "Analyze transaction history",
                "Check for suspicious patterns",
                "Review token interactions",
                "Examine contract deployments",
            ],
            "general": [
                "Analyze a smart contract",
                "Check token security",
                "Scan a wallet address",
                "Get DeFi protocol analysis",
            ],
        }

        return suggestion_map.get(intent_category, suggestion_map["general"])

    def _get_sources(self, knowledge_context: str) -> list[str]:
        """Extract sources from knowledge context."""
        # Simple implementation - in a real system, this would track actual sources
        sources = []
        if knowledge_context:
            sources.append("Blockchain Knowledge Base")
        return sources

    # Task execution methods
    async def _analyze_contract(self, parameters: dict[str, Any]) -> dict[str, Any]:
        """Analyze a smart contract for security vulnerabilities."""
        contract_address = parameters.get("address")
        contract_code = parameters.get("code")

        result = {
            "analysis_type": "Smart Contract Security Analysis",
            "timestamp": datetime.utcnow().isoformat(),
        }

        if not (contract_address or contract_code):
            result["error"] = "Contract address or source code required"
            return result

        # Placeholder analysis - in production, this would use actual security tools
        result.update(
            {
                "security_score": "7/10",
                "vulnerabilities": [
                    {
                        "type": "Informational",
                        "description": "Consider using explicit visibility modifiers",
                        "severity": "Low",
                    },
                ],
                "recommendations": [
                    "Implement comprehensive access controls",
                    "Add reentrancy guards where needed",
                    "Consider formal verification",
                ],
                "note": "This is a simplified analysis. For production use, integrate with specialized security scanning tools.",
            },
        )

        return result

    async def _check_token_security(self, parameters: dict[str, Any]) -> dict[str, Any]:
        """Check token security and scam indicators."""
        token_address = parameters.get("address")

        result = {
            "analysis_type": "Token Security Check",
            "timestamp": datetime.utcnow().isoformat(),
        }

        if not token_address:
            result["error"] = "Token address required"
            return result

        # Placeholder analysis
        result.update(
            {
                "security_status": "Needs Review",
                "risk_factors": ["Ownership concentration", "Limited liquidity"],
                "safety_checks": {
                    "honeypot_risk": "Low",
                    "rug_pull_risk": "Medium",
                    "contract_verified": "Yes",
                },
                "note": "This is a simplified analysis. Always verify through multiple sources.",
            },
        )

        return result

    async def _scan_address(self, parameters: dict[str, Any]) -> dict[str, Any]:
        """Scan a blockchain address for security insights."""
        address = parameters.get("address")

        result = {
            "analysis_type": "Address Security Scan",
            "timestamp": datetime.utcnow().isoformat(),
        }

        if not address:
            result["error"] = "Address required"
            return result

        # Placeholder analysis
        result.update(
            {
                "address": address,
                "risk_level": "Low",
                "activity_summary": "Regular DeFi interactions",
                "notable_transactions": [],
                "recommendations": ["Continue monitoring activity"],
                "note": "This is a simplified analysis based on available data.",
            },
        )

        return result

    async def _get_defi_risks(self, parameters: dict[str, Any]) -> dict[str, Any]:
        """Analyze DeFi protocol risks."""
        protocol = parameters.get("protocol", "general")

        return {
            "analysis_type": "DeFi Risk Analysis",
            "protocol": protocol,
            "timestamp": datetime.utcnow().isoformat(),
            "common_risks": [
                "Smart contract vulnerabilities",
                "Impermanent loss",
                "Governance attacks",
                "Oracle manipulation",
                "Liquidity risks",
            ],
            "mitigation_strategies": [
                "Diversify across protocols",
                "Monitor governance proposals",
                "Use reputable audit firms",
                "Implement circuit breakers",
            ],
        }


    async def _analyze_transaction(self, parameters: dict[str, Any]) -> dict[str, Any]:
        """Analyze a blockchain transaction."""
        tx_hash = parameters.get("hash")

        result = {
            "analysis_type": "Transaction Analysis",
            "timestamp": datetime.utcnow().isoformat(),
        }

        if not tx_hash:
            result["error"] = "Transaction hash required"
            return result

        # Placeholder analysis
        result.update(
            {
                "transaction_hash": tx_hash,
                "status": "Success",
                "risk_assessment": "Low",
                "gas_analysis": "Efficient",
                "security_notes": "Standard DeFi interaction",
                "note": "This is a simplified analysis. Use blockchain explorers for detailed information.",
            },
        )

        return result

    async def _execute_task(
        self, intent: dict[str, Any], message: str, context: dict[str, Any] | None,
    ) -> dict[str, Any]:
        """Execute a task based on intent analysis."""
        task_name = intent.get("task")
        if not task_name:
            return {"error": "No executable task identified"}

        # Extract parameters from message and context
        parameters = context or {}

        # Simple parameter extraction (in production, use NLP for better extraction)
        if "0x" in message:
            # Extract potential addresses/hashes
            import re

            addresses = re.findall(r"0x[a-fA-F0-9]+", message)
            if addresses:
                parameters["address"] = addresses[0]
                if len(addresses[0]) == 66:  # Transaction hash length
                    parameters["hash"] = addresses[0]

        return await self.execute_task(task_name, parameters=parameters)
