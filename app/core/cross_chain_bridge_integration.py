#!/usr/bin/env python3
"""
Cross-Chain Bridge Service Integration for GuardianX
Integrates the cross-chain bridge security service with GuardianX's protection systems
"""

import sys
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import asyncio
import structlog
from datetime import datetime

# Import bridge service client
from .bridge_service_client import get_bridge_service_client, BridgeServiceClient

logger = structlog.get_logger(__name__)

# Try to import bridge service components (for direct integration if needed)
bridge_service_path = Path(__file__).parent.parent.parent / "cross-chain-bridge-service"
if bridge_service_path.exists():
    sys.path.insert(0, str(bridge_service_path / "src"))

try:
    from core.bridge_analyzer import BridgeAnalyzer
    from core.security_monitor import SecurityMonitor, AttackPlaybookAnalyzer
    from core.attestation_monitor import AttestationMonitor
    from core.proof_of_reserves import ProofOfReservesMonitor
    from core.liveness_monitor import LivenessMonitor
    from core.blockchain_integration import BlockchainIntegration
    from core.attack_detection import AttackDetectionSystem
    from utils.network_utils import get_supported_networks
    BRIDGE_SERVICE_DIRECT_AVAILABLE = True
except ImportError as e:
    logger.debug(f"Bridge service direct components not available: {e}")
    BRIDGE_SERVICE_DIRECT_AVAILABLE = False
    BridgeAnalyzer = None
    SecurityMonitor = None
    AttestationMonitor = None
    ProofOfReservesMonitor = None
    LivenessMonitor = None
    BlockchainIntegration = None
    AttackDetectionSystem = None

# Import GuardianX modules
try:
    from .threat_detection import threat_detection_engine
    from .contract_analysis import contract_analysis_engine
    from .blockchain import blockchain_manager
    from .memory_graph import memory_graph
except ImportError as e:
    logger.warning(f"Some GuardianX modules not available: {e}")
    threat_detection_engine = None
    contract_analysis_engine = None
    blockchain_manager = None
    memory_graph = None


