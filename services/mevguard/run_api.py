#!/usr/bin/env python3
"""
MEV Protection API Runner
"""

import sys
from pathlib import Path

import uvicorn

# Add src to path
src_path = str(Path(__file__).parent / "src")
sys.path.insert(0, src_path)

# Also add the current directory
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", "8015"))
    uvicorn.run(
        "mev_protection.api.enhanced_mev_api:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
