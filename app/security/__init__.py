"""
Security module for Wallet Guard Service
Provides middleware, validation, and security utilities
"""

from .middleware import (
    RateLimitMiddleware,
    AuthenticationMiddleware,
    RequestSizeMiddleware,
    SecurityHeadersMiddleware,
    ErrorHandlingMiddleware
)

from .validation import (
    validate_ethereum_address,
    validate_chain_id,
    validate_transaction_hash,
    validate_limit,
    validate_alert_threshold,
    validate_monitoring_interval,
    sanitize_string,
    validate_url
)

__all__ = [
    "RateLimitMiddleware",
    "AuthenticationMiddleware",
    "RequestSizeMiddleware",
    "SecurityHeadersMiddleware",
    "ErrorHandlingMiddleware",
    "validate_ethereum_address",
    "validate_chain_id",
    "validate_transaction_hash",
    "validate_limit",
    "validate_alert_threshold",
    "validate_monitoring_interval",
    "sanitize_string",
    "validate_url",
]

