#!/usr/bin/env python3
"""
Utility Functions
Provides common utility functions to eliminate code duplication
"""

from datetime import datetime
from typing import Any, Dict, Optional
import hashlib
import structlog

logger = structlog.get_logger(__name__)


def get_utc_timestamp() -> str:
    """
    Get current UTC timestamp as ISO format string
    
    Returns:
        ISO format timestamp string
    """
    return datetime.utcnow().isoformat()


def get_utc_datetime() -> datetime:
    """
    Get current UTC datetime
    
    Returns:
        datetime object in UTC
    """
    return datetime.utcnow()


def generate_id(prefix: str = "", data: str = "") -> str:
    """
    Generate a unique ID
    
    Args:
        prefix: Optional prefix for the ID
        data: Optional data to hash for ID generation
        
    Returns:
        Unique ID string
    """
    if not data:
        data = f"{prefix}_{datetime.utcnow().isoformat()}"
    
    id_hash = hashlib.sha256(data.encode()).hexdigest()
    
    if prefix:
        return f"{prefix}_{id_hash[:16]}"
    return id_hash[:16]


def hash_string(data: str) -> str:
    """
    Hash a string using SHA256
    
    Args:
        data: String to hash
        
    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(data.encode()).hexdigest()


def normalize_address(address: str) -> str:
    """
    Normalize Ethereum address to lowercase
    
    Args:
        address: Ethereum address
        
    Returns:
        Lowercase address
    """
    return address.lower() if address else address


def validate_ethereum_address(address: str) -> bool:
    """
    Validate Ethereum address format
    
    Args:
        address: Address to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not address:
        return False
    
    # Check if address starts with 0x
    if not address.startswith("0x"):
        return False
    
    # Check if address is 42 characters (0x + 40 hex characters)
    if len(address) != 42:
        return False
    
    # Check if address contains only hexadecimal characters
    try:
        int(address[2:], 16)
        return True
    except ValueError:
        return False


def format_response(
    success: bool = True,
    data: Any = None,
    message: str = None,
    timestamp: str = None
) -> Dict[str, Any]:
    """
    Format a standardized API response
    
    Args:
        success: Whether the operation was successful
        data: Response data
        message: Optional message
        timestamp: Optional timestamp (defaults to current time)
        
    Returns:
        Formatted response dictionary
    """
    response = {
        "success": success,
        "timestamp": timestamp or get_utc_timestamp()
    }
    
    if data is not None:
        response["data"] = data
    
    if message:
        response["message"] = message
    
    return response


def safe_get(dictionary: Dict[str, Any], key: str, default: Any = None) -> Any:
    """
    Safely get a value from a dictionary
    
    Args:
        dictionary: Dictionary to get value from
        key: Key to get
        default: Default value if key doesn't exist
        
    Returns:
        Value from dictionary or default
    """
    return dictionary.get(key, default) if dictionary else default


def merge_dicts(*dicts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge multiple dictionaries
    
    Args:
        *dicts: Dictionaries to merge
        
    Returns:
        Merged dictionary
    """
    result = {}
    for d in dicts:
        if d:
            result.update(d)
    return result


# Export all utilities
__all__ = [
    "get_utc_timestamp",
    "get_utc_datetime",
    "generate_id",
    "hash_string",
    "normalize_address",
    "validate_ethereum_address",
    "format_response",
    "safe_get",
    "merge_dicts",
]






