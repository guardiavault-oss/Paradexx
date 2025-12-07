#!/usr/bin/env python3
"""
Error Handler and Edge Case Management
Handles all error states and edge cases
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
import structlog

logger = structlog.get_logger(__name__)


class ErrorType(str, Enum):
    """Error type enumeration"""
    NO_INTERNET = "no_internet"
    SLOW_NETWORK = "slow_network"
    RPC_NODE_DOWN = "rpc_node_down"
    INSUFFICIENT_GAS = "insufficient_gas"
    SLIPPAGE_EXCEEDED = "slippage_exceeded"
    TRANSACTION_STUCK = "transaction_stuck"
    TRANSACTION_FAILED = "transaction_failed"
    INVALID_ADDRESS = "invalid_address"
    TOKEN_NOT_FOUND = "token_not_found"
    RATE_LIMITED = "rate_limited"
    MAINTENANCE_MODE = "maintenance_mode"
    NETWORK_ERROR = "network_error"
    TIMEOUT = "timeout"
    INSUFFICIENT_BALANCE = "insufficient_balance"
    DUST_BALANCE = "dust_balance"
    OTHER = "other"


class ErrorSeverity(str, Enum):
    """Error severity enumeration"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ErrorState:
    """Error state information"""
    error_type: ErrorType
    severity: ErrorSeverity
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    transaction_id: Optional[str] = None
    retryable: bool = False
    suggested_action: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "error_type": self.error_type.value,
            "severity": self.severity.value,
            "message": self.message,
            "details": self.details or {},
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "transaction_id": self.transaction_id,
            "retryable": self.retryable,
            "suggested_action": self.suggested_action
        }


class ErrorHandler:
    """Handles errors and edge cases"""
    
    def __init__(self):
        """Initialize error handler"""
        self.errors: List[ErrorState] = []
        self.network_status: Dict[str, bool] = {}
        self.maintenance_mode: bool = False
        logger.info("Error Handler initialized")
    
    async def handle_error(
        self,
        error_type: ErrorType,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        details: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        transaction_id: Optional[str] = None
    ) -> ErrorState:
        """Handle an error"""
        error = ErrorState(
            error_type=error_type,
            severity=severity,
            message=message,
            details=details,
            user_id=user_id,
            transaction_id=transaction_id,
            retryable=self._is_retryable(error_type),
            suggested_action=self._get_suggested_action(error_type)
        )
        
        self.errors.append(error)
        
        # Log error
        log_level = severity.value
        logger.log(log_level, f"Error: {error_type.value}", message=message, details=details)
        
        return error
    
    async def check_network_status(self, network: str) -> bool:
        """Check if network is operational"""
        return self.network_status.get(network, True)  # Default to operational
    
    async def set_network_status(self, network: str, operational: bool):
        """Set network operational status"""
        self.network_status[network] = operational
        logger.info(f"Network {network} status: {'operational' if operational else 'down'}")
    
    async def get_rpc_fallback(self, network: str) -> List[str]:
        """Get fallback RPC nodes"""
        # In production, this would return actual fallback nodes
        fallback_nodes = {
            "ethereum": [
                "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
                "https://mainnet.infura.io/v3/YOUR_KEY",
                "https://rpc.ankr.com/eth"
            ],
            "polygon": [
                "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY",
                "https://rpc-mainnet.maticvigil.com",
                "https://rpc.ankr.com/polygon"
            ]
        }
        return fallback_nodes.get(network, [])
    
    def _is_retryable(self, error_type: ErrorType) -> bool:
        """Check if error is retryable"""
        retryable_errors = {
            ErrorType.NO_INTERNET,
            ErrorType.SLOW_NETWORK,
            ErrorType.RPC_NODE_DOWN,
            ErrorType.RATE_LIMITED,
            ErrorType.TIMEOUT,
            ErrorType.NETWORK_ERROR
        }
        return error_type in retryable_errors
    
    def _get_suggested_action(self, error_type: ErrorType) -> Optional[str]:
        """Get suggested action for error"""
        actions = {
            ErrorType.NO_INTERNET: "Check your internet connection and try again",
            ErrorType.SLOW_NETWORK: "Network is slow. Please wait or try again later",
            ErrorType.RPC_NODE_DOWN: "Network node is down. Trying fallback node...",
            ErrorType.INSUFFICIENT_GAS: "Insufficient gas. Please increase gas limit",
            ErrorType.SLIPPAGE_EXCEEDED: "Price moved too much. Try increasing slippage tolerance",
            ErrorType.TRANSACTION_STUCK: "Transaction is stuck. Try speeding up or canceling",
            ErrorType.TRANSACTION_FAILED: "Transaction failed. Check reason and try again",
            ErrorType.INVALID_ADDRESS: "Invalid address format. Please check and try again",
            ErrorType.TOKEN_NOT_FOUND: "Token not found. Please verify contract address",
            ErrorType.RATE_LIMITED: "Too many requests. Please wait a moment",
            ErrorType.MAINTENANCE_MODE: "Service is under maintenance. Please try again later",
            ErrorType.INSUFFICIENT_BALANCE: "Insufficient balance. Please add funds",
            ErrorType.DUST_BALANCE: "Balance too small to transfer"
        }
        return actions.get(error_type)
    
    async def validate_address(self, address: str, chain: str = "ethereum") -> tuple[bool, Optional[str]]:
        """Validate address format"""
        if not address or not address.startswith("0x"):
            return False, "Address must start with 0x"
        
        if len(address) != 42:
            return False, "Address must be 42 characters long"
        
        try:
            int(address, 16)
        except ValueError:
            return False, "Address contains invalid characters"
        
        return True, None
    
    async def estimate_gas(self, transaction: Dict[str, Any], chain: str = "ethereum") -> Dict[str, Any]:
        """Estimate gas for transaction"""
        # Mock gas estimation
        gas_estimate = {
            "gas_limit": 21000,
            "gas_price": 30000000000,  # 30 gwei
            "total_cost_wei": 630000000000000,
            "total_cost_usd": 2.50,
            "suggested_gas_price": {
                "slow": 20000000000,
                "medium": 30000000000,
                "fast": 40000000000
            }
        }
        return gas_estimate
    
    async def check_maintenance_mode(self) -> bool:
        """Check if maintenance mode is active"""
        return self.maintenance_mode
    
    async def set_maintenance_mode(self, enabled: bool, message: Optional[str] = None):
        """Set maintenance mode"""
        self.maintenance_mode = enabled
        if enabled:
            logger.warning(f"Maintenance mode enabled: {message}")


# Singleton instance
_error_handler = None


def get_error_handler() -> ErrorHandler:
    """Get or create error handler instance"""
    global _error_handler
    if _error_handler is None:
        _error_handler = ErrorHandler()
    return _error_handler

