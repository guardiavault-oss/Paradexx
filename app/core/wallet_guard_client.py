#!/usr/bin/env python3
"""
Wallet Guard Client Wrapper
Provides resilient access to wallet-guard service endpoints with optional event streaming
"""

from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Awaitable, Callable, Dict, Optional

import httpx
import redis.asyncio as redis
import structlog

from config.settings import settings

logger = structlog.get_logger(__name__)


DEFAULT_WALLET_GUARD_URL = os.getenv("WALLET_GUARD_URL", "http://localhost:8044")
DEFAULT_WALLET_GUARD_TIMEOUT = float(os.getenv("WALLET_GUARD_TIMEOUT", "15"))
EVENT_CHANNEL = os.getenv("WALLET_GUARD_EVENT_CHANNEL", "wallet_guard:events")


class WalletGuardClientError(Exception):
    """Base exception for wallet guard client errors"""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code or 500


@dataclass
class CacheEntry:
    data: dict[str, Any]
    timestamp: str


class WalletGuardClient:
    """Async HTTP client wrapper with caching and Redis event streaming support"""

    def __init__(
        self,
        base_url: str | None = None,
        timeout: float = DEFAULT_WALLET_GUARD_TIMEOUT,
        redis_url: str | None = None,
        redis_channel: str = EVENT_CHANNEL,
    ):
        self.base_url = (base_url or DEFAULT_WALLET_GUARD_URL).rstrip("/")
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)
        self._cache: dict[str, CacheEntry] = {}
        self._redis_url = redis_url or settings.redis_url
        self._redis_channel = redis_channel
        self._redis: redis.Redis | None = None
        self._event_task: asyncio.Task | None = None
        self._event_handlers: list[Callable[[dict[str, Any]], Awaitable[None]]] = []
        self._event_lock = asyncio.Lock()

    async def aclose(self):
        """Close underlying resources"""
        if self._event_task:
            await self.stop_event_stream()
        await self._client.aclose()
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def get_service_status(self) -> dict[str, Any]:
        return await self._safe_fetch(
            method="GET",
            path="/status",
            cache_key="status",
            default={"status": "unavailable"},
        )

    async def get_threat_feed(self, limit: int = 50, hours: int = 24) -> dict[str, Any]:
        return await self._safe_fetch(
            method="GET",
            path="/threats",
            params={"limit": limit, "hours": hours},
            cache_key="threats",
            default={"threats": [], "count": 0, "window_hours": hours},
        )

    async def get_protection_actions(self, limit: int = 25) -> dict[str, Any]:
        return await self._safe_fetch(
            method="GET",
            path="/actions",
            params={"limit": limit},
            cache_key="actions",
            default={"actions": [], "count": 0},
        )

    async def request_presign(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._safe_fetch(
            method="POST",
            path="/api/v1/wallet-guard/presign",
            json=payload,
        )

    async def get_presign_status(self, signature_id: str) -> dict[str, Any]:
        return await self._safe_fetch(
            method="GET",
            path=f"/presign/{signature_id}",
            allow_404=True,
        )

    async def start_event_stream(
        self, handler: Callable[[dict[str, Any]], Awaitable[None]] | None = None
    ) -> Optional[asyncio.Task]:
        """Begin listening for Redis-published wallet guard events"""
        if not self._redis_url:
            logger.info("Wallet Guard event stream skipped (no redis configured)")
            return None

        async with self._event_lock:
            if handler:
                self._event_handlers.append(handler)
            if self._event_task and not self._event_task.done():
                return self._event_task

            if not self._redis:
                self._redis = redis.from_url(self._redis_url, decode_responses=True)

            async def _runner():
                try:
                    pubsub = self._redis.pubsub()
                    await pubsub.subscribe(self._redis_channel)
                    logger.info(
                        "Wallet Guard event stream started",
                        channel=self._redis_channel,
                        redis_url=self._redis_url,
                    )
                    async for message in pubsub.listen():
                        if message.get("type") != "message":
                            continue
                        data = message.get("data")
                        if isinstance(data, bytes):
                            data = data.decode()
                        try:
                            payload = json.loads(data)
                        except Exception:
                            payload = {"raw": data}
                        for cb in list(self._event_handlers):
                            try:
                                if cb:
                                    await cb(payload)
                            except Exception as cb_error:
                                logger.warning(
                                    "Wallet Guard event handler failure",
                                    error=str(cb_error),
                                )
                except asyncio.CancelledError:
                    logger.info("Wallet Guard event stream cancelled")
                    raise
                except Exception as exc:
                    logger.error("Wallet Guard event stream error", error=str(exc))
                finally:
                    self._event_task = None

            self._event_task = asyncio.create_task(_runner(), name="wallet-guard-events")
            return self._event_task

    async def stop_event_stream(self):
        """Stop Redis event listener"""
        async with self._event_lock:
            if self._event_task:
                self._event_task.cancel()
                try:
                    await self._event_task
                except asyncio.CancelledError:
                    pass
                self._event_task = None

    async def _safe_fetch(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
        cache_key: str | None = None,
        default: dict[str, Any] | None = None,
        allow_404: bool = False,
    ) -> dict[str, Any]:
        """Wrapper around HTTP requests with cache-backed fallback"""
        try:
            response = await self._client.request(
                method,
                path,
                params=params,
                json=json,
            )
            if allow_404 and response.status_code == 404:
                raise WalletGuardClientError("Resource not found", status_code=404)

            response.raise_for_status()
            data = response.json()
            if cache_key:
                self._cache[cache_key] = CacheEntry(
                    data=data,
                    timestamp=datetime.utcnow().isoformat(),
                )
            return {**data, "available": True, "cached": False}
        except httpx.HTTPStatusError as exc:
            error = WalletGuardClientError(
                message=str(exc),
                status_code=exc.response.status_code,
            )
            if allow_404 and error.status_code == 404:
                raise error
            logger.warning("Wallet Guard HTTP error", error=str(exc), path=path, status=error.status_code)
            return self._handle_failure(cache_key, default, error)
        except WalletGuardClientError as exc:
            logger.warning("Wallet Guard client error", error=str(exc), path=path, status=exc.status_code)
            if allow_404 and exc.status_code == 404:
                raise
            return self._handle_failure(cache_key, default, exc)
        except Exception as exc:
            logger.warning("Wallet Guard request failed", error=str(exc), path=path)
            return self._handle_failure(cache_key, default, exc)

    def _handle_failure(
        self,
        cache_key: str | None,
        default: dict[str, Any] | None,
        error: Exception,
    ) -> dict[str, Any]:
        """Return cached or default payload when service fails"""
        error_message = str(error)
        status_code = getattr(error, "status_code", None)

        if cache_key and cache_key in self._cache:
            cached = self._cache[cache_key]
            payload = {
                **cached.data,
                "available": False,
                "cached": True,
                "cached_at": cached.timestamp,
                "error": error_message,
            }
            if status_code:
                payload["status_code"] = status_code
            return payload

        fallback = default.copy() if default else {}
        fallback.update(
            {
                "available": False,
                "cached": False,
                "error": error_message,
            }
        )
        if status_code:
            fallback["status_code"] = status_code
        return fallback


_wallet_guard_client: WalletGuardClient | None = None


def get_wallet_guard_client() -> WalletGuardClient | None:
    """Return singleton wallet guard client instance"""
    global _wallet_guard_client
    if _wallet_guard_client is None:
        try:
            _wallet_guard_client = WalletGuardClient(
                base_url=DEFAULT_WALLET_GUARD_URL,
                redis_url=os.getenv("WALLET_GUARD_REDIS_URL", settings.redis_url),
            )
        except Exception as exc:
            logger.error("Failed to initialize WalletGuardClient", error=str(exc))
            _wallet_guard_client = None
    return _wallet_guard_client


__all__ = [
    "WalletGuardClient",
    "WalletGuardClientError",
    "get_wallet_guard_client",
]

