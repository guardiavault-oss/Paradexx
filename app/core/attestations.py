#!/usr/bin/env python3
"""
zk-Verification Layer for GuardianX
Provable attestations for AI decisions and risk assessments
"""

import hashlib
import json
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog

from .mpc_hsm_integration import mpc_hsm_integration

logger = structlog.get_logger(__name__)


class AttestationType(Enum):
    TRANSACTION_DECISION = "transaction_decision"
    RISK_SCORE = "risk_score"
    TOKEN_SAFETY = "token_safety"
    CONTRACT_ANALYSIS = "contract_analysis"
    MEV_DETECTION = "mev_detection"
    BEHAVIOR_ANALYSIS = "behavior_analysis"


class AttestationStatus(Enum):
    PENDING = "pending"
    SIGNED = "signed"
    VERIFIED = "verified"
    EXPIRED = "expired"


@dataclass
class DecisionAttestation:
    """
    Provable attestation for an AI decision
    """
    # Required fields (no defaults)
    attestation_id: str
    attestation_type: AttestationType
    wallet_address: str
    inputs_hash: str  # Hash of input data
    model_version: str  # Model version or rule-set ID
    risk_score: float  # 0.0-1.0
    decision: str  # "approved", "rejected", "blocked", "rewritten"
    
    # Optional fields (with defaults)
    transaction_id: Optional[str] = None  # Transaction hash or intent ID
    network: str = "ethereum"
    explanation: str = ""
    
    # Attestation metadata
    timestamp: float = field(default_factory=time.time)
    signature: Optional[str] = None
    signer_id: Optional[str] = None
    status: AttestationStatus = AttestationStatus.PENDING
    
    # Additional data
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # zk proof (future)
    zk_proof: Optional[str] = None
    zk_circuit_id: Optional[str] = None


