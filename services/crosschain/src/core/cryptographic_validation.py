#!/usr/bin/env python3
"""
Real Cryptographic Validation - Production-grade signature and cryptographic validation
"""

import hashlib
import logging
import secrets
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

# Cryptographic libraries
from eth_account import Account
from eth_account.messages import encode_defunct

try:
    from eth_account.messages import encode_structured_data
except ImportError:
    pass


logger = logging.getLogger(__name__)


class SignatureAlgorithm(str, Enum):
    """Supported signature algorithms"""

    ECDSA_SECP256K1 = "ecdsa_secp256k1"
    ECDSA_SECP256R1 = "ecdsa_secp256r1"
    ED25519 = "ed25519"
    RSA_PSS = "rsa_pss"
    RSA_PKCS1 = "rsa_pkcs1"
    BLS12_381 = "bls12_381"
    MULTISIG = "multisig"
    THRESHOLD = "threshold"


class ValidationResult(str, Enum):
    """Signature validation results"""

    VALID = "valid"
    INVALID = "invalid"
    FORGED = "forged"
    REUSED = "reused"
    EXPIRED = "expired"
    MALFORMED = "malformed"
    UNSUPPORTED = "unsupported"


@dataclass
class SignatureValidation:
    """Signature validation result"""

    signature: str
    algorithm: SignatureAlgorithm
    result: ValidationResult
    confidence: float
    recovered_address: str | None
    validation_time: float
    details: dict[str, Any]
    warnings: list[str]
    errors: list[str]


@dataclass
class CryptographicProof:
    """Cryptographic proof of authenticity"""

    proof_type: str
    algorithm: str
    proof_data: str
    timestamp: datetime
    nonce: str
    chain_id: int
    block_hash: str
    validator: str
    signature: str


