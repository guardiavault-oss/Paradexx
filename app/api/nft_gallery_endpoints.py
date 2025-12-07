#!/usr/bin/env python3
"""
NFT gallery endpoints.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict

from app.api.dependencies import get_authenticated_user
from app.api.error_handlers import handle_endpoint_errors
from app.core.provider_clients import get_nft_gallery
from app.core.utils import format_response, get_utc_timestamp


router = APIRouter(prefix="/api/nft", tags=["nft-gallery"])


class NFTGalleryRequest(BaseModel):
    owner_address: str = Field(..., description="Wallet address to inspect")
    include_hidden: bool = Field(False, description="Include hidden NFTs")
    include_spam: bool = Field(False, description="Include flagged spam collections")


@router.post("/gallery")
@handle_endpoint_errors("nft gallery")
async def nft_gallery(
    request: NFTGalleryRequest,
    user: Dict[str, Any] = Depends(get_authenticated_user),
):
    """Return grid-ready NFT data with metadata/traits."""
    gallery = get_nft_gallery(
        owner_address=request.owner_address,
        include_hidden=request.include_hidden,
        include_spam=request.include_spam,
    )
    return format_response(success=True, data=gallery, timestamp=get_utc_timestamp())


__all__ = ["router"]

