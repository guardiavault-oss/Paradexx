#!/usr/bin/env python3
"""
Voice Interface for GuardianX
Converts voice commands to transaction intents
"""

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class VoiceCommand:
    """Parsed voice command"""
    intent: str  # "transfer", "swap", "approve", "check_balance", etc.
    parameters: Dict[str, Any]
    confidence: float
    raw_text: str


class VoiceIntentParser:
    """Parse voice commands into transaction intents"""
    
    def __init__(self):
        self.intent_patterns = self._load_intent_patterns()
    
    def _load_intent_patterns(self) -> Dict[str, List[str]]:
        """Load intent recognition patterns"""
        return {
            "transfer": [
                r"send\s+(\d+(?:\.\d+)?)\s+(?:eth|ethereum|tokens?)\s+to\s+([0-9a-fA-Fx]{42})",
                r"transfer\s+(\d+(?:\.\d+)?)\s+to\s+([0-9a-fA-Fx]{42})",
                r"pay\s+(\d+(?:\.\d+)?)\s+to\s+([0-9a-fA-Fx]{42})"
            ],
            "swap": [
                r"swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+for\s+(\w+)",
                r"exchange\s+(\d+(?:\.\d+)?)\s+(\w+)\s+for\s+(\w+)",
                r"convert\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)"
            ],
            "approve": [
                r"approve\s+(\w+)\s+for\s+([0-9a-fA-Fx]{42})",
                r"allow\s+(\w+)\s+to\s+spend\s+([0-9a-fA-Fx]{42})"
            ],
            "check_balance": [
                r"(?:check|show|what is)\s+(?:my\s+)?balance",
                r"how much\s+(?:eth|ethereum|tokens?)\s+do i have"
            ],
            "check_risk": [
                r"(?:check|analyze|is\s+it\s+safe)\s+(?:this\s+)?transaction",
                r"what is the risk of\s+(?:this\s+)?transaction"
            ]
        }
    
    def parse(self, voice_text: str) -> Optional[VoiceCommand]:
        """
        Parse voice text into a command
        
        Args:
            voice_text: Voice command text
        
        Returns:
            VoiceCommand or None
        """
        voice_text = voice_text.lower().strip()
        
        best_match = None
        best_confidence = 0.0
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, voice_text)
                if match:
                    confidence = len(match.group(0)) / len(voice_text)
                    if confidence > best_confidence:
                        best_confidence = confidence
                        parameters = self._extract_parameters(intent, match, voice_text)
                        best_match = VoiceCommand(
                            intent=intent,
                            parameters=parameters,
                            confidence=confidence,
                            raw_text=voice_text
                        )
        
        if best_match:
            logger.info("Voice command parsed", intent=best_match.intent, confidence=best_match.confidence)
        else:
            logger.warning("Could not parse voice command", text=voice_text)
        
        return best_match
    
    def _extract_parameters(self, intent: str, match: re.Match, text: str) -> Dict[str, Any]:
        """Extract parameters from matched pattern"""
        parameters = {}
        
        if intent == "transfer":
            if len(match.groups()) >= 2:
                parameters["amount"] = float(match.group(1))
                parameters["to_address"] = match.group(2)
        
        elif intent == "swap":
            if len(match.groups()) >= 3:
                parameters["amount"] = float(match.group(1))
                parameters["token_in"] = match.group(2)
                parameters["token_out"] = match.group(3)
        
        elif intent == "approve":
            if len(match.groups()) >= 2:
                parameters["token"] = match.group(1)
                parameters["spender"] = match.group(2)
        
        return parameters


