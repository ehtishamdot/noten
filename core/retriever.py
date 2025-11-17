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
import hashlib

from .document_processor import DocumentChunk
from config import settings

logger = logging.getLogger(__name__)
class RetrievalResult:

    
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

        return {
            "chunk": self.chunk.to_dict(),
            "bm25_score": self.bm25_score,
            "dense_score": self.dense_score,
            "combined_score": self.combined_score,
            "query": self.query
        }
class Retriever:

    
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
        

        if self.use_openai and settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info(f"Using OpenAI embeddings: {settings.OPENAI_EMBEDDING_MODEL}")
        else:
            self.use_openai = False
            logger.info(f"Using sentence-transformers: {self.embedding_model_name}")
        

        self.vector_store_path.mkdir(parents=True, exist_ok=True)
    
    def initialize(self, chunks: List[DocumentChunk]):

        logger.info(f"Initializing retriever with {len(chunks)} chunks")
        
        # First, try to load existing embeddings + metadata without hash check
        if self._load_embeddings(current_chunks=None):
            logger.info("✅ Loaded existing embeddings from disk - using existing vector store")

            # Ensure embedding model exists for query embeddings if not using OpenAI
            if not self.use_openai and self.embedding_model is None:
                self.embedding_model = SentenceTransformer(self.embedding_model_name)

            # Build BM25 on the chunks loaded from metadata
            self._prepare_bm25()
            logger.info("Retriever initialized")
            return
        
        # If read-only mode is enabled, do not regenerate
        if getattr(settings, "READ_ONLY_VECTOR_STORE", False):
            raise RuntimeError("Read-only vector store mode is enabled and no compatible embeddings were found. Aborting regeneration.")
        
        # Otherwise, proceed to generate embeddings from provided chunks
        logger.info("🔄 No compatible embeddings found, generating new ones")
        self.document_chunks = chunks

        if not self.use_openai:
            self.embedding_model = SentenceTransformer(self.embedding_model_name)

        # Build BM25 on provided chunks and generate embeddings
        self._prepare_bm25()
        self._prepare_embeddings_sync()
        
        logger.info("Retriever initialized")
    
    def _prepare_bm25(self):

        logger.info("Preparing BM25 index")
        

        tokenized_docs = []
        for chunk in self.document_chunks:

            tokens = self._tokenize(chunk.content)
            tokenized_docs.append(tokens)
        
        self.bm25 = BM25Okapi(tokenized_docs)
        logger.info("BM25 index prepared")
    
    async def _prepare_embeddings(self):

        logger.info("Preparing dense embeddings")
        
        chunk_texts = [chunk.content for chunk in self.document_chunks]
        
        if self.use_openai and self.openai_client:

            logger.info(f"Generating embeddings using OpenAI {settings.OPENAI_EMBEDDING_MODEL}")
            self.chunk_embeddings = await self._generate_openai_embeddings(chunk_texts)
        else:

            logger.info(f"Generating embeddings using sentence-transformers")
            self.chunk_embeddings = self.embedding_model.encode(
                chunk_texts, 
                show_progress_bar=True
            )
        

        self._save_embeddings()
        
        logger.info("Dense embeddings prepared")
    
    def _prepare_embeddings_sync(self):

        logger.info("Preparing dense embeddings")
        
        chunk_texts = [chunk.content for chunk in self.document_chunks]
        
        if self.use_openai and self.openai_client:

            logger.info(f"Generating embeddings using OpenAI {settings.OPENAI_EMBEDDING_MODEL}")
            self.chunk_embeddings = self._generate_openai_embeddings_sync(chunk_texts)
        else:

            logger.info(f"Generating embeddings using sentence-transformers")
            self.chunk_embeddings = self.embedding_model.encode(
                chunk_texts, 
                show_progress_bar=True
            )
        

        self._save_embeddings()
        
        logger.info("Dense embeddings prepared")
    
    def _generate_openai_embeddings_sync(self, texts: List[str]) -> np.ndarray:

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

                if self.embedding_model is None:
                    self.embedding_model = SentenceTransformer(self.embedding_model_name)
                fallback_embeddings = self.embedding_model.encode(batch, show_progress_bar=False)
                all_embeddings.extend(fallback_embeddings.tolist())
        
        return np.array(all_embeddings)
    
    async def _generate_openai_embeddings(self, texts: List[str]) -> np.ndarray:

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
                

                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error generating OpenAI embeddings for batch {i//batch_size + 1}: {e}")
                raise
        
        return np.array(all_embeddings)
    
    async def _generate_query_embedding(self, query: str) -> np.ndarray:

        if self.use_openai and self.openai_client:
            try:
                response = self.openai_client.embeddings.create(
                    input=[query],
                    model=settings.OPENAI_EMBEDDING_MODEL
                )
                return np.array([response.data[0].embedding])
            except Exception as e:
                logger.error(f"Error generating OpenAI query embedding: {e}")

                if self.embedding_model:
                    return self.embedding_model.encode([query])
                else:
                    raise
        else:
            return self.embedding_model.encode([query])
    
    def _generate_query_embedding_sync(self, query: str) -> np.ndarray:

        if self.use_openai and self.openai_client:
            try:
                response = self.openai_client.embeddings.create(
                    input=[query],
                    model=settings.OPENAI_EMBEDDING_MODEL
                )
                return np.array([response.data[0].embedding])
            except Exception as e:
                logger.error(f"Error generating OpenAI query embedding: {e}")

                if self.embedding_model:
                    return self.embedding_model.encode([query])
                else:
                    raise
        else:
            return self.embedding_model.encode([query])
    
    def _save_embeddings(self):

        embeddings_file = self.vector_store_path / "embeddings.pkl"
        with open(embeddings_file, 'wb') as f:
            pickle.dump(self.chunk_embeddings, f)
        

        metadata_file = self.vector_store_path / "chunks.json"
        chunk_data = {
            "documents_hash": self._generate_documents_hash(self.document_chunks),
            "chunks": [chunk.to_dict() for chunk in self.document_chunks]
        }
        with open(metadata_file, 'w') as f:
            json.dump(chunk_data, f, indent=2)
    
    def _load_embeddings(self, current_chunks: Optional[List[DocumentChunk]] = None) -> bool:

        embeddings_file = self.vector_store_path / "embeddings.pkl"
        metadata_file = self.vector_store_path / "chunks.json"
        
        if not (embeddings_file.exists() and metadata_file.exists()):
            logger.info("Embedding files not found")
            return False
        
        try:

            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            

            if isinstance(metadata, list):

                logger.info("Old metadata format detected, will regenerate embeddings")
                return False
            
            stored_hash = metadata.get("documents_hash")
            chunk_data = metadata.get("chunks", [])
            

            if current_chunks and stored_hash:
                current_hash = self._generate_documents_hash(current_chunks)
                if stored_hash != current_hash:
                    logger.info("Document hash mismatch, embeddings need regeneration")
                    return False
            

            with open(embeddings_file, 'rb') as f:
                self.chunk_embeddings = pickle.load(f)
            

            self.document_chunks = []
            for data in chunk_data:
                chunk = DocumentChunk(
                    content=data["content"],
                    source_type=data["source_type"],
                    source_id=data["source_id"],
                    title=data["title"],
                    headers=data["headers"],
                    page_ref=data["page_ref"],
                    chunk_id=data["chunk_id"],
                    file_path=data.get("file_path")
                )
                self.document_chunks.append(chunk)
            

            if len(self.chunk_embeddings) != len(self.document_chunks):
                logger.error(f"Embedding count ({len(self.chunk_embeddings)}) doesn't match chunk count ({len(self.document_chunks)})")
                return False
            
            logger.info(f"Successfully loaded {len(self.document_chunks)} chunks with embeddings")
            return True
            
        except Exception as e:
            logger.error(f"Error loading embeddings: {e}")
            return False
    
    def _generate_documents_hash(self, chunks: List[DocumentChunk]) -> str:

        # Create a stable string representation of all chunks
        chunks_data = []
        for chunk in sorted(chunks, key=lambda x: (x.source_id, x.chunk_id)):
            chunks_data.append(f"{chunk.source_id}|{chunk.chunk_id}|{chunk.content}")
        
        combined_data = "\n".join(chunks_data)
        return hashlib.sha256(combined_data.encode('utf-8')).hexdigest()
    
    def _tokenize(self, text: str) -> List[str]:

        import re

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

        
        if not self.bm25 or self.chunk_embeddings is None:
            raise ValueError("Retriever not initialized")
        

        query_tokens = self._tokenize(query)
        

        bm25_scores = self.bm25.get_scores(query_tokens)
        

        query_embedding = self._generate_query_embedding_sync(query)
        dense_scores = np.dot(query_embedding, self.chunk_embeddings.T)[0]
        

        bm25_scores = self._normalize_scores(bm25_scores)
        dense_scores = self._normalize_scores(dense_scores)
        

        combined_scores = 0.5 * bm25_scores + 0.5 * dense_scores
        

        if source_boosts or header_boosts or topic_boosts:
            combined_scores = self._apply_boosts(
                combined_scores,
                source_boosts,
                header_boosts,
                topic_boosts
            )
        

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

        
        boosted_scores = scores.copy()
        
        for i, chunk in enumerate(self.document_chunks):
            boost_multiplier = 1.0
            

            if source_boosts and chunk.source_type in source_boosts:
                boost_multiplier *= source_boosts[chunk.source_type]
            

            if header_boosts:
                for header in chunk.headers:
                    for boost_term, boost_value in header_boosts.items():
                        if boost_term.lower() in header.lower():
                            boost_multiplier *= boost_value
            

            if topic_boosts:
                for topic, boost_value in topic_boosts.items():
                    if topic.lower() in chunk.content.lower():
                        boost_multiplier *= boost_value
            
            boosted_scores[i] *= boost_multiplier
        
        return boosted_scores
    
    def get_sources_info(self) -> Dict[str, Any]:

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
        

        for source_type in source_types:
            source_types[source_type] = list(source_types[source_type])
        
        return {
            "total_chunks": len(self.document_chunks),
            "source_counts": source_counts,
            "sources_by_type": source_types
        }