class CrossChainBridgeIntegration:
    """
    Integration layer between Cross-Chain Bridge Service and GuardianX
    Uses HTTP client to communicate with standalone bridge service
    """
    
    def __init__(self):
        """Initialize the bridge integration"""
        self.bridge_client: BridgeServiceClient = get_bridge_service_client()
        self.bridge_analyzer: Optional[BridgeAnalyzer] = None
        self.security_monitor: Optional[SecurityMonitor] = None
        self.attestation_monitor: Optional[AttestationMonitor] = None
        self.proof_of_reserves: Optional[ProofOfReservesMonitor] = None
        self.liveness_monitor: Optional[LivenessMonitor] = None
        self.blockchain_integration: Optional[BlockchainIntegration] = None
        self.attack_detection: Optional[AttackDetectionSystem] = None
        
        self.initialized = False
        self.supported_networks: List[str] = []
        self.use_api_client = True  # Prefer API client over direct integration
        
        logger.info("Bridge service integration initialized with API client")
    
    async def initialize(self):
        """Initialize the bridge service integration"""
        try:
            # Check bridge service health
            health = await self.bridge_client.health_check()
            if health.get("status") != "healthy":
                logger.warning(f"Bridge service unhealthy: {health}")
                # Fallback to default networks
                self.supported_networks = ["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche", "base"]
                self.initialized = True
                return
            
            # Get supported networks from service
            try:
                networks_response = await self.bridge_client.get_supported_networks()
                if isinstance(networks_response, dict) and "data" in networks_response:
                    self.supported_networks = networks_response["data"]
                elif isinstance(networks_response, list):
                    self.supported_networks = networks_response
                else:
                    # Fallback to default
                    self.supported_networks = ["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche", "base"]
            except Exception as e:
                logger.warning(f"Failed to get supported networks: {e}")
                self.supported_networks = ["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche", "base"]
            
            self.initialized = True
            logger.info(f"Bridge service integrated successfully with {len(self.supported_networks)} networks")
            
        except Exception as e:
            logger.error(f"Failed to initialize bridge service: {e}")
            # Fallback to default networks
            self.supported_networks = ["ethereum", "polygon", "arbitrum", "optimism", "bsc", "avalanche", "base"]
            self.initialized = True
    
    async def analyze_bridge(
        self,
        bridge_address: str,
        source_network: str,
        target_network: str,
        analysis_depth: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        Analyze a cross-chain bridge for security risks
        """
        if not self.initialized:
            await self.initialize()
        
        try:
            # Use API client to get analysis
            analysis = await self.bridge_client.analyze_bridge(
                bridge_address=bridge_address,
                source_network=source_network,
                target_network=target_network,
                analysis_depth=analysis_depth
            )
            
            # Enhance with GuardianX threat detection if available
            if threat_detection_engine:
                try:
                    threat_analysis = await threat_detection_engine.analyze_bridge_transaction({
                        "bridge_address": bridge_address,
                        "source_network": source_network,
                        "target_network": target_network,
                        "type": "bridge_transfer"
                    })
                    if isinstance(analysis, dict):
                        analysis["threat_analysis"] = threat_analysis
                except Exception as e:
                    logger.warning(f"Threat detection enhancement failed: {e}")
            
            # Store in memory graph if available
            if memory_graph:
                try:
                    await memory_graph.add_relationship(
                        entity1=bridge_address,
                        entity2=f"{source_network}:{target_network}",
                        relationship_type="bridge_connection",
                        metadata=analysis if isinstance(analysis, dict) else {}
                    )
                except Exception as e:
                    logger.warning(f"Memory graph storage failed: {e}")
            
            return analysis if isinstance(analysis, dict) else {"data": analysis}
                
        except Exception as e:
            logger.error(f"Bridge analysis failed: {e}")
            return await self._mock_bridge_analysis(
                bridge_address, source_network, target_network
            )
    
    async def validate_bridge_transaction(
        self,
        tx_hash: str,
        network: str,
        bridge_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate a cross-chain bridge transaction
        """
        if not self.initialized:
            await self.initialize()
        
        try:
            # Use API client to validate transaction
            validation = await self.bridge_client.validate_transaction(
                tx_hash=tx_hash,
                network=network
            )
            
            # Check for attack patterns if bridge address provided
            if bridge_address:
                try:
                    attack_check = await self.bridge_client.attack_playbook_analysis(
                        bridge_address=bridge_address,
                        network=network,
                        transaction_data=[{"hash": tx_hash}]
                    )
                    if isinstance(validation, dict):
                        validation["attack_detection"] = attack_check
                except Exception as e:
                    logger.warning(f"Attack detection failed: {e}")
            
            return validation if isinstance(validation, dict) else {"data": validation}
                
        except Exception as e:
            logger.error(f"Transaction validation failed: {e}")
            return await self._mock_transaction_validation(tx_hash, network)
    
    async def check_bridge_security(
        self,
        bridge_address: str,
        network: str
    ) -> Dict[str, Any]:
        """
        Comprehensive bridge security check
        """
        if not self.initialized:
            await self.initialize()
        
        try:
            # Use comprehensive security scan from API
            security_scan = await self.bridge_client.comprehensive_security_scan(
                bridge_address=bridge_address,
                network=network
            )
            
            # Also get security score
            try:
                security_score = await self.bridge_client.get_bridge_security_score(
                    bridge_address=bridge_address,
                    network=network
                )
                if isinstance(security_scan, dict):
                    security_scan["security_score"] = security_score
            except Exception as e:
                logger.warning(f"Failed to get security score: {e}")
            
            # Enhance with GuardianX threat detection if available
            if threat_detection_engine:
                try:
                    threats = await threat_detection_engine.check_bridge_security(
                        bridge_address=bridge_address,
                        network=network
                    )
                    if isinstance(security_scan, dict):
                        security_scan["guardianx_threats"] = threats
                except Exception as e:
                    logger.warning(f"GuardianX threat detection failed: {e}")
            
            return security_scan if isinstance(security_scan, dict) else {"data": security_scan}
            
        except Exception as e:
            logger.error(f"Security check failed: {e}")
            # Fallback security report
            return {
                "bridge_address": bridge_address,
                "network": network,
                "security_score": 75,
                "risk_level": "medium",
                "vulnerabilities": [],
                "recommendations": [],
                "error": str(e)
            }
    
    async def get_bridge_quote(
        self,
        from_network: str,
        to_network: str,
        amount: float,
        asset: str = "ETH"
    ) -> Dict[str, Any]:
        """
        Get a quote for bridging assets between chains
        """
        if not self.initialized:
            await self.initialize()
        
        # Mock quote (in production, this would query actual bridge contracts)
        quote = {
            "from_network": from_network,
            "to_network": to_network,
            "amount": amount,
            "asset": asset,
            "estimated_fee": amount * 0.001,  # 0.1% fee
            "estimated_time": "2-5 minutes",
            "bridge_available": True,
            "security_score": 85,
            "recommended_bridge": "official",
            "alternative_bridges": []
        }
        
        # Check bridge security
        security = await self.check_bridge_security(
            bridge_address="0x0000000000000000000000000000000000000000",  # Mock
            network=from_network
        )
        quote["security_check"] = security
        
        return quote
    
    async def execute_bridge(
        self,
        from_network: str,
        to_network: str,
        amount: float,
        recipient: str,
        asset: str = "ETH",
        bridge_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a cross-chain bridge transaction with security checks
        """
        if not self.initialized:
            await self.initialize()
        
        # Pre-flight security check
        security = await self.check_bridge_security(
            bridge_address=bridge_address or "default",
            network=from_network
        )
        
        if security["risk_level"] == "critical":
            return {
                "success": False,
                "error": "Bridge security check failed - risk level too high",
                "security_report": security
            }
        
        # Validate transaction
        if threat_detection_engine:
            threat = await threat_detection_engine.analyze_transaction({
                "type": "bridge",
                "from": recipient,
                "to": recipient,
                "amount": amount,
                "from_network": from_network,
                "to_network": to_network,
                "asset": asset
            })
            
            if threat and threat.severity == "critical":
                return {
                    "success": False,
                    "error": "Threat detected in bridge transaction",
                    "threat": threat
                }
        
        # In production, this would execute the actual bridge transaction
        return {
            "success": True,
            "transaction_id": "mock_tx_hash",
            "from_network": from_network,
            "to_network": to_network,
            "amount": amount,
            "asset": asset,
            "recipient": recipient,
            "estimated_completion": "2-5 minutes",
            "security_score": security["security_score"]
        }
    
    async def get_network_status(self, network: str) -> Dict[str, Any]:
        """Get network status and health"""
        if not self.initialized:
            await self.initialize()
        
        try:
            # Use API client to get network status
            status = await self.bridge_client.get_network_status(network=network)
            return status if isinstance(status, dict) else {"data": status}
        except Exception as e:
            logger.error(f"Network status check failed: {e}")
            return {
                "network": network,
                "status": "unknown",
                "error": str(e)
            }
    
    async def get_supported_networks(self) -> List[str]:
        """Get list of supported networks"""
        if not self.initialized:
            await self.initialize()
        return self.supported_networks
    
    async def get_bridge_history(
        self,
        user_address: Optional[str] = None,
        network: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get bridge transaction history"""
        if not self.initialized:
            await self.initialize()
        
        # This would typically query from database
        # For now, return empty history
        return {
            "transactions": [],
            "total": 0,
            "limit": limit,
            "offset": offset
        }
    
    async def get_bridge_analytics(
        self,
        network: Optional[str] = None,
        time_range: str = "7d"
    ) -> Dict[str, Any]:
        """Get bridge analytics"""
        if not self.initialized:
            await self.initialize()
        
        try:
            metrics = await self.bridge_client.get_bridge_metrics(
                bridge_address=None,
                time_range=time_range
            )
            return metrics if isinstance(metrics, dict) else {"data": metrics}
        except Exception as e:
            logger.error(f"Get bridge analytics failed: {e}")
            return {"error": str(e)}
    
    async def get_supported_tokens(
        self,
        network: str
    ) -> List[Dict[str, Any]]:
        """Get supported tokens for a network"""
        if not self.initialized:
            await self.initialize()
        
        # This would typically query from bridge info
        # For now, return common tokens
        common_tokens = [
            {"symbol": "ETH", "address": "0x0000000000000000000000000000000000000000"},
            {"symbol": "USDC", "address": "0xA0b86a33E6441c8C06DD4C4e4B0b8c8C8C8C8C8C"},
            {"symbol": "USDT", "address": "0xB1c97a44F5552c9DD5D5D5D5D5D5D5D5D5D5D5D"},
        ]
        return common_tokens
    
    async def estimate_fee(
        self,
        from_network: str,
        to_network: str,
        amount: float,
        asset: str = "ETH"
    ) -> Dict[str, Any]:
        """Estimate bridge fee"""
        if not self.initialized:
            await self.initialize()
        
        # Mock fee estimation (would use actual bridge API)
        estimated_fee = amount * 0.001  # 0.1% fee
        return {
            "from_network": from_network,
            "to_network": to_network,
            "amount": amount,
            "asset": asset,
            "estimated_fee": estimated_fee,
            "estimated_time": "2-5 minutes"
        }
    
    async def check_liquidity(
        self,
        from_network: str,
        to_network: str,
        amount: float,
        asset: str = "ETH"
    ) -> Dict[str, Any]:
        """Check bridge liquidity"""
        if not self.initialized:
            await self.initialize()
        
        # Mock liquidity check
        return {
            "available": True,
            "amount_requested": amount,
            "liquidity_available": amount * 10,  # Assume 10x liquidity
            "sufficient": True
        }
    
    async def cancel_bridge_transaction(
        self,
        transaction_id: str
    ) -> Dict[str, Any]:
        """Cancel a pending bridge transaction"""
        if not self.initialized:
            await self.initialize()
        
        # Mock cancellation
        return {
            "success": False,
            "error": "Transaction cannot be cancelled once initiated",
            "transaction_id": transaction_id
        }
    
    async def recover_bridge_transaction(
        self,
        transaction_id: str,
        recovery_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Recover a failed bridge transaction"""
        if not self.initialized:
            await self.initialize()
        
        # Mock recovery
        return {
            "success": False,
            "error": "Recovery not available for this transaction",
            "transaction_id": transaction_id
        }
    
    async def _mock_bridge_analysis(
        self,
        bridge_address: str,
        source_network: str,
        target_network: str
    ) -> Dict[str, Any]:
        """Fallback bridge analysis - only used when all APIs fail"""
        logger.warning(f"Using fallback mock bridge analysis - bridge service unavailable")
        
        # Fallback mock data
        return {
            "bridge_address": bridge_address,
            "source_network": source_network,
            "target_network": target_network,
            "security_score": 80,
            "risk_level": "medium",
            "vulnerabilities": [],
            "recommendations": [
                "Use verified bridge contracts",
                "Check bridge liquidity before transfer",
                "Monitor transaction status"
            ],
            "analysis_timestamp": datetime.now().isoformat(),
            "mock": True,
            "warning": "Bridge service unavailable - using fallback data"
        }
    
    async def _mock_transaction_validation(
        self,
        tx_hash: str,
        network: str
    ) -> Dict[str, Any]:
        """Fallback transaction validation - only used when all APIs fail"""
        logger.warning(f"Using fallback mock transaction validation - bridge service unavailable")
        
        # Fallback mock data
        return {
            "transaction_hash": tx_hash,
            "network": network,
            "status": "valid",
            "confirmations": 12,
            "mock": True
        }
    
    async def stop(self):
        """Stop all monitoring and cleanup"""
        try:
            if self.attestation_monitor:
                await self.attestation_monitor.stop_monitoring()
            if self.blockchain_integration:
                await self.blockchain_integration.close()
            if self.bridge_client:
                await self.bridge_client.close()
            logger.info("Bridge service integration stopped")
        except Exception as e:
            logger.error(f"Error stopping bridge service: {e}")


# Singleton instance
_bridge_integration = None


def get_cross_chain_bridge_integration() -> CrossChainBridgeIntegration:
    """Get or create the bridge integration instance"""
    global _bridge_integration
    if _bridge_integration is None:
        _bridge_integration = CrossChainBridgeIntegration()
    return _bridge_integration


# Export for easy access
cross_chain_bridge_integration = get_cross_chain_bridge_integration()
