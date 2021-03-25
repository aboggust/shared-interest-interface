import os
from pathlib import Path

# SERVING STATIC FILES
ROOT = Path(
    os.path.abspath(__file__)
).parent.parent.parent  # Root directory of the project
SRC = ROOT / "src"
CLIENT = ROOT / "client"
