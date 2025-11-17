"""
Configuration settings for Note Ninjas backend
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
class Settings(BaseSettings):

    

    NOTE_NINJAS_PATH: str = "../NoteNinjas"
    TITLED_CPG_PATH: str = "../Titled_CPGs"
    UNTITLED_CPG_PATH: str = "../Untitled_CPGs"
    VECTOR_STORE_PATH: str = "./vector_store"
    READ_ONLY_VECTOR_STORE: bool = True  # If True, never regenerate embeddings; error if missing/incompatible
    CPG_PATHS: List[str] = []
    

    ALLOWED_ORIGINS: List[str] = [
        "https://note-ninjas-app-frontend.vercel.app",
        "https://note-ninjas-app-frontend-5sd5.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002"
    ]
    

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RETRIEVAL: int = 50
    TOP_N_RERANK: int = 12
    SIMILARITY_THRESHOLD: float = 0.7
    

    USE_OPENAI_EMBEDDINGS: bool = True
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o"
    

    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    RERANK_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    

    FEEDBACK_STORAGE_TYPE: str = "memory"  # memory, file, mongodb
    DATABASE_URL: str = ""
    

    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
def get_cpg_paths() -> List[str]:

    return ["../Titled_CPGs", "../Untitled_CPGs"]

settings = Settings()
settings.CPG_PATHS = get_cpg_paths()
