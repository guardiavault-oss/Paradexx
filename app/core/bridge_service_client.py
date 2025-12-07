#!/usr/bin/env python3
"""
Bridge Service Client
HTTP client for communicating with the standalone cross-chain bridge service
"""

import os
from typing import Any, Dict, List, Optional
import httpx
import structlog

logger = structlog.get_logger(__name__)


class BridgeServiceClient:
    """
    Client for communicating with the cross-chain bridge security service
    """
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize the bridge service client
        
        Args:
            base_url: Base URL of the bridge service (defaults to env var or localhost)
        """
        # Default to a different port to avoid conflict with FastAPI
        self.base_url = base_url or os.getenv(
            "BRIDGE_SERVICE_URL", 
            "http://localhost:8001"  # Changed from 8000 to avoid conflict
        )
        self.timeout = 3.0  # Reduced timeout to prevent hanging
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                follow_redirects=True
            )
        return self._client
    
    async def close(self):
        """Close the HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if bridge service is healthy"""
        try:
            client = await self._get_client()
            response = await client.get("/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Bridge service health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}
    
    # Bridge Analysis Endpoints
    
    async def analyze_bridge(
        self,
        bridge_address: str,
        source_network: str,
        target_network: str,
        analysis_depth: str = "comprehensive"
    ) -> Dict[str, Any]:
        """Analyze a cross-chain bridge"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/analyze",
                json={
                    "bridge_address": bridge_address,
                    "source_network": source_network,
                    "target_network": target_network,
                    "analysis_depth": analysis_depth
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Bridge analysis failed: {e}")
            raise
    
    async def get_bridge_security_score(
        self,
        bridge_address: str,
        network: str,
        scoring_criteria: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get bridge security score"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/security-score",
                json={
                    "bridge_address": bridge_address,
                    "network": network,
                    "scoring_criteria": scoring_criteria or [
                        "code_quality",
                        "audit_status",
                        "governance_decentralization",
                        "validator_set",
                        "economic_security",
                        "operational_security"
                    ]
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get security score failed: {e}")
            raise
    
    async def simulate_attack(
        self,
        bridge_address: str,
        attack_type: str,
        attack_parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Simulate bridge attack"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/simulate-attack",
                json={
                    "bridge_address": bridge_address,
                    "attack_type": attack_type,
                    "attack_parameters": attack_parameters or {},
                    "simulation_options": {
                        "safe_mode": True,
                        "detailed_analysis": True,
                        "mitigation_suggestions": True
                    }
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Attack simulation failed: {e}")
            raise
    
    async def get_bridge_metrics(
        self,
        bridge_address: Optional[str] = None,
        time_range: str = "7d"
    ) -> Dict[str, Any]:
        """Get bridge metrics"""
        try:
            client = await self._get_client()
            params = {"time_range": time_range}
            if bridge_address:
                params["bridge_address"] = bridge_address
            
            response = await client.get(
                "/api/v1/bridge/metrics",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get bridge metrics failed: {e}")
            raise
    
    async def list_bridges(
        self,
        network: Optional[str] = None,
        bridge_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """List known bridges"""
        try:
            client = await self._get_client()
            params = {"limit": limit, "offset": offset}
            if network:
                params["network"] = network
            if bridge_type:
                params["bridge_type"] = bridge_type
            
            response = await client.get(
                "/api/v1/bridge/list",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"List bridges failed: {e}")
            raise
    
    async def get_bridge_info(self, bridge_address: str) -> Dict[str, Any]:
        """Get bridge information"""
        try:
            client = await self._get_client()
            response = await client.get(
                f"/api/v1/bridge/{bridge_address}/info"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get bridge info failed: {e}")
            raise
    
    # Advanced Security Endpoints
    
    async def detect_attestation_anomalies(
        self,
        bridge_address: str,
        network: str,
        time_range: str = "24h",
        include_details: bool = True
    ) -> Dict[str, Any]:
        """Detect attestation anomalies"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/detect-attestation-anomalies",
                json={
                    "bridge_address": bridge_address,
                    "network": network,
                    "time_range": time_range,
                    "include_details": include_details
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Detect attestation anomalies failed: {e}")
            raise
    
    async def analyze_quorum_skews(
        self,
        bridge_address: str,
        network: str,
        analysis_period: str = "7d"
    ) -> Dict[str, Any]:
        """Analyze quorum skews"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/analyze-quorum-skews",
                json={
                    "bridge_address": bridge_address,
                    "network": network,
                    "analysis_period": analysis_period
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Analyze quorum skews failed: {e}")
            raise
    
    async def proof_of_reserves_monitoring(
        self,
        bridge_address: str,
        network: str,
        include_asset_breakdown: bool = True
    ) -> Dict[str, Any]:
        """Monitor proof of reserves"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/proof-of-reserves-monitoring",
                json={
                    "bridge_address": bridge_address,
                    "network": network,
                    "include_asset_breakdown": include_asset_breakdown
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Proof of reserves monitoring failed: {e}")
            raise
    
    async def attack_playbook_analysis(
        self,
        bridge_address: str,
        network: str,
        transaction_data: List[Dict[str, Any]],
        attack_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Analyze against attack playbooks"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/attack-playbook-analysis",
                json={
                    "bridge_address": bridge_address,
                    "network": network,
                    "transaction_data": transaction_data,
                    "attack_types": attack_types or ["all"]
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Attack playbook analysis failed: {e}")
            raise
    
    async def validate_signatures(
        self,
        bridge_address: str,
        network: str,
        signatures: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Validate signatures"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/validate-signatures",
                json={
                    "bridge_address": bridge_address,
                    "network": network,
                    "signatures": signatures
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Validate signatures failed: {e}")
            raise
    
    async def comprehensive_security_scan(
        self,
        bridge_address: str,
        network: str,
        transaction_data: Optional[List[Dict[str, Any]]] = None,
        scan_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Comprehensive security scan"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/bridge/comprehensive-security-scan",
                json={
                    "bridge_address": bridge_address,
                    "network": network,
                    "transaction_data": transaction_data or [],
                    "scan_options": scan_options or {
                        "include_attack_analysis": True,
                        "include_signature_analysis": True,
                        "include_attestation_analysis": True,
                        "include_quorum_analysis": True,
                        "deep_scan": False
                    }
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Comprehensive security scan failed: {e}")
            raise
    
    # Network Endpoints
    
    async def get_network_status(
        self,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get network status"""
        try:
            client = await self._get_client()
            url = "/api/v1/network/status"
            if network:
                url = f"/api/v1/network/{network}/status"
            
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get network status failed: {e}")
            raise
    
    async def get_supported_networks(self) -> Dict[str, Any]:
        """Get supported networks"""
        try:
            client = await self._get_client()
            response = await client.get("/api/v1/network/supported")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get supported networks failed: {e}")
            raise
    
    # Transaction Endpoints
    
    async def validate_transaction(
        self,
        tx_hash: str,
        network: str
    ) -> Dict[str, Any]:
        """Validate cross-chain transaction"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/transaction/validate",
                json={
                    "transaction_hash": tx_hash,
                    "network": network
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Validate transaction failed: {e}")
            raise
    
    async def get_transaction_status(
        self,
        tx_hash: str
    ) -> Dict[str, Any]:
        """Get transaction status"""
        try:
            client = await self._get_client()
            response = await client.get(f"/api/v1/transaction/{tx_hash}/status")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get transaction status failed: {e}")
            raise
    
    # Vulnerability Endpoints
    
    async def scan_vulnerabilities(
        self,
        contract_addresses: List[str],
        networks: List[str],
        scan_type: str = "comprehensive"
    ) -> Dict[str, Any]:
        """Scan for vulnerabilities"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/vulnerability/scan",
                json={
                    "contract_addresses": contract_addresses,
                    "networks": networks,
                    "scan_type": scan_type
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Scan vulnerabilities failed: {e}")
            raise
    
    # Security Monitoring Endpoints
    
    async def get_security_dashboard(self) -> Dict[str, Any]:
        """Get security dashboard"""
        try:
            client = await self._get_client()
            response = await client.get("/api/v1/security/dashboard")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get security dashboard failed: {e}")
            raise
    
    async def get_security_events(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get security events"""
        try:
            client = await self._get_client()
            response = await client.get(
                "/api/v1/security/events",
                params={"limit": limit, "offset": offset}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get security events failed: {e}")
            raise


# Singleton instance
_bridge_service_client: Optional[BridgeServiceClient] = None


def get_bridge_service_client() -> BridgeServiceClient:
    """Get or create bridge service client instance"""
    global _bridge_service_client
    if _bridge_service_client is None:
        _bridge_service_client = BridgeServiceClient()
    return _bridge_service_client

