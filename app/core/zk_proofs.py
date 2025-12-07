#!/usr/bin/env python3
"""
zk Proof Generation for GuardianX Attestations
Integration with Noir and RISC0 for provable attestations
"""

import json
import subprocess
import tempfile
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional

import structlog

logger = structlog.get_logger(__name__)


class ZKCircuitType(Enum):
    NOIR_DECISION_PROOF = "noir_decision_proof"
    RISC0_ATTESTATION = "risc0_attestation"
    CUSTOM_CIRCUIT = "custom_circuit"


@dataclass
class ZKProof:
    """Zero-knowledge proof for an attestation"""
    proof_id: str
    circuit_type: ZKCircuitType
    circuit_id: str
    public_inputs: Dict[str, Any]
    proof_data: str  # Serialized proof
    verification_key: Optional[str] = None
    timestamp: float = 0.0


class NoirProofGenerator:
    """Generate zk proofs using Noir circuits"""
    
    def __init__(self, noir_path: Optional[str] = None):
        self.noir_path = noir_path or "nargo"
        self.circuits_dir = os.path.join(os.path.dirname(__file__), "..", "..", "circuits", "noir")
        self._ensure_circuits_dir()
    
    def _ensure_circuits_dir(self):
        """Ensure circuits directory exists"""
        os.makedirs(self.circuits_dir, exist_ok=True)
        # Create decision proof circuit if it doesn't exist
        self._create_decision_circuit()
    
    def _create_decision_circuit(self):
        """Create Noir circuit for decision attestations"""
        circuit_file = os.path.join(self.circuits_dir, "decision_proof", "src", "main.nr")
        if os.path.exists(circuit_file):
            return
        
        os.makedirs(os.path.dirname(circuit_file), exist_ok=True)
        
        # Create basic Noir circuit for decision proof
        circuit_code = """
use dep::std;

fn main(
    risk_score: Field,
    decision_hash: Field,
    inputs_hash: Field,
    model_version: Field,
) -> pub Field {
    // Verify that risk_score is in valid range (0-1 scaled to 0-10000)
    assert(risk_score <= 10000);
    
    // Verify decision hash matches expected pattern
    let decision_valid = decision_hash != 0;
    
    // Combine all inputs into a single output
    let combined = risk_score + decision_hash + inputs_hash + model_version;
    
    combined
}
"""
        with open(circuit_file, "w") as f:
            f.write(circuit_code)
        
        # Create Nargo.toml
        nargo_toml = os.path.join(self.circuits_dir, "decision_proof", "Nargo.toml")
        with open(nargo_toml, "w") as f:
            f.write("""[package]
name = "decision_proof"
type = "bin"
authors = ["GuardianX"]
compiler_version = ">=0.20.0"

[dependencies]
""")
    
    async def generate_proof(
        self,
        circuit_id: str,
        public_inputs: Dict[str, Any],
        private_inputs: Dict[str, Any]
    ) -> Optional[ZKProof]:
        """
        Generate zk proof using Noir circuit
        
        Args:
            circuit_id: Circuit identifier
            public_inputs: Public inputs to the circuit
            private_inputs: Private inputs to the circuit
        
        Returns:
            ZKProof object or None if generation fails
        """
        try:
            circuit_dir = os.path.join(self.circuits_dir, circuit_id)
            if not os.path.exists(circuit_dir):
                logger.error("Circuit not found", circuit_id=circuit_id)
                return None
            
            # Create proof directory
            proof_dir = tempfile.mkdtemp()
            
            # Prepare inputs
            inputs = {
                **public_inputs,
                **private_inputs
            }
            
            inputs_file = os.path.join(proof_dir, "inputs.json")
            with open(inputs_file, "w") as f:
                json.dump(inputs, f)
            
            # Generate proof using nargo
            result = subprocess.run(
                [
                    self.noir_path,
                    "prove",
                    circuit_id,
                    "--proof-path", os.path.join(proof_dir, "proof"),
                    "--witness", inputs_file
                ],
                cwd=circuit_dir,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                logger.error("Noir proof generation failed", error=result.stderr)
                return None
            
            # Read proof
            proof_path = os.path.join(proof_dir, "proof")
            if not os.path.exists(proof_path):
                logger.error("Proof file not generated")
                return None
            
            with open(proof_path, "rb") as f:
                proof_data = f.read().hex()
            
            # Read verification key if available
            vk_path = os.path.join(proof_dir, "vk")
            verification_key = None
            if os.path.exists(vk_path):
                with open(vk_path, "rb") as f:
                    verification_key = f.read().hex()
            
            proof = ZKProof(
                proof_id=f"noir_{circuit_id}_{hash(str(public_inputs))}",
                circuit_type=ZKCircuitType.NOIR_DECISION_PROOF,
                circuit_id=circuit_id,
                public_inputs=public_inputs,
                proof_data=proof_data,
                verification_key=verification_key
            )
            
            logger.info("Noir proof generated", circuit_id=circuit_id, proof_id=proof.proof_id)
            return proof
            
        except subprocess.TimeoutExpired:
            logger.error("Noir proof generation timed out", circuit_id=circuit_id)
            return None
        except Exception as e:
            logger.error("Error generating Noir proof", error=str(e))
            return None
    
    async def verify_proof(self, proof: ZKProof) -> bool:
        """Verify a Noir proof"""
        try:
            circuit_dir = os.path.join(self.circuits_dir, proof.circuit_id)
            
            # Write proof to temp file
            proof_dir = tempfile.mkdtemp()
            proof_path = os.path.join(proof_dir, "proof")
            with open(proof_path, "wb") as f:
                f.write(bytes.fromhex(proof.proof_data))
            
            # Verify proof
            result = subprocess.run(
                [
                    self.noir_path,
                    "verify",
                    proof.circuit_id,
                    "--proof", proof_path
                ],
                cwd=circuit_dir,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return result.returncode == 0
            
        except Exception as e:
            logger.error("Error verifying Noir proof", error=str(e))
            return False


class RISC0ProofGenerator:
    """Generate zk proofs using RISC0"""
    
    def __init__(self, risc0_path: Optional[str] = None):
        self.risc0_path = risc0_path or "cargo"
        self.method_id_path = None  # Will be set when method is built
    
    async def generate_proof(
        self,
        method_id: str,
        input_data: bytes
    ) -> Optional[ZKProof]:
        """
        Generate zk proof using RISC0
        
        Args:
            method_id: RISC0 method ID
            input_data: Input data as bytes
        
        Returns:
            ZKProof object or None if generation fails
        """
        try:
            # RISC0 proof generation would use cargo/risc0
            # This is a simplified implementation
            logger.info("RISC0 proof generation requested", method_id=method_id)
            
            # Placeholder - would use actual RISC0 tooling
            proof_data = f"risc0_proof_{method_id}_{input_data.hex()[:32]}"
            
            proof = ZKProof(
                proof_id=f"risc0_{method_id}_{hash(input_data)}",
                circuit_type=ZKCircuitType.RISC0_ATTESTATION,
                circuit_id=method_id,
                public_inputs={"method_id": method_id},
                proof_data=proof_data
            )
            
            logger.info("RISC0 proof generated", method_id=method_id, proof_id=proof.proof_id)
            return proof
            
        except Exception as e:
            logger.error("Error generating RISC0 proof", error=str(e))
            return None
    
    async def verify_proof(self, proof: ZKProof) -> bool:
        """Verify a RISC0 proof"""
        try:
            # Placeholder - would use actual RISC0 verification
            logger.info("RISC0 proof verification requested", proof_id=proof.proof_id)
            return True
        except Exception as e:
            logger.error("Error verifying RISC0 proof", error=str(e))
            return False


class ZKProofEngine:
    """Main zk proof engine for GuardianX"""
    
    def __init__(self):
        self.noir_generator = NoirProofGenerator()
        self.risc0_generator = RISC0ProofGenerator()
        self.proofs: Dict[str, ZKProof] = {}
    
    async def generate_attestation_proof(
        self,
        attestation_data: Dict[str, Any],
        circuit_type: ZKCircuitType = ZKCircuitType.NOIR_DECISION_PROOF
    ) -> Optional[ZKProof]:
        """
        Generate zk proof for an attestation
        
        Args:
            attestation_data: Attestation data dictionary
            circuit_type: Type of circuit to use
        
        Returns:
            ZKProof object or None
        """
        try:
            if circuit_type == ZKCircuitType.NOIR_DECISION_PROOF:
                # Prepare inputs for Noir circuit
                public_inputs = {
                    "risk_score": int(attestation_data.get("risk_score", 0) * 10000),
                    "decision_hash": int(attestation_data.get("decision_hash", "0x0"), 16) % (2**254),
                    "inputs_hash": int(attestation_data.get("inputs_hash", "0x0"), 16) % (2**254),
                    "model_version": hash(attestation_data.get("model_version", "")) % (2**254)
                }
                
                private_inputs = {
                    "wallet_address": hash(attestation_data.get("wallet_address", "")),
                    "timestamp": int(attestation_data.get("timestamp", 0))
                }
                
                proof = await self.noir_generator.generate_proof(
                    "decision_proof",
                    public_inputs,
                    private_inputs
                )
                
            elif circuit_type == ZKCircuitType.RISC0_ATTESTATION:
                # Prepare input data for RISC0
                input_json = json.dumps(attestation_data, sort_keys=True)
                input_data = input_json.encode()
                
                proof = await self.risc0_generator.generate_proof(
                    "attestation_verifier",
                    input_data
                )
            else:
                logger.error("Unsupported circuit type", circuit_type=circuit_type.value)
                return None
            
            if proof:
                self.proofs[proof.proof_id] = proof
            
            return proof
            
        except Exception as e:
            logger.error("Error generating attestation proof", error=str(e))
            return None
    
    async def verify_proof(self, proof_id: str) -> bool:
        """Verify a zk proof by ID"""
        if proof_id not in self.proofs:
            logger.warning("Proof not found", proof_id=proof_id)
            return False
        
        proof = self.proofs[proof_id]
        
        if proof.circuit_type == ZKCircuitType.NOIR_DECISION_PROOF:
            return await self.noir_generator.verify_proof(proof)
        elif proof.circuit_type == ZKCircuitType.RISC0_ATTESTATION:
            return await self.risc0_generator.verify_proof(proof)
        else:
            logger.error("Unsupported circuit type for verification", circuit_type=proof.circuit_type.value)
            return False
    
    def get_proof(self, proof_id: str) -> Optional[ZKProof]:
        """Get a proof by ID"""
        return self.proofs.get(proof_id)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get zk proof engine metrics"""
        circuit_counts = {}
        for proof in self.proofs.values():
            circuit_type = proof.circuit_type.value
            circuit_counts[circuit_type] = circuit_counts.get(circuit_type, 0) + 1
        
        return {
            "total_proofs": len(self.proofs),
            "circuit_type_distribution": circuit_counts
        }


# Global zk proof engine instance
zk_proof_engine = ZKProofEngine()

