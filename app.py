from pathlib import Path
import sys

backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from main import app
