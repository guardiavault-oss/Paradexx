"""
Initialize the src package.
"""

import sys
from pathlib import Path

# Add the src directory to Python path for imports
src_path = Path(__file__).parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

__version__ = "1.0.0"
__author__ = "Enterprise Security Team"
__description__ = "Enterprise Quantum Mempool Monitor"