class AttestationEngine:
    """
    Engine for creating and verifying decision attestations
    """
    
    def __init__(self):
        self.attestations: Dict[str, DecisionAttestation] = {}
        self.model_version = "guardianx-v1.0"
        self.signing_key_id = "guardianx-attestation-key"
    
    def create_decision_attestation(
        self,
        wallet_address: str,
        transaction_id: Optional[str],
        network: str,
        inputs: Dict[str, Any],
        risk_score: float,
        decision: str,
        explanation: str = "",
        attestation_type: AttestationType = AttestationType.TRANSACTION_DECISION,
        metadata: Optional[Dict[str, Any]] = None
    ) -> DecisionAttestation:
        """
        Create a decision attestation
        
        Args:
            wallet_address: Wallet address
            transaction_id: Transaction hash or intent ID
            network: Network name
            inputs: Input data dictionary (will be hashed)
            risk_score: Risk score (0.0-1.0)
            decision: Decision made
            explanation: Human-readable explanation
            attestation_type: Type of attestation
            metadata: Additional metadata
        
        Returns:
            DecisionAttestation object
        """
        # Generate inputs hash
        inputs_json = json.dumps(inputs, sort_keys=True)
        inputs_hash = hashlib.sha256(inputs_json.encode()).hexdigest()
        
        # Generate attestation ID
        attestation_id = self._generate_attestation_id(
            wallet_address, transaction_id, inputs_hash
        )
        
        # Create attestation
        attestation = DecisionAttestation(
            attestation_id=attestation_id,
            attestation_type=attestation_type,
            wallet_address=wallet_address.lower(),
            transaction_id=transaction_id,
            network=network,
            inputs_hash=inputs_hash,
            model_version=self.model_version,
            risk_score=risk_score,
            decision=decision,
            explanation=explanation,
            metadata=metadata or {}
        )
        
        # Sign the attestation
        self._sign_attestation(attestation)
        
        # Store attestation
        self.attestations[attestation_id] = attestation
        
        logger.info(
            "Decision attestation created",
            attestation_id=attestation_id,
            wallet=wallet_address,
            decision=decision,
            risk_score=risk_score
        )
        
        return attestation
    
    def _generate_attestation_id(
        self,
        wallet_address: str,
        transaction_id: Optional[str],
        inputs_hash: str
    ) -> str:
        """Generate unique attestation ID"""
        data = f"{wallet_address}_{transaction_id or 'none'}_{inputs_hash}_{time.time()}"
        return f"attest_{hashlib.sha256(data.encode()).hexdigest()[:16]}"
    
    def _sign_attestation(self, attestation: DecisionAttestation):
        """Sign an attestation using MPC/HSM"""
        try:
            # Create signable payload
            payload = self._create_signable_payload(attestation)
            
            # Sign using MPC/HSM (simplified - would use actual signing)
            # For now, create a mock signature
            signature = hashlib.sha256(
                f"{payload}_{self.signing_key_id}".encode()
            ).hexdigest()
            
            attestation.signature = signature
            attestation.signer_id = self.signing_key_id
            attestation.status = AttestationStatus.SIGNED
            
            logger.debug(
                "Attestation signed",
                attestation_id=attestation.attestation_id,
                signer_id=self.signing_key_id
            )
            
        except Exception as e:
            logger.error(
                "Failed to sign attestation",
                attestation_id=attestation.attestation_id,
                error=str(e)
            )
            attestation.status = AttestationStatus.PENDING
    
    def _create_signable_payload(self, attestation: DecisionAttestation) -> str:
        """Create signable payload from attestation"""
        # Create canonical representation
        payload_data = {
            "attestation_id": attestation.attestation_id,
            "type": attestation.attestation_type.value,
            "wallet": attestation.wallet_address,
            "transaction_id": attestation.transaction_id,
            "network": attestation.network,
            "inputs_hash": attestation.inputs_hash,
            "model_version": attestation.model_version,
            "risk_score": attestation.risk_score,
            "decision": attestation.decision,
            "timestamp": attestation.timestamp
        }
        
        payload_json = json.dumps(payload_data, sort_keys=True)
        return payload_json
    
    def verify_attestation(
        self,
        attestation_id: str
    ) -> bool:
        """
        Verify an attestation signature
        
        Args:
            attestation_id: Attestation ID
        
        Returns:
            True if valid, False otherwise
        """
        if attestation_id not in self.attestations:
            logger.warning("Attestation not found", attestation_id=attestation_id)
            return False
        
        attestation = self.attestations[attestation_id]
        
        if attestation.status != AttestationStatus.SIGNED:
            logger.warning(
                "Attestation not signed",
                attestation_id=attestation_id,
                status=attestation.status.value
            )
            return False
        
        # Verify signature (simplified - would use actual signature verification)
        payload = self._create_signable_payload(attestation)
        expected_signature = hashlib.sha256(
            f"{payload}_{attestation.signer_id}".encode()
        ).hexdigest()
        
        if attestation.signature == expected_signature:
            attestation.status = AttestationStatus.VERIFIED
            logger.info("Attestation verified", attestation_id=attestation_id)
            return True
        else:
            logger.warning("Attestation signature invalid", attestation_id=attestation_id)
            return False
    
    def get_attestation(
        self,
        attestation_id: str
    ) -> Optional[DecisionAttestation]:
        """
        Get an attestation by ID
        
        Args:
            attestation_id: Attestation ID
        
        Returns:
            DecisionAttestation or None
        """
        return self.attestations.get(attestation_id)
    
    def get_wallet_attestations(
        self,
        wallet_address: str,
        network: Optional[str] = None,
        limit: int = 100
    ) -> List[DecisionAttestation]:
        """
        Get all attestations for a wallet
        
        Args:
            wallet_address: Wallet address
            network: Optional network filter
            limit: Maximum number of attestations to return
        
        Returns:
            List of DecisionAttestation objects
        """
        wallet_address = wallet_address.lower()
        
        matching = [
            att for att in self.attestations.values()
            if att.wallet_address == wallet_address
            and (network is None or att.network == network)
        ]
        
        # Sort by timestamp (newest first)
        matching.sort(key=lambda x: x.timestamp, reverse=True)
        
        return matching[:limit]
    
    def get_wallet_safety_score(
        self,
        wallet_address: str,
        network: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get wallet safety score based on attestations
        
        Args:
            wallet_address: Wallet address
            network: Optional network filter
        
        Returns:
            Dictionary with safety score and statistics
        """
        attestations = self.get_wallet_attestations(wallet_address, network)
        
        if not attestations:
            return {
                "wallet_address": wallet_address,
                "network": network,
                "safety_score": 0.5,  # Default unknown score
                "attestation_count": 0,
                "average_risk_score": 0.5,
                "decision_distribution": {},
                "last_attestation": None
            }
        
        # Calculate average risk score (inverted for safety score)
        risk_scores = [att.risk_score for att in attestations]
        avg_risk_score = sum(risk_scores) / len(risk_scores)
        safety_score = 1.0 - avg_risk_score
        
        # Decision distribution
        decision_counts = {}
        for att in attestations:
            decision_counts[att.decision] = decision_counts.get(att.decision, 0) + 1
        
        return {
            "wallet_address": wallet_address,
            "network": network,
            "safety_score": safety_score,
            "attestation_count": len(attestations),
            "average_risk_score": avg_risk_score,
            "decision_distribution": decision_counts,
            "last_attestation": attestations[0].timestamp if attestations else None
        }
    
    async def generate_zk_proof(
        self,
        attestation_id: str,
        circuit_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate zk proof for an attestation using Noir/RISC0
        
        Args:
            attestation_id: Attestation ID
            circuit_id: Optional circuit ID (Noir/RISC0)
        
        Returns:
            zk proof as string (or None if generation fails)
        """
        if attestation_id not in self.attestations:
            return None
        
        attestation = self.attestations[attestation_id]
        
        try:
            from .zk_proofs import zk_proof_engine, ZKCircuitType
            
            # Prepare attestation data
            attestation_data = {
                "attestation_id": attestation_id,
                "inputs_hash": attestation.inputs_hash,
                "risk_score": attestation.risk_score,
                "decision": attestation.decision,
                "model_version": attestation.model_version,
                "wallet_address": attestation.wallet_address,
                "timestamp": attestation.timestamp
            }
            
            # Generate proof
            circuit_type = ZKCircuitType.NOIR_DECISION_PROOF if not circuit_id else ZKCircuitType.CUSTOM_CIRCUIT
            proof = await zk_proof_engine.generate_attestation_proof(attestation_data, circuit_type)
            
            if proof:
                attestation.zk_proof = proof.proof_data
                attestation.zk_circuit_id = proof.circuit_id
                
                logger.info(
                    "zk proof generated",
                    attestation_id=attestation_id,
                    proof_id=proof.proof_id,
                    circuit_id=proof.circuit_id
                )
                
                return proof.proof_data
            else:
                logger.warning("zk proof generation failed", attestation_id=attestation_id)
                return None
                
        except ImportError:
            logger.warning("zk proof engine not available, using stub")
            # Fallback to stub
            proof_data = {
                "attestation_id": attestation_id,
                "inputs_hash": attestation.inputs_hash,
                "risk_score": attestation.risk_score,
                "decision": attestation.decision,
                "circuit_id": circuit_id or "guardianx-decision-v1"
            }
            proof_hash = hashlib.sha256(json.dumps(proof_data, sort_keys=True).encode()).hexdigest()
            attestation.zk_proof = proof_hash
            attestation.zk_circuit_id = circuit_id or "guardianx-decision-v1"
            return proof_hash
        except Exception as e:
            logger.error("Error generating zk proof", error=str(e))
            return None
    
    def verify_zk_proof(
        self,
        attestation_id: str,
        proof: str
    ) -> bool:
        """
        Verify a zk proof (stub for future implementation)
        
        Args:
            attestation_id: Attestation ID
            proof: zk proof string
        
        Returns:
            True if proof is valid
        """
        if attestation_id not in self.attestations:
            return False
        
        attestation = self.attestations[attestation_id]
        
        if attestation.zk_proof != proof:
            return False
        
        # Stub verification - would use actual zk verification in production
        logger.info("zk proof verified (stub)", attestation_id=attestation_id)
        return True
    
    def export_attestation(
        self,
        attestation_id: str,
        format: str = "json"
    ) -> str:
        """
        Export an attestation for external verification
        
        Args:
            attestation_id: Attestation ID
            format: Export format ("json", "verifiable")
        
        Returns:
            Exported attestation as string
        """
        if attestation_id not in self.attestations:
            raise ValueError(f"Attestation {attestation_id} not found")
        
        attestation = self.attestations[attestation_id]
        
        if format == "json":
            return json.dumps(asdict(attestation), indent=2, default=str)
        elif format == "verifiable":
            # Verifiable format includes signature and proof
            verifiable_data = {
                "attestation_id": attestation.attestation_id,
                "type": attestation.attestation_type.value,
                "wallet_address": attestation.wallet_address,
                "transaction_id": attestation.transaction_id,
                "network": attestation.network,
                "inputs_hash": attestation.inputs_hash,
                "model_version": attestation.model_version,
                "risk_score": attestation.risk_score,
                "decision": attestation.decision,
                "explanation": attestation.explanation,
                "timestamp": attestation.timestamp,
                "signature": attestation.signature,
                "signer_id": attestation.signer_id,
                "zk_proof": attestation.zk_proof,
                "zk_circuit_id": attestation.zk_circuit_id
            }
            return json.dumps(verifiable_data, indent=2, default=str)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get attestation engine metrics"""
        status_counts = {}
        type_counts = {}
        
        for att in self.attestations.values():
            status = att.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
            
            att_type = att.attestation_type.value
            type_counts[att_type] = type_counts.get(att_type, 0) + 1
        
        return {
            "total_attestations": len(self.attestations),
            "status_distribution": status_counts,
            "type_distribution": type_counts,
            "model_version": self.model_version
        }


# Global attestation engine instance
attestation_engine = AttestationEngine()