class VoiceInterface:
    """Voice interface for GuardianX"""
    
    def __init__(self):
        self.parser = VoiceIntentParser()
    
    async def process_voice_command(
        self,
        voice_text: str,
        wallet_address: str,
        network: str = "ethereum"
    ) -> Dict[str, Any]:
        """
        Process voice command and return response
        
        Args:
            voice_text: Voice command text
            wallet_address: Wallet address
            network: Network name
        
        Returns:
            Response dictionary
        """
        try:
            command = self.parser.parse(voice_text)
            
            if not command:
                return {
                    "success": False,
                    "message": "Could not understand command. Please try again.",
                    "suggestions": ["Send 0.1 ETH to 0x...", "Swap 100 USDC for ETH", "Check my balance"]
                }
            
            # Execute command based on intent
            if command.intent == "transfer":
                return await self._handle_transfer(command, wallet_address, network)
            elif command.intent == "swap":
                return await self._handle_swap(command, wallet_address, network)
            elif command.intent == "approve":
                return await self._handle_approve(command, wallet_address, network)
            elif command.intent == "check_balance":
                return await self._handle_check_balance(wallet_address, network)
            elif command.intent == "check_risk":
                return await self._handle_check_risk(wallet_address, network)
            else:
                return {
                    "success": False,
                    "message": f"Intent '{command.intent}' not yet supported"
                }
                
        except Exception as e:
            logger.error("Error processing voice command", error=str(e))
            return {
                "success": False,
                "message": f"Error processing command: {str(e)}"
            }
    
    async def _handle_transfer(
        self,
        command: VoiceCommand,
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """Handle transfer command"""
        from .local_ml_model import get_local_ai_agent, TransactionIntent
        
        amount = command.parameters.get("amount", 0)
        to_address = command.parameters.get("to_address")
        
        if not to_address:
            return {
                "success": False,
                "message": "Recipient address not found in command"
            }
        
        # Create transaction intent
        intent = TransactionIntent(
            wallet_address=wallet_address,
            network=network,
            to_address=to_address,
            value=int(amount * 1e18)  # Convert to wei
        )
        
        # Analyze transaction
        ai_agent = get_local_ai_agent()
        recommendation = await ai_agent.analyze_transaction_intent(intent)
        
        return {
            "success": True,
            "intent": "transfer",
            "message": f"Prepared transfer of {amount} ETH to {to_address[:10]}...",
            "risk_score": recommendation.risk_score,
            "risk_level": recommendation.risk_level,
            "recommendation": recommendation.recommendation,
            "explanation": recommendation.explanation,
            "requires_confirmation": recommendation.risk_level in ["high", "critical"]
        }
    
    async def _handle_swap(
        self,
        command: VoiceCommand,
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """Handle swap command"""
        return {
            "success": True,
            "intent": "swap",
            "message": "Swap command received. Processing...",
            "parameters": command.parameters
        }
    
    async def _handle_approve(
        self,
        command: VoiceCommand,
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """Handle approve command"""
        return {
            "success": True,
            "intent": "approve",
            "message": "Approve command received. Processing...",
            "parameters": command.parameters
        }
    
    async def _handle_check_balance(
        self,
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """Handle check balance command"""
        from .blockchain import blockchain_manager
        
        try:
            provider = blockchain_manager.get_provider(network)
            if provider:
                balance = await provider.get_balance(wallet_address)
                balance_eth = balance / 1e18
                
                return {
                    "success": True,
                    "intent": "check_balance",
                    "message": f"Your balance is {balance_eth:.4f} ETH",
                    "balance": balance_eth,
                    "balance_wei": balance
                }
            else:
                return {
                    "success": False,
                    "message": "Network provider not available"
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error checking balance: {str(e)}"
            }
    
    async def _handle_check_risk(
        self,
        wallet_address: str,
        network: str
    ) -> Dict[str, Any]:
        """Handle check risk command"""
        from .memory_graph import memory_graph
        
        insights = memory_graph.get_behavior_insights(wallet_address, network)
        
        return {
            "success": True,
            "intent": "check_risk",
            "message": f"Your wallet safety score is {insights.get('average_risk_score', 0):.2f}",
            "insights": insights
        }


# Global voice interface instance
voice_interface = VoiceInterface()

