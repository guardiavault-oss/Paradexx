"""
Security Middleware for Wallet Guard Service
Handles rate limiting, CORS, authentication, and request validation
"""

import os
import time
import hashlib
from typing import Dict, Optional, List
from collections import defaultdict
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

# Rate limiting storage (in production, use Redis)
def _bucket_factory() -> Dict[str, List[float]]:
    return {"read": [], "write": []}


rate_limit_store: Dict[str, Dict[str, List[float]]] = defaultdict(_bucket_factory)

# Configuration
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "1000"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
RATE_LIMIT_WRITE_REQUESTS = int(os.getenv("RATE_LIMIT_WRITE_REQUESTS", str(max(1, RATE_LIMIT_REQUESTS // 2 or 1))))
RATE_LIMIT_WRITE_WINDOW = int(os.getenv("RATE_LIMIT_WRITE_WINDOW", str(RATE_LIMIT_WINDOW)))
MAX_REQUEST_SIZE = int(os.getenv("MAX_REQUEST_SIZE", "10485760"))  # 10MB
API_KEY_HEADER = os.getenv("API_KEY_HEADER", "X-API-Key")
REQUIRE_API_KEY_ENV = os.getenv("REQUIRE_API_KEY", "false").lower() == "true"
VALID_API_KEYS = {
    key.strip()
    for key in os.getenv("VALID_API_KEYS", "").split(",")
    if key.strip()
}
REQUIRE_API_KEY = REQUIRE_API_KEY_ENV or bool(VALID_API_KEYS)
WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Public endpoints that don't require authentication
PUBLIC_ENDPOINTS = {
    "/health",
    "/",
    "/docs",
    "/redoc",
    "/openapi.json"
}
PUBLIC_PATH_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi",
    "/static",
    "/dashboard",
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for public endpoints
        if _is_public_endpoint(request.url.path):
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Check rate limit
        now = time.time()
        bucket_type = "write" if request.method.upper() in WRITE_METHODS else "read"
        limit = RATE_LIMIT_WRITE_REQUESTS if bucket_type == "write" else RATE_LIMIT_REQUESTS
        window = RATE_LIMIT_WRITE_WINDOW if bucket_type == "write" else RATE_LIMIT_WINDOW
        window_start = now - window
        
        # Clean old entries
        timestamps = [
            timestamp for timestamp in rate_limit_store[client_id][bucket_type]
            if timestamp > window_start
        ]
        rate_limit_store[client_id][bucket_type] = timestamps
        
        # Check if limit exceeded
        if len(timestamps) >= limit:
            reset_time = int(timestamps[0] + window) if timestamps else int(now + window)
            logger.warning(
                "Rate limit exceeded",
                secure_context={
                    "client": client_id,
                    "bucket": bucket_type,
                    "method": request.method,
                    "path": request.url.path,
                },
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {limit} requests per {window} seconds",
                    "retry_after": window
                },
                headers={
                    "Retry-After": str(window),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                }
            )
        
        # Add current request
        rate_limit_store[client_id][bucket_type].append(now)
        
        # Add rate limit headers
        response = await call_next(request)
        timestamps = rate_limit_store[client_id][bucket_type]
        remaining = limit - len(timestamps)
        reset_time = int(timestamps[0] + window) if timestamps else int(now + window)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        response.headers["X-RateLimit-Bucket"] = bucket_type
        
        if not rate_limit_store[client_id]["read"] and not rate_limit_store[client_id]["write"]:
            rate_limit_store.pop(client_id, None)
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier"""
        api_key = _extract_api_key(request)
        if api_key:
            return f"api_key:{_hash_identifier(api_key)}"
        
        # Fallback to IP address
        ip = _extract_client_ip(request)
        
        return f"ip:{ip}"


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """API key authentication middleware"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public endpoints
        if _is_public_endpoint(request.url.path):
            return await call_next(request)
        
        # Check if API key is required
        if REQUIRE_API_KEY:
            api_key = _extract_api_key(request)
            
            if not api_key:
                logger.warning(
                    "Missing API key",
                    secure_context={"path": request.url.path, "method": request.method},
                )
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={
                        "error": "Authentication required",
                        "message": f"Missing {API_KEY_HEADER} header"
                    },
                    headers={"WWW-Authenticate": "ApiKey"},
                )
            
            if api_key not in VALID_API_KEYS:
                logger.warning(
                    "Invalid API key attempted",
                    secure_context={
                        "path": request.url.path,
                        "method": request.method,
                        "fingerprint": _hash_identifier(api_key),
                    },
                )
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "Invalid API key",
                        "message": "The provided API key is not valid"
                    }
                )
        
        return await call_next(request)


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """Request size limiting middleware"""
    
    async def dispatch(self, request: Request, call_next):
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > MAX_REQUEST_SIZE:
                    logger.warning(
                        "Request rejected due to size",
                        secure_context={
                            "path": request.url.path,
                            "method": request.method,
                            "size": size,
                        },
                    )
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "error": "Request too large",
                            "message": f"Maximum request size is {MAX_REQUEST_SIZE} bytes",
                            "max_size": MAX_REQUEST_SIZE
                        }
                    )
            except ValueError:
                pass
        
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException:
            # Re-raise HTTP exceptions (they're already properly formatted)
            raise
        except Exception:
            # Log unexpected errors
            logger.exception(
                "Unhandled error",
                secure_context={
                    "path": request.url.path,
                    "method": request.method,
                },
            )
            
            # Return generic error response
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "request_id": hashlib.md5(f"{time.time()}{request.url.path}".encode()).hexdigest()[:12]
                }
            )


def _extract_api_key(request: Request) -> Optional[str]:
    header_value = request.headers.get(API_KEY_HEADER)
    if header_value:
        return header_value.strip()
    authorization = request.headers.get("Authorization")
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "apikey" and token:
            return token.strip()
    return None


def _extract_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _hash_identifier(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def _normalize_path(path: Optional[str]) -> str:
    if not path:
        return "/"
    if path != "/" and path.endswith("/"):
        return path.rstrip("/")
    return path


def _is_public_endpoint(path: Optional[str]) -> bool:
    normalized = _normalize_path(path)
    if normalized in PUBLIC_ENDPOINTS:
        return True
    return any(
        normalized == prefix or normalized.startswith(f"{prefix}/")
        for prefix in PUBLIC_PATH_PREFIXES
    )

