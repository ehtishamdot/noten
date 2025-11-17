#!/usr/bin/env python3
"""
Note Ninjas Backend Runner
Simple script to run the FastAPI application
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    # Set default environment variables if not set
    os.environ.setdefault("NOTE_NINJAS_PATH", str(backend_dir.parent / "NoteNinjas"))
    os.environ.setdefault("TITLED_CPG_PATH", str(backend_dir.parent / "Titled_CPGs"))
    os.environ.setdefault("UNTITLED_CPG_PATH", str(backend_dir.parent / "Untitled_CPGs"))
    os.environ.setdefault("VECTOR_STORE_PATH", str(backend_dir / "vector_store"))
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        reload_dirs=[str(backend_dir)]
    )
