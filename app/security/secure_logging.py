"""
Secure logging utilities for GuardianX services.
Provides structured logging with automatic sensitive-data redaction.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, Optional

REDACTED = "[REDACTED]"
SENSITIVE_FIELD_KEYWORDS = (
    "api_key",
    "apikey",
    "token",
    "secret",
    "password",
    "authorization",
    "credential",
    "session",
    "signature",
)
SENSITIVE_VALUE_PATTERNS = [
    re.compile(r"(?i)(api[_-]?key|token|secret|password|authorization)\s*[:=]\s*([^\s,;]+)")
]
LOGGER_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s%(secure_context_str)s"
DATE_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
_LOGGER_CLASS_SET = False
_LOGGER_CONFIGURED = False


def _merge_context(existing: Optional[Dict[str, Any]], new: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    context: Dict[str, Any] = {}
    if isinstance(existing, dict):
        context.update(existing)
    if isinstance(new, dict):
        context.update(new)
    return context


def _sanitize_mapping(data: Any) -> Any:
    if isinstance(data, dict):
        sanitized: Dict[str, Any] = {}
        for key, value in data.items():
            key_lower = key.lower()
            if any(keyword in key_lower for keyword in SENSITIVE_FIELD_KEYWORDS):
                sanitized[key] = REDACTED
                continue
            sanitized[key] = _sanitize_mapping(value)
        return sanitized
    if isinstance(data, list):
        return [_sanitize_mapping(item) for item in data]
    if isinstance(data, str):
        return _sanitize_text(data)
    return data


def _sanitize_text(message: str) -> str:
    sanitized = message
    for pattern in SENSITIVE_VALUE_PATTERNS:
        sanitized = pattern.sub(r"\1" + REDACTED, sanitized)
    return sanitized


class SecureLogger(logging.Logger):
    """Custom logger that accepts secure_context kwargs and redacts sensitive info."""

    def _log(  # type: ignore[override]
        self,
        level: int,
        msg: str,
        args,
        exc_info=None,
        extra: Optional[Dict[str, Any]] = None,
        stack_info: bool = False,
        stacklevel: int = 1,
        secure_context: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        context_payload = _merge_context(secure_context, kwargs if kwargs else None)
        payload: Optional[Dict[str, Any]] = extra.copy() if extra else {}

        if context_payload:
            payload = payload or {}
            merged = _merge_context(payload.get("secure_context"), context_payload)
            payload["secure_context"] = merged

        super()._log(
            level,
            msg,
            args,
            exc_info=exc_info,
            extra=payload,
            stack_info=stack_info,
            stacklevel=stacklevel,
        )


class SecureFormatter(logging.Formatter):
    """Formatter that redacts sensitive data from log messages and context."""

    def format(self, record: logging.LogRecord) -> str:
        secure_context = getattr(record, "secure_context", None)
        if isinstance(secure_context, dict):
            sanitized_context = _sanitize_mapping(secure_context)
            record.secure_context = sanitized_context
            record.secure_context_str = " | context=" + json.dumps(
                sanitized_context, sort_keys=True, default=str
            )
        else:
            record.secure_context_str = ""

        formatted = super().format(record)
        return _sanitize_text(formatted)


def _set_logger_class() -> None:
    global _LOGGER_CLASS_SET
    if not _LOGGER_CLASS_SET:
        logging.setLoggerClass(SecureLogger)
        _LOGGER_CLASS_SET = True


def configure_secure_logging() -> None:
    """Configure root logger with secure formatter once."""
    global _LOGGER_CONFIGURED
    if _LOGGER_CONFIGURED:
        return

    _set_logger_class()

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    root_logger = logging.getLogger()
    root_logger.handlers.clear()

    handler = logging.StreamHandler()
    handler.setFormatter(SecureFormatter(LOGGER_FORMAT, DATE_FORMAT))
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)

    _LOGGER_CONFIGURED = True


