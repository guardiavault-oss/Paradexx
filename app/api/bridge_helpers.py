#!/usr/bin/env python3
"""
Bridge Helper Functions
Provides reusable functions for bridge operations to eliminate code duplication
"""

from typing import Any
import structlog

logger = structlog.get_logger(__name__)


async def ensure_bridge_initialized(bridge_integration: Any) -> None:
    """
    Ensure bridge integration is initialized
    
    Args:
        bridge_integration: Bridge integration instance
        
    Raises:
        Exception: If initialization fails
    """
    if not bridge_integration.initialized:
        try:
            await bridge_integration.initialize()
            logger.info("Bridge integration initialized")
        except Exception as e:
            logger.error(f"Failed to initialize bridge integration: {e}")
            raise


# Export all helpers
__all__ = [
    "ensure_bridge_initialized",
]






