#!/usr/bin/env python3
"""
Asynchronous task management helpers for GuardianX.

These utilities safely schedule background asyncio tasks even when no event
loop is running yet (e.g., during module import time). When the FastAPI/uvicorn
event loop is unavailable, a dedicated background loop is spun up in a daemon
thread so long-running monitors can still operate without crashing startup.
"""

from __future__ import annotations

import asyncio
import threading
from concurrent.futures import Future
from typing import Any, Coroutine, Optional, Union

import structlog

logger = structlog.get_logger(__name__)

_background_loop: Optional[asyncio.AbstractEventLoop] = None
_background_thread: Optional[threading.Thread] = None
_task_handles: list[Union[asyncio.Task[Any], Future[Any]]] = []


def _run_background_loop(loop: asyncio.AbstractEventLoop) -> None:
    asyncio.set_event_loop(loop)
    loop.run_forever()


def _ensure_background_loop() -> asyncio.AbstractEventLoop:
    global _background_loop, _background_thread

    if _background_loop and _background_loop.is_running():
        return _background_loop

    loop = asyncio.new_event_loop()
    thread = threading.Thread(
        target=_run_background_loop,
        args=(loop,),
        name="guardianx-background-loop",
        daemon=True,
    )
    thread.start()

    _background_loop = loop
    _background_thread = thread
    logger.warning("Started dedicated asyncio background loop for GuardianX services")
    return loop


def schedule_background_task(
    coro: Coroutine[Any, Any, Any],
    name: Optional[str] = None,
) -> Union[asyncio.Task[Any], Future[Any]]:
    """
    Schedule a coroutine to run in the active event loop if one exists.
    Falls back to a dedicated background loop when called outside an
    asyncio context (such as during module import).
    """
    task_name = name or getattr(coro, "__name__", "guardianx-task")

    try:
        loop = asyncio.get_running_loop()
        task = loop.create_task(coro, name=task_name)
        _task_handles.append(task)
        logger.info("Scheduled task on running loop", task=task_name)
        return task
    except RuntimeError:
        loop = _ensure_background_loop()
        future = asyncio.run_coroutine_threadsafe(coro, loop)
        _task_handles.append(future)
        logger.warning("Scheduled task on background loop", task=task_name)
        return future


__all__ = ["schedule_background_task"]

