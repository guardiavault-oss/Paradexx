#!/usr/bin/env python3
"""
Security utilities for Cross-Chain Bridge Service
"""

import hashlib
import hmac
import logging
import secrets
import time
from typing import Any

logger = logging.getLogger(__name__)


def generate_api_key() -> str:
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)


def hash_password(password: str, salt: str | None = None) -> tuple:
    """Hash a password with salt"""
    if salt is None:
        salt = secrets.token_hex(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000
    )
    return password_hash.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verify a password against its hash"""
    try:
        computed_hash, _ = hash_password(password, salt)
        return hmac.compare_digest(computed_hash, password_hash)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def generate_signature(data: str, secret_key: str) -> str:
    """Generate HMAC signature for data"""
    return hmac.new(secret_key.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_signature(data: str, signature: str, secret_key: str) -> bool:
    """Verify HMAC signature"""
    expected_signature = generate_signature(data, secret_key)
    return hmac.compare_digest(signature, expected_signature)


def sanitize_input(input_data: Any) -> Any:
    """Sanitize input data to prevent injection attacks"""
    if isinstance(input_data, str):
        # Remove potentially dangerous characters
        dangerous_chars = ["<", ">", '"', "'", "&", ";", "(", ")", "|", "`"]
        for char in dangerous_chars:
            input_data = input_data.replace(char, "")
        return input_data.strip()
    if isinstance(input_data, dict):
        return {k: sanitize_input(v) for k, v in input_data.items()}
    if isinstance(input_data, list):
        return [sanitize_input(item) for item in input_data]
    return input_data


def rate_limit_check(identifier: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
    """Simple rate limiting check (in-memory)"""
    # This is a simplified implementation
    # In production, you'd use Redis or similar
    current_time = time.time()
    # For now, just return True (no rate limiting)
    return True


def validate_ethereum_address(address: str) -> bool:
    """Validate Ethereum address format"""
    if not address or not isinstance(address, str):
        return False

    # Remove 0x prefix if present
    address = address.removeprefix("0x")

    # Check length and hex characters
    return len(address) == 40 and all(c in "0123456789abcdefABCDEF" for c in address)


def validate_transaction_hash(tx_hash: str) -> bool:
    """Validate transaction hash format"""
    if not tx_hash or not isinstance(tx_hash, str):
        return False

    # Remove 0x prefix if present
    tx_hash = tx_hash.removeprefix("0x")

    # Check length and hex characters
    return len(tx_hash) == 64 and all(c in "0123456789abcdefABCDEF" for c in tx_hash)


class SecurityConfig:
    """Security configuration class"""

    def __init__(self):
        self.api_key_length = 32
        self.password_min_length = 8
        self.max_request_size = 1024 * 1024  # 1MB
        self.rate_limit_requests = 100
        self.rate_limit_window = 3600  # 1 hour

    def validate_config(self) -> bool:
        """Validate security configuration"""
        return (
            self.api_key_length >= 16
            and self.password_min_length >= 8
            and self.max_request_size > 0
            and self.rate_limit_requests > 0
            and self.rate_limit_window > 0
        )


# Global security config instance
security_config = SecurityConfig()
