"""
Document retrieval system with hybrid search (BM25 + dense vectors)
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import json
import pickle
from pathlib import Path
import asyncio
import openai
from openai import OpenAI

from .document_processor import DocumentChunk
from config import settings

logger = logging.getLogger(__name__)


class RetrievalResult:
    """Result from retrieval system"""
    
    def __init__(
        self,
        chunk: DocumentChunk,
        bm25_score: float,
        dense_score: float,
        combined_score: float,
        query: str
    ):
        self.chunk = chunk
        self.bm25_score = bm25_score
        self.dense_score = dense_score
        self.combined_score = combined_score
        self.query = query
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "chunk": self.chunk.to_dict(),
            "bm25_score": self.bm25_score,
            "dense_score": self.dense_score,
            "combined_score": self.combined_score,
            "query": self.query
        }


class Retriever:
    """Hybrid retrieval system (BM25 + dense vectors)"""
    
    def __init__(
        self,
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        vector_store_path: str = "./vector_store"
    ):
        self.embedding_model_name = embedding_model
        self.vector_store_path = Path(vector_store_path)
        self.embedding_model = None
        self.openai_client = None
        self.use_openai = settings.USE_OPENAI_EMBEDDINGS
        self.bm25 = None
        self.document_chunks = []
        self.chunk_embeddings = None
        
        # Initialize OpenAI client if using OpenAI embeddings
        if self.use_openai and settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info(f"Using OpenAI embeddings: {settings.OPENAI_EMBEDDING_MODEL}")
        else:
            self.use_openai = False
            logger.info(f"Using sentence-transformers: {self.embedding_model_name}")
        
        # Create vector store directory
        self.vector_store_path.mkdir(parents=True, exist_ok=True)
    
    def initialize(self, chunks: List[DocumentChunk]):
        """Initialize retrieval system with document chunks"""
        logger.info(f"Initializing retriever with {len(chunks)} chunks")
        
        self.document_chunks = chunks
        
        # Initialize embedding model (only if not using OpenAI)
        if not self.use_openai:
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
        
        # Prepare BM25
        self._prepare_bm25()
        
        # Prepare dense embeddings (synchronous version)
        self._prepare_embeddings_sync()
        
        logger.info("Retriever initialized successfully")
    
    def _prepare_bm25(self):
        """Prepare BM25 index"""
        logger.info("Preparing BM25 index...")
        
        # Tokenize documents for BM25
        tokenized_docs = []
        for chunk in self.document_chunks:
            # Simple tokenization - split on whitespace and punctuation
            tokens = self._tokenize(chunk.content)
            tokenized_docs.append(tokens)
        
        self.bm25 = BM25Okapi(tokenized_docs)
        logger.info("BM25 index prepared")
    
    async def _prepare_embeddings(self):
        """Prepare dense embeddings"""
        logger.info("Preparing dense embeddings...")
        
        chunk_texts = [chunk.content for chunk in self.document_chunks]
        
        if self.use_openai and self.openai_client:
            # Use OpenAI embeddings
            logger.info(f"Generating embeddings using OpenAI {settings.OPENAI_EMBEDDING_MODEL}")
            self.chunk_embeddings = await self._generate_openai_embeddings(chunk_texts)
        else:
            # Fallback to sentence-transformers
            logger.info(f"Generating embeddings using sentence-transformers")
            self.chunk_embeddings = self.embedding_model.encode(
                chunk_texts, 
                show_progress_bar=True
            )
        
        # Save embeddings to disk
        self._save_embeddings()
        
        logger.info("Dense embeddings prepared")
    
    def _prepare_embeddings_sync(self):
        """Prepare dense embeddings (synchronous version)"""
        logger.info("Preparing dense embeddings...")
        
        chunk_texts = [chunk.content for chunk in self.document_chunks]
        
        if self.use_openai and self.openai_client:
            # Use OpenAI embeddings
            logger.info(f"Generating embeddings using OpenAI {settings.OPENAI_EMBEDDING_MODEL}")
            self.chunk_embeddings = self._generate_openai_embeddings_sync(chunk_texts)
        else:
            # Fallback to sentence-transformers
            logger.info(f"Generating embeddings using sentence-transformers")
            self.chunk_embeddings = self.embedding_model.encode(
                chunk_texts, 
                show_progress_bar=True
            )
        
        # Save embeddings to disk
        self._save_embeddings()
        
        logger.info("Dense embeddings prepared")
    
    def _generate_openai_embeddings_sync(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings using OpenAI API (synchronous)"""
        batch_size = 100  # OpenAI API rate limiting
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")
            
            try:
                response = self.openai_client.embeddings.create(
                    input=batch,
                    model=settings.OPENAI_EMBEDDING_MODEL
                )
                
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)
                
            except Exception as e:
                logger.error(f"Error generating embeddings for batch {i//batch_size + 1}: {e}")
                # Fallback to sentence-transformers for this batch
                if self.embedding_model is None:
                    self.embedding_model = SentenceTransformer(self.embedding_model_name)
                fallback_embeddings = self.embedding_model.encode(batch, show_progress_bar=False)
                all_embeddings.extend(fallback_embeddings.tolist())
        
        return np.array(all_embeddings)
    
    async def _generate_openai_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings using OpenAI API"""
        batch_size = 100  # OpenAI API rate limiting
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")
            
            try:
                response = self.openai_client.embeddings.create(
                    input=batch,
                    model=settings.OPENAI_EMBEDDING_MODEL
                )
                
                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)
                
                # Add small delay to respect rate limits
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error generating OpenAI embeddings for batch {i//batch_size + 1}: {e}")
                raise
        
        return np.array(all_embeddings)
    
    async def _generate_query_embedding(self, query: str) -> np.ndarray:
        """Generate embedding for a single query"""
        if self.use_openai and self.openai_client:
            try:
                response = self.openai_client.embeddings.create(
                    input=[query],
                    model=settings.OPENAI_EMBEDDING_MODEL
                )
                return np.array([response.data[0].embedding])
            except Exception as e:
                logger.error(f"Error generating OpenAI query embedding: {e}")
                # Fallback to sentence-transformers if available
                if self.embedding_model:
                    return self.embedding_model.encode([query])
                else:
                    raise
        else:
            return self.embedding_model.encode([query])
    
    def _save_embeddings(self):
        """Save embeddings to disk"""
        embeddings_file = self.vector_store_path / "embeddings.pkl"
        with open(embeddings_file, 'wb') as f:
            pickle.dump(self.chunk_embeddings, f)
        
        # Save chunk metadata
        metadata_file = self.vector_store_path / "chunks.json"
        chunk_data = [chunk.to_dict() for chunk in self.document_chunks]
        with open(metadata_file, 'w') as f:
            json.dump(chunk_data, f, indent=2)
    
    def _load_embeddings(self) -> bool:
        """Load embeddings from disk"""
        embeddings_file = self.vector_store_path / "embeddings.pkl"
        metadata_file = self.vector_store_path / "chunks.json"
        
        if not (embeddings_file.exists() and metadata_file.exists()):
            return False
        
        try:
            # Load embeddings
            with open(embeddings_file, 'rb') as f:
                self.chunk_embeddings = pickle.load(f)
            
            # Load chunk metadata
            with open(metadata_file, 'r') as f:
                chunk_data = json.load(f)
            
            # Reconstruct chunks
            self.document_chunks = []
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
                self.document_chunks.append(chunk)
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading embeddings: {e}")
            return False
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        import re
        # Remove punctuation and split on whitespace
        tokens = re.findall(r'\b\w+\b', text.lower())
        return tokens
    
    def search(
        self,
        query: str,
        top_k: int = 50,
        source_boosts: Optional[Dict[str, float]] = None,
        header_boosts: Optional[Dict[str, float]] = None,
        topic_boosts: Optional[Dict[str, float]] = None
    ) -> List[RetrievalResult]:
        """Perform hybrid search"""
        
        if not self.bm25 or self.chunk_embeddings is None:
            raise ValueError("Retriever not initialized")
        
        # Tokenize query for BM25
        query_tokens = self._tokenize(query)
        
        # Get BM25 scores
        bm25_scores = self.bm25.get_scores(query_tokens)
        
        # Get dense scores using async method
        query_embedding = asyncio.run(self._generate_query_embedding(query))
        dense_scores = np.dot(query_embedding, self.chunk_embeddings.T)[0]
        
        # Normalize scores
        bm25_scores = self._normalize_scores(bm25_scores)
        dense_scores = self._normalize_scores(dense_scores)
        
        # Combine scores (equal weight for now)
        combined_scores = 0.5 * bm25_scores + 0.5 * dense_scores
        
        # Apply boosts
        if source_boosts or header_boosts or topic_boosts:
            combined_scores = self._apply_boosts(
                combined_scores,
                source_boosts,
                header_boosts,
                topic_boosts
            )
        
        # Get top-k results
        top_indices = np.argsort(combined_scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            result = RetrievalResult(
                chunk=self.document_chunks[idx],
                bm25_score=bm25_scores[idx],
                dense_score=dense_scores[idx],
                combined_score=combined_scores[idx],
                query=query
            )
            results.append(result)
        
        return results
    
    def _normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """Normalize scores to [0, 1]"""
        if len(scores) == 0:
            return scores
        
        min_score = np.min(scores)
        max_score = np.max(scores)
        
        if max_score == min_score:
            return np.ones_like(scores)
        
        return (scores - min_score) / (max_score - min_score)
    
    def _apply_boosts(
        self,
        scores: np.ndarray,
        source_boosts: Optional[Dict[str, float]],
        header_boosts: Optional[Dict[str, float]],
        topic_boosts: Optional[Dict[str, float]]
    ) -> np.ndarray:
        """Apply various boosts to scores"""
        
        boosted_scores = scores.copy()
        
        for i, chunk in enumerate(self.document_chunks):
            boost_multiplier = 1.0
            
            # Source boost
            if source_boosts and chunk.source_type in source_boosts:
                boost_multiplier *= source_boosts[chunk.source_type]
            
            # Header boost
            if header_boosts:
                for header in chunk.headers:
                    for boost_term, boost_value in header_boosts.items():
                        if boost_term.lower() in header.lower():
                            boost_multiplier *= boost_value
            
            # Topic boost
            if topic_boosts:
                for topic, boost_value in topic_boosts.items():
                    if topic.lower() in chunk.content.lower():
                        boost_multiplier *= boost_value
            
            boosted_scores[i] *= boost_multiplier
        
        return boosted_scores
    
    def get_sources_info(self) -> Dict[str, Any]:
        """Get information about available sources"""
        source_counts = {}
        source_types = {}
        
        for chunk in self.document_chunks:
            source_type = chunk.source_type
            source_id = chunk.source_id
            
            if source_type not in source_counts:
                source_counts[source_type] = 0
                source_types[source_type] = set()
            
            source_counts[source_type] += 1
            source_types[source_type].add(source_id)
        
        # Convert sets to lists
        for source_type in source_types:
            source_types[source_type] = list(source_types[source_type])
        
        return {
            "total_chunks": len(self.document_chunks),
            "source_counts": source_counts,
            "sources_by_type": source_types
        }