class CryptographicValidator:
    """Production-grade cryptographic validation system"""

    def __init__(self):
        self.signature_cache: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.validation_history: deque = deque(maxlen=100000)
        self.performance_metrics: dict[str, list[float]] = defaultdict(list)
        self.known_attack_patterns: dict[str, list[dict[str, Any]]] = {}

        # Initialize attack patterns
        self._initialize_attack_patterns()

        # Performance tracking
        self.max_validation_time = 5.0  # seconds
        self.cache_ttl = 3600  # 1 hour

        logger.info("CryptographicValidator initialized")

    def _initialize_attack_patterns(self):
        """Initialize known attack patterns for signature validation"""
        self.known_attack_patterns = {
            "signature_reuse": [
                {
                    "pattern": "repeated_signature",
                    "description": "Same signature used multiple times",
                    "severity": "high",
                }
            ],
            "weak_signatures": [
                {
                    "pattern": "low_entropy",
                    "description": "Signature with low entropy",
                    "severity": "medium",
                },
                {
                    "pattern": "predictable_nonce",
                    "description": "Predictable nonce in signature",
                    "severity": "high",
                },
            ],
            "malformed_signatures": [
                {
                    "pattern": "invalid_format",
                    "description": "Invalid signature format",
                    "severity": "critical",
                },
                {
                    "pattern": "wrong_length",
                    "description": "Incorrect signature length",
                    "severity": "high",
                },
            ],
        }

    async def validate_signature(
        self,
        message: str | bytes,
        signature: str,
        expected_address: str,
        algorithm: SignatureAlgorithm = None,
    ) -> SignatureValidation:
        """Validate signature with comprehensive analysis"""
        start_time = time.time()

        try:
            # Detect signature algorithm if not provided
            if not algorithm:
                algorithm = self._detect_signature_algorithm(signature)

            # Basic format validation
            if not self._validate_signature_format(signature, algorithm):
                return SignatureValidation(
                    signature=signature,
                    algorithm=algorithm,
                    result=ValidationResult.MALFORMED,
                    confidence=0.0,
                    recovered_address=None,
                    validation_time=time.time() - start_time,
                    details={"error": "Invalid signature format"},
                    warnings=[],
                    errors=["Invalid signature format"],
                )

            # Check for signature reuse
            if self._is_signature_reused(signature):
                return SignatureValidation(
                    signature=signature,
                    algorithm=algorithm,
                    result=ValidationResult.REUSED,
                    confidence=0.0,
                    recovered_address=None,
                    validation_time=time.time() - start_time,
                    details={"error": "Signature reuse detected"},
                    warnings=[],
                    errors=["Signature reuse detected"],
                )

            # Perform cryptographic validation
            validation_result = await self._perform_cryptographic_validation(
                message, signature, expected_address, algorithm
            )

            # Add performance metrics
            validation_time = time.time() - start_time
            self.performance_metrics[algorithm.value].append(validation_time)

            # Add to validation history
            self.validation_history.append(
                {
                    "signature": signature,
                    "algorithm": algorithm.value,
                    "result": validation_result.result.value,
                    "validation_time": validation_time,
                    "timestamp": datetime.utcnow(),
                }
            )

            # Cache successful validations
            if validation_result.result == ValidationResult.VALID:
                self._cache_signature(signature, validation_result)

            return validation_result

        except Exception as e:
            logger.error(f"Error validating signature: {e}")
            return SignatureValidation(
                signature=signature,
                algorithm=algorithm or SignatureAlgorithm.ECDSA_SECP256K1,
                result=ValidationResult.INVALID,
                confidence=0.0,
                recovered_address=None,
                validation_time=time.time() - start_time,
                details={"error": str(e)},
                warnings=[],
                errors=[str(e)],
            )

    def _detect_signature_algorithm(self, signature: str) -> SignatureAlgorithm:
        """Detect signature algorithm from signature format"""
        if not signature or not signature.startswith("0x"):
            return SignatureAlgorithm.ECDSA_SECP256K1

        # Remove 0x prefix
        sig_bytes = bytes.fromhex(signature[2:])

        # ECDSA signatures are typically 65 bytes (130 hex characters)
        if len(sig_bytes) == 65:
            return SignatureAlgorithm.ECDSA_SECP256K1

        # Ed25519 signatures are typically 64 bytes (128 hex characters)
        if len(sig_bytes) == 64:
            return SignatureAlgorithm.ED25519

        # BLS signatures can be 96 or 192 bytes
        if len(sig_bytes) in [96, 192]:
            return SignatureAlgorithm.BLS12_381

        # Multisig signatures often contain multiple signatures
        if "," in signature or "|" in signature:
            return SignatureAlgorithm.MULTISIG

        # Default to ECDSA
        return SignatureAlgorithm.ECDSA_SECP256K1

    def _validate_signature_format(self, signature: str, algorithm: SignatureAlgorithm) -> bool:
        """Validate signature format based on algorithm"""
        if not signature or not signature.startswith("0x"):
            return False

        try:
            sig_bytes = bytes.fromhex(signature[2:])
        except ValueError:
            return False

        # Validate length based on algorithm
        if algorithm == SignatureAlgorithm.ECDSA_SECP256K1:
            return len(sig_bytes) == 65
        if algorithm == SignatureAlgorithm.ED25519:
            return len(sig_bytes) == 64
        if algorithm == SignatureAlgorithm.BLS12_381:
            return len(sig_bytes) in [96, 192]
        if algorithm == SignatureAlgorithm.MULTISIG:
            return "," in signature or "|" in signature

        return True

    def _is_signature_reused(self, signature: str) -> bool:
        """Check if signature has been used before"""
        current_time = time.time()

        # Clean old entries from cache
        for sig_hash in list(self.signature_cache.keys()):
            self.signature_cache[sig_hash] = [
                entry
                for entry in self.signature_cache[sig_hash]
                if current_time - entry["timestamp"] < self.cache_ttl
            ]
            if not self.signature_cache[sig_hash]:
                del self.signature_cache[sig_hash]

        # Check if signature exists in cache
        sig_hash = hashlib.sha256(signature.encode()).hexdigest()
        return sig_hash in self.signature_cache

    async def _perform_cryptographic_validation(
        self,
        message: str | bytes,
        signature: str,
        expected_address: str,
        algorithm: SignatureAlgorithm,
    ) -> SignatureValidation:
        """Perform actual cryptographic validation"""
        warnings = []
        errors = []
        details = {}

        try:
            if algorithm == SignatureAlgorithm.ECDSA_SECP256K1:
                return await self._validate_ecdsa_secp256k1(message, signature, expected_address)
            if algorithm == SignatureAlgorithm.ED25519:
                return await self._validate_ed25519(message, signature, expected_address)
            if algorithm == SignatureAlgorithm.BLS12_381:
                return await self._validate_bls12_381(message, signature, expected_address)
            if algorithm == SignatureAlgorithm.MULTISIG:
                return await self._validate_multisig(message, signature, expected_address)
            return SignatureValidation(
                signature=signature,
                algorithm=algorithm,
                result=ValidationResult.UNSUPPORTED,
                confidence=0.0,
                recovered_address=None,
                validation_time=0.0,
                details={"error": f"Unsupported algorithm: {algorithm}"},
                warnings=[],
                errors=[f"Unsupported algorithm: {algorithm}"],
            )

        except Exception as e:
            logger.error(f"Error in cryptographic validation: {e}")
            return SignatureValidation(
                signature=signature,
                algorithm=algorithm,
                result=ValidationResult.INVALID,
                confidence=0.0,
                recovered_address=None,
                validation_time=0.0,
                details={"error": str(e)},
                warnings=[],
                errors=[str(e)],
            )

    async def _validate_ecdsa_secp256k1(
        self, message: str | bytes, signature: str, expected_address: str
    ) -> SignatureValidation:
        """Validate ECDSA secp256k1 signature"""
        try:
            # Convert message to bytes if string
            if isinstance(message, str):
                message_bytes = message.encode("utf-8")
            else:
                message_bytes = message

            # Create message hash (Ethereum style)
            message_hash = encode_defunct(message_bytes)

            # Convert signature to bytes
            signature_bytes = bytes.fromhex(signature[2:])

            # Recover address from signature
            recovered_address = Account.recover_message_hash(
                message_hash, signature=signature_bytes
            )

            # Validate address
            is_valid = recovered_address.lower() == expected_address.lower()

            # Calculate confidence based on validation success
            confidence = 1.0 if is_valid else 0.0

            # Check for weak signatures
            warnings = []
            if self._is_weak_signature(signature_bytes):
                warnings.append("Weak signature detected")
                confidence *= 0.8

            return SignatureValidation(
                signature=signature,
                algorithm=SignatureAlgorithm.ECDSA_SECP256K1,
                result=ValidationResult.VALID if is_valid else ValidationResult.INVALID,
                confidence=confidence,
                recovered_address=recovered_address,
                validation_time=0.0,  # Will be set by caller
                details={
                    "recovered_address": recovered_address,
                    "expected_address": expected_address,
                    "message_hash": message_hash.body.hex(),
                },
                warnings=warnings,
                errors=[],
            )

        except Exception as e:
            return SignatureValidation(
                signature=signature,
                algorithm=SignatureAlgorithm.ECDSA_SECP256K1,
                result=ValidationResult.INVALID,
                confidence=0.0,
                recovered_address=None,
                validation_time=0.0,
                details={"error": str(e)},
                warnings=[],
                errors=[str(e)],
            )

    async def _validate_ed25519(
        self, message: str | bytes, signature: str, expected_address: str
    ) -> SignatureValidation:
        """Validate Ed25519 signature"""
        try:
            # Convert message to bytes
            if isinstance(message, str):
                message_bytes = message.encode("utf-8")
            else:
                message_bytes = message

            # Convert signature to bytes
            signature_bytes = bytes.fromhex(signature[2:])

            # For Ed25519, we need the public key to verify
            # This is a simplified implementation
            # In production, you would need the actual public key

            return SignatureValidation(
                signature=signature,
                algorithm=SignatureAlgorithm.ED25519,
                result=ValidationResult.UNSUPPORTED,
                confidence=0.0,
                recovered_address=None,
                validation_time=0.0,
                details={"error": "Ed25519 validation requires public key"},
                warnings=[],
                errors=["Ed25519 validation requires public key"],
            )

        except Exception as e:
            return SignatureValidation(
                signature=signature,
                algorithm=SignatureAlgorithm.ED25519,
                result=ValidationResult.INVALID,
                confidence=0.0,
                recovered_address=None,
                validation_time=0.0,
                details={"error": str(e)},
                warnings=[],
                errors=[str(e)],
            )

    async def _validate_bls12_381(
        self, message: str | bytes, signature: str, expected_address: str
    ) -> SignatureValidation:
        """Validate BLS12-381 signature"""
        # BLS12-381 validation requires specialized libraries
        # This is a placeholder for future implementation
        return SignatureValidation(
            signature=signature,
            algorithm=SignatureAlgorithm.BLS12_381,
            result=ValidationResult.UNSUPPORTED,
            confidence=0.0,
            recovered_address=None,
            validation_time=0.0,
            details={"error": "BLS12-381 validation not implemented"},
            warnings=[],
            errors=["BLS12-381 validation not implemented"],
        )

    async def _validate_multisig(
        self, message: str | bytes, signature: str, expected_address: str
    ) -> SignatureValidation:
        """Validate multisig signature"""
        try:
            # Parse multisig signature
            if "," in signature:
                signatures = signature.split(",")
            elif "|" in signature:
                signatures = signature.split("|")
            else:
                return SignatureValidation(
                    signature=signature,
                    algorithm=SignatureAlgorithm.MULTISIG,
                    result=ValidationResult.MALFORMED,
                    confidence=0.0,
                    recovered_address=None,
                    validation_time=0.0,
                    details={"error": "Invalid multisig format"},
                    warnings=[],
                    errors=["Invalid multisig format"],
                )

            # Validate each signature
            valid_signatures = 0
            total_signatures = len(signatures)
            recovered_addresses = []

            for sig in signatures:
                try:
                    # Validate individual signature
                    validation = await self.validate_signature(
                        message, sig.strip(), expected_address
                    )
                    if validation.result == ValidationResult.VALID:
                        valid_signatures += 1
                        if validation.recovered_address:
                            recovered_addresses.append(validation.recovered_address)
                except Exception as e:
                    logger.warning(f"Error validating multisig component: {e}")

            # Calculate confidence based on valid signatures
            confidence = valid_signatures / total_signatures if total_signatures > 0 else 0.0

            return SignatureValidation(
                signature=signature,
                algorithm=SignatureAlgorithm.MULTISIG,
                result=ValidationResult.VALID if confidence > 0.5 else ValidationResult.INVALID,
                confidence=confidence,
                recovered_address=recovered_addresses[0] if recovered_addresses else None,
                validation_time=0.0,
                details={
                    "valid_signatures": valid_signatures,
                    "total_signatures": total_signatures,
                    "recovered_addresses": recovered_addresses,
                },
                warnings=[],
                errors=[],
            )

        except Exception as e:
            return SignatureValidation(
                signature=signature,
                algorithm=SignatureAlgorithm.MULTISIG,
                result=ValidationResult.INVALID,
                confidence=0.0,
                recovered_address=None,
                validation_time=0.0,
                details={"error": str(e)},
                warnings=[],
                errors=[str(e)],
            )

    def _is_weak_signature(self, signature_bytes: bytes) -> bool:
        """Check if signature is weak (low entropy, predictable patterns)"""
        # Check for low entropy
        entropy = self._calculate_entropy(signature_bytes)
        if entropy < 7.0:  # Low entropy threshold
            return True

        # Check for repeated patterns
        if self._has_repeated_patterns(signature_bytes):
            return True

        return False

    def _calculate_entropy(self, data: bytes) -> float:
        """Calculate Shannon entropy of data"""
        if not data:
            return 0.0

        # Count byte frequencies
        byte_counts = [0] * 256
        for byte in data:
            byte_counts[byte] += 1

        # Calculate entropy
        entropy = 0.0
        data_len = len(data)
        for count in byte_counts:
            if count > 0:
                probability = count / data_len
                entropy -= probability * (probability.bit_length() - 1)

        return entropy

    def _has_repeated_patterns(self, data: bytes) -> bool:
        """Check for repeated patterns in data"""
        if len(data) < 8:
            return False

        # Check for simple patterns
        for pattern_len in range(1, min(8, len(data) // 2)):
            pattern = data[:pattern_len]
            repetitions = 0
            for i in range(pattern_len, len(data), pattern_len):
                if data[i : i + pattern_len] == pattern:
                    repetitions += 1
                else:
                    break

            if repetitions >= 3:  # Pattern repeated 3+ times
                return True

        return False

    def _cache_signature(self, signature: str, validation: SignatureValidation):
        """Cache signature validation result"""
        sig_hash = hashlib.sha256(signature.encode()).hexdigest()
        self.signature_cache[sig_hash].append(
            {"signature": signature, "validation": validation, "timestamp": time.time()}
        )

    async def generate_cryptographic_proof(
        self, data: dict[str, Any], private_key: str, algorithm: SignatureAlgorithm
    ) -> CryptographicProof:
        """Generate cryptographic proof of authenticity"""
        try:
            # Create proof data
            proof_data = json.dumps(data, sort_keys=True)
            proof_hash = hashlib.sha256(proof_data.encode()).hexdigest()

            # Generate nonce
            nonce = secrets.token_hex(32)

            # Create message to sign
            message = f"{proof_hash}:{nonce}:{int(time.time())}"

            # Sign message
            if algorithm == SignatureAlgorithm.ECDSA_SECP256K1:
                account = Account.from_key(private_key)
                signature = account.sign_message(encode_defunct(message.encode())).signature.hex()
            else:
                raise ValueError(f"Unsupported algorithm for proof generation: {algorithm}")

            return CryptographicProof(
                proof_type="signature_proof",
                algorithm=algorithm.value,
                proof_data=proof_data,
                timestamp=datetime.utcnow(),
                nonce=nonce,
                chain_id=1,  # Default to Ethereum mainnet
                block_hash="0x0",  # Placeholder
                validator=account.address,
                signature=signature,
            )

        except Exception as e:
            logger.error(f"Error generating cryptographic proof: {e}")
            raise

    def get_validation_statistics(self) -> dict[str, Any]:
        """Get validation statistics"""
        total_validations = len(self.validation_history)
        if total_validations == 0:
            return {
                "total_validations": 0,
                "success_rate": 0.0,
                "average_validation_time": 0.0,
                "algorithm_breakdown": {},
                "result_breakdown": {},
            }

        # Calculate success rate
        successful_validations = sum(1 for v in self.validation_history if v["result"] == "valid")
        success_rate = successful_validations / total_validations

        # Calculate average validation time
        avg_validation_time = (
            sum(v["validation_time"] for v in self.validation_history) / total_validations
        )

        # Algorithm breakdown
        algorithm_breakdown = defaultdict(int)
        for v in self.validation_history:
            algorithm_breakdown[v["algorithm"]] += 1

        # Result breakdown
        result_breakdown = defaultdict(int)
        for v in self.validation_history:
            result_breakdown[v["result"]] += 1

        return {
            "total_validations": total_validations,
            "success_rate": success_rate,
            "average_validation_time": avg_validation_time,
            "algorithm_breakdown": dict(algorithm_breakdown),
            "result_breakdown": dict(result_breakdown),
            "cached_signatures": len(self.signature_cache),
            "performance_metrics": {
                algo: {
                    "count": len(times),
                    "avg_time": sum(times) / len(times) if times else 0,
                    "max_time": max(times) if times else 0,
                }
                for algo, times in self.performance_metrics.items()
            },
        }

    def cleanup_old_data(self, max_age_hours: int = 24):
        """Clean up old validation data"""
        cutoff_time = time.time() - (max_age_hours * 3600)

        # Clean validation history
        self.validation_history = deque(
            [v for v in self.validation_history if v["timestamp"].timestamp() > cutoff_time],
            maxlen=100000,
        )

        # Clean signature cache
        for sig_hash in list(self.signature_cache.keys()):
            self.signature_cache[sig_hash] = [
                entry
                for entry in self.signature_cache[sig_hash]
                if entry["timestamp"] > cutoff_time
            ]
            if not self.signature_cache[sig_hash]:
                del self.signature_cache[sig_hash]

        logger.info(f"Cleaned up data older than {max_age_hours} hours")
