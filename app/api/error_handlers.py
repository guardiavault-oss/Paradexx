#!/usr/bin/env python3
"""
Error Handling Decorators and Utilities
Provides centralized error handling to eliminate duplication
"""

from functools import wraps
from fastapi import HTTPException
from typing import Callable, Any
import structlog

logger = structlog.get_logger(__name__)


def handle_endpoint_errors(operation_name: str):
    """
    Decorator to handle common endpoint errors
    
    Args:
        operation_name: Name of the operation for logging
        
    Usage:
        @router.post("/endpoint")
        @handle_endpoint_errors("create vault")
        async def create_vault(...):
            # No try-except needed
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                # Re-raise HTTP exceptions (they're already properly formatted)
                raise
            except ValueError as e:
                # Validation errors
                logger.warning(f"{operation_name} validation error: {e}")
                raise HTTPException(status_code=400, detail=str(e))
            except KeyError as e:
                # Missing key errors
                logger.warning(f"{operation_name} missing key: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {str(e)}"
                )
            except AttributeError as e:
                # Attribute errors
                logger.error(f"{operation_name} attribute error: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Internal error: {str(e)}"
                )
            except Exception as e:
                # Unexpected errors
                logger.error(
                    f"{operation_name} error: {e}",
                    exc_info=True,
                    operation=operation_name
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Internal server error during {operation_name}"
                )
        return wrapper
    return decorator


def create_not_found_error(resource_name: str, resource_id: str = None) -> HTTPException:
    """
    Create a standardized not found error
    
    Args:
        resource_name: Name of the resource (e.g., "Vault")
        resource_id: ID of the resource (optional)
        
    Returns:
        HTTPException with 404 status
    """
    message = f"{resource_name} not found"
    if resource_id:
        message = f"{resource_name} with ID {resource_id} not found"
    return HTTPException(status_code=404, detail=message)


def create_validation_error(message: str, details: dict = None) -> HTTPException:
    """
    Create a standardized validation error
    
    Args:
        message: Error message
        details: Additional error details (optional)
        
    Returns:
        HTTPException with 400 status
    """
    error_detail = {"message": message}
    if details:
        error_detail["details"] = details
    return HTTPException(status_code=400, detail=error_detail)


def create_unauthorized_error(message: str = "Authentication required") -> HTTPException:
    """
    Create a standardized unauthorized error
    
    Args:
        message: Error message
        
    Returns:
        HTTPException with 401 status
    """
    return HTTPException(status_code=401, detail=message)


def create_forbidden_error(message: str = "Access denied") -> HTTPException:
    """
    Create a standardized forbidden error
    
    Args:
        message: Error message
        
    Returns:
        HTTPException with 403 status
    """
    return HTTPException(status_code=403, detail=message)


def create_service_unavailable_error(service_name: str) -> HTTPException:
    """
    Create a standardized service unavailable error
    
    Args:
        service_name: Name of the service
        
    Returns:
        HTTPException with 503 status
    """
    return HTTPException(
        status_code=503,
        detail=f"{service_name} service unavailable"
    )


# Export all error handlers
__all__ = [
    "handle_endpoint_errors",
    "create_not_found_error",
    "create_validation_error",
    "create_unauthorized_error",
    "create_forbidden_error",
    "create_service_unavailable_error",
]






