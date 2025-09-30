"""
Cross-encoder reranker for improving retrieval quality
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import CrossEncoder
from .retriever import RetrievalResult

logger = logging.getLogger(__name__)
class Reranker:

    
    def __init__(
        self,
        model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
        max_length: int = 512
    ):
        self.model_name = model_name
        self.max_length = max_length
        self.model = None
    
    def initialize(self):

        logger.info(f"Initializing reranker with model: {self.model_name}")
        try:
            self.model = CrossEncoder(
                self.model_name,
                max_length=self.max_length
            )
            logger.info("Reranker initialized")
        except Exception as e:
            logger.error(f"Failed to initialize reranker: {e}")
            raise
    
    def rerank(
        self,
        query: str,
        results: List[RetrievalResult],
        top_n: int = 12,
        diversity_threshold: float = 0.8
    ) -> List[RetrievalResult]:

        
        if not self.model:
            raise ValueError("Reranker not initialized")
        
        if not results:
            return results
        
        logger.info("Reranking {len(results)} results for query: {query[:50]}")
        

        query_doc_pairs = []
        for result in results:

            doc_content = result.chunk.content
            if len(doc_content) > self.max_length - len(query) - 10:
                doc_content = doc_content[:self.max_length - len(query) - 10] + ""
            
            query_doc_pairs.append([query, doc_content])
        

        try:
            rerank_scores = self.model.predict(query_doc_pairs)
        except Exception as e:
            logger.error(f"Error in cross-encoder prediction: {e}")

            return results[:top_n]
        

        for i, result in enumerate(results):
            result.rerank_score = float(rerank_scores[i])
        

        reranked_results = sorted(results, key=lambda x: x.rerank_score, reverse=True)
        

        if diversity_threshold < 1.0:
            reranked_results = self._apply_diversity_filter(
                reranked_results,
                diversity_threshold
            )
        

        reranked_results = self._ensure_source_diversity(reranked_results)
        
        return reranked_results[:top_n]
    
    def _apply_diversity_filter(
        self,
        results: List[RetrievalResult],
        threshold: float
    ) -> List[RetrievalResult]:

        
        if len(results) <= 1:
            return results
        
        diverse_results = [results[0]]  # Always include the top result
        
        for result in results[1:]:
            is_diverse = True
            

            for selected in diverse_results:
                similarity = self._calculate_content_similarity(
                    result.chunk.content,
                    selected.chunk.content
                )
                
                if similarity > threshold:
                    is_diverse = False
                    break
            
            if is_diverse:
                diverse_results.append(result)
        
        return diverse_results
    
    def _calculate_content_similarity(self, content1: str, content2: str) -> float:

        

        words1 = set(content1.lower().split())
        words2 = set(content2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    def _ensure_source_diversity(self, results: List[RetrievalResult]) -> List[RetrievalResult]:

        
        source_type_counts = {
            "note_ninjas": 0,
            "cpg": 0,
            "textbook": 0
        }
        

        for result in results:
            source_type = result.chunk.source_type
            if source_type in source_type_counts:
                source_type_counts[source_type] += 1
        

        if source_type_counts["note_ninjas"] == 0:

            # For now, we'll just log a warning
            logger.warning("No Note Ninjas sources found in top results")
        
        return results
    
    def batch_rerank(
        self,
        queries_and_results: List[tuple],
        top_n: int = 12
    ) -> List[List[RetrievalResult]]:

        
        if not self.model:
            raise ValueError("Reranker not initialized")
        
        reranked_results = []
        
        for query, results in queries_and_results:
            reranked = self.rerank(query, results, top_n)
            reranked_results.append(reranked)
        
        return reranked_results
