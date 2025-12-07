"""
Input Validation Utilities
Comprehensive validation for addresses, chain IDs, and other inputs
"""

import re
from typing import Optional, Dict, Any
from web3 import Web3
from fastapi import HTTPException, status

# Supported chain IDs
SUPPORTED_CHAIN_IDS = {1, 56, 137, 42161, 10, 43114, 250, 25, 8453, 324}

# Validation patterns
ETHEREUM_ADDRESS_PATTERN = re.compile(r'^0x[a-fA-F0-9]{40}$')
TRANSACTION_HASH_PATTERN = re.compile(r'^0x[a-fA-F0-9]{64}$')


def validate_ethereum_address(address: str) -> str:
    """
    Validate and normalize Ethereum address
    
    Args:
        address: Address string to validate
        
    Returns:
        Checksummed address
        
    Raises:
        HTTPException: If address is invalid
    """
    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Address is required"
        )
    
    # Check format
    if not ETHEREUM_ADDRESS_PATTERN.match(address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid address format: {address}"
        )
    
    # Validate with Web3
    if not Web3.is_address(address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Ethereum address: {address}"
        )
    
    # Return checksummed address
    return Web3.to_checksum_address(address)


def validate_chain_id(chain_id: int) -> int:
    """
    Validate chain ID
    
    Args:
        chain_id: Chain ID to validate
        
    Returns:
        Validated chain ID
        
    Raises:
        HTTPException: If chain ID is not supported
    """
    if chain_id not in SUPPORTED_CHAIN_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain ID: {chain_id}. Supported chains: {sorted(SUPPORTED_CHAIN_IDS)}"
        )
    
    return chain_id


def validate_transaction_hash(tx_hash: str) -> str:
    """
    Validate transaction hash
    
    Args:
        tx_hash: Transaction hash to validate
        
    Returns:
        Validated transaction hash
        
    Raises:
        HTTPException: If hash is invalid
    """
    if not tx_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction hash is required"
        )
    
    if not TRANSACTION_HASH_PATTERN.match(tx_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transaction hash format: {tx_hash}"
        )
    
    return tx_hash.lower()


def validate_limit(limit: int, max_limit: int = 1000, default: int = 100) -> int:
    """
    Validate and clamp limit parameter
    
    Args:
        limit: Requested limit
        max_limit: Maximum allowed limit
        default: Default limit if not provided
        
    Returns:
        Validated limit
    """
    if limit is None:
        return default
    
    if limit < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be greater than 0"
        )
    
    if limit > max_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limit cannot exceed {max_limit}"
        )
    
    return limit


def validate_alert_threshold(threshold: float) -> float:
    """
    Validate alert threshold (0-1)
    
    Args:
        threshold: Threshold value
        
    Returns:
        Validated threshold
    """
    if threshold < 0 or threshold > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert threshold must be between 0 and 1"
        )
    
    return threshold


def validate_monitoring_interval(interval: int) -> int:
    """
    Validate monitoring interval
    
    Args:
        interval: Interval in seconds
        
    Returns:
        Validated interval
    """
    if interval < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monitoring interval must be at least 10 seconds"
        )
    
    if interval > 3600:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monitoring interval cannot exceed 3600 seconds (1 hour)"
        )
    
    return interval


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    Sanitize string input
    
    Args:
        value: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    if not value:
        return ""
    
    # Remove null bytes and control characters
    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    
    # Truncate if too long
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()


def validate_url(url: str) -> str:
    """
    Validate URL format
    
    Args:
        url: URL to validate
        
    Returns:
        Validated URL
        
    Raises:
        HTTPException: If URL is invalid
    """
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required"
        )
    
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    
    if not url_pattern.match(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid URL format: {url}"
        )
    
    return url

