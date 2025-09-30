#!/usr/bin/env python3
"""
Script to regenerate embeddings using OpenAI API
This will replace the existing sentence-transformer embeddings with OpenAI embeddings.
"""

import asyncio
import logging
import json
import pickle
import os
from pathlib import Path
from typing import List
import numpy as np
from openai import OpenAI

from core.document_processor import DocumentChunk, DocumentProcessorFactory
from config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenAIEmbeddingGenerator:
    """Generate embeddings using OpenAI API"""
    
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.batch_size = 100  # OpenAI rate limiting
    
    async def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts"""
        logger.info(f"Generating embeddings for {len(texts)} texts using {self.model}")
        
        all_embeddings = []
        
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            total_batches = (len(texts) + self.batch_size - 1) // self.batch_size
            
            logger.info(f"Processing batch {batch_num}/{total_batches}")
            
            try:
                response = self.client.embeddings.create(
                    input=batch,
                    model=self.model
                )
                
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)
                
                # Add delay to respect rate limits
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error in batch {batch_num}: {e}")
                raise
        
        logger.info(f"Successfully generated {len(all_embeddings)} embeddings")
        return np.array(all_embeddings)


def load_existing_chunks(vector_store_path: Path) -> List[DocumentChunk]:
    """Load existing document chunks from vector store"""
    chunks_file = vector_store_path / "chunks.json"
    
    if not chunks_file.exists():
        raise FileNotFoundError(f"Chunks file not found: {chunks_file}")
    
    logger.info(f"Loading chunks from {chunks_file}")
    
    with open(chunks_file, 'r') as f:
        chunk_data = json.load(f)
    
    chunks = []
    for data in chunk_data:
        chunk = DocumentChunk(
            content=data["content"],
            source_type=data["source_type"],
            source_id=data["source_id"],
            title=data["title"],
            headers=data["headers"],
            page_ref=data["page_ref"],
            chunk_id=data["chunk_id"]
        )
        chunks.append(chunk)
    
    logger.info(f"Loaded {len(chunks)} chunks")
    return chunks


def save_embeddings(embeddings: np.ndarray, vector_store_path: Path):
    """Save embeddings to disk"""
    embeddings_file = vector_store_path / "embeddings.pkl"
    
    logger.info(f"Saving embeddings to {embeddings_file}")
    
    # Backup existing embeddings
    if embeddings_file.exists():
        backup_file = vector_store_path / "embeddings_backup.pkl"
        logger.info(f"Creating backup: {backup_file}")
        embeddings_file.rename(backup_file)
    
    # Save new embeddings
    with open(embeddings_file, 'wb') as f:
        pickle.dump(embeddings, f)
    
    logger.info("Embeddings saved")


async def main():
    """Main function to regenerate embeddings"""
    logger.info("Starting OpenAI embedding regeneration")
    
    # Check if OpenAI API key is set
    if not settings.OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY not set in environment or config")
        logger.info("Please set your OpenAI API key in:")
        logger.info("1. Environment variable: export OPENAI_API_KEY='your-key-here'")
        logger.info("2. Or in .env file: OPENAI_API_KEY=your-key-here")
        return
    
    vector_store_path = Path(settings.VECTOR_STORE_PATH)
    
    try:
        # Load existing chunks
        chunks = load_existing_chunks(vector_store_path)
        
        # Extract texts
        texts = [chunk.content for chunk in chunks]
        
        # Initialize OpenAI embedding generator
        generator = OpenAIEmbeddingGenerator(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_EMBEDDING_MODEL
        )
        
        # Generate embeddings
        embeddings = await generator.generate_embeddings(texts)
        
        # Save embeddings
        save_embeddings(embeddings, vector_store_path)
        
        # Print summary
        logger.info("=" * 50)
        logger.info("EMBEDDING REGENERATION COMPLETE")
        logger.info("=" * 50)
        logger.info(f"Model used: {settings.OPENAI_EMBEDDING_MODEL}")
        logger.info(f"Total chunks: {len(chunks)}")
        logger.info(f"Embedding dimensions: {embeddings.shape[1]}")
        logger.info(f"Total embeddings: {embeddings.shape[0]}")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"Error during embedding regeneration: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())