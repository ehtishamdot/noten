"""
Main RAG system for Note Ninjas OT Recommender
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import asyncio
import json
import re

from .document_processor import DocumentProcessorFactory, DocumentChunk
from .retriever import Retriever
from .reranker import Reranker
from .feedback_manager import FeedbackManager, FeedbackState
from models.request_models import UserInput, RAGManifest
from models.response_models import (
    RecommendationResponse, Subsection, Exercise, Source, Alternative,
    SourceType, ConfidenceLevel
)
from config import settings

logger = logging.getLogger(__name__)


class RAGSystem:
    """Main RAG system for generating OT recommendations"""
    
    def __init__(
        self,
        note_ninjas_path: str,
        cpg_paths: List[str],
        vector_store_path: str
    ):
        self.note_ninjas_path = Path(note_ninjas_path)
        self.cpg_paths = [Path(p) for p in cpg_paths]
        self.vector_store_path = Path(vector_store_path)
        
        # Initialize components
        self.document_processor = DocumentProcessorFactory()
        self.retriever = Retriever(
            embedding_model=settings.EMBEDDING_MODEL,
            vector_store_path=settings.VECTOR_STORE_PATH
        )
        self.reranker = Reranker(
            model_name=settings.RERANK_MODEL,
            max_length=512
        )
        
        # Document cache
        self.processed_documents: List[DocumentChunk] = []
        self.initialized = False
    
    async def initialize(self):
        """Initialize the RAG system"""
        logger.info("Initializing RAG system...")
        
        try:
            # Process documents
            await self._process_documents()
            
            # Initialize retriever
            self.retriever.initialize(self.processed_documents)
            
            # Initialize reranker
            self.reranker.initialize()
            
            self.initialized = True
            logger.info("RAG system initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {e}")
            raise
    
    async def _process_documents(self):
        """Process all documents in the corpus"""
        logger.info("Processing documents...")
        
        all_chunks = []
        
        # Process Note Ninjas documents (highest priority)
        if self.note_ninjas_path.exists():
            logger.info(f"Processing Note Ninjas documents from {self.note_ninjas_path}")
            nn_chunks = await self._process_directory(self.note_ninjas_path, "note_ninjas")
            all_chunks.extend(nn_chunks)
            logger.info(f"Processed {len(nn_chunks)} Note Ninjas chunks")
        
        # Process CPG documents
        for cpg_path in self.cpg_paths:
            if cpg_path.exists():
                logger.info(f"Processing CPG documents from {cpg_path}")
                cpg_chunks = await self._process_directory(cpg_path, "cpg")
                all_chunks.extend(cpg_chunks)
                logger.info(f"Processed {len(cpg_chunks)} CPG chunks")
        
        self.processed_documents = all_chunks
        logger.info(f"Total processed chunks: {len(all_chunks)}")
    
    async def _process_directory(self, directory: Path, source_type: str) -> List[DocumentChunk]:
        """Process all documents in a directory"""
        chunks = []
        
        # Get all supported files
        supported_extensions = ['.pdf', '.docx', '.txt']
        files = []
        
        for ext in supported_extensions:
            files.extend(directory.glob(f"**/*{ext}"))
        
        # Process files
        for file_path in files:
            try:
                file_chunks = self.document_processor.process_file(file_path)
                
                # Update source type
                for chunk in file_chunks:
                    chunk.source_type = source_type
                
                chunks.extend(file_chunks)
                logger.debug(f"Processed {file_path}: {len(file_chunks)} chunks")
                
            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}")
        
        return chunks
    
    async def generate_recommendations(
        self,
        user_input: UserInput,
        rag_manifest: Optional[RAGManifest] = None,
        feedback_state: Optional[FeedbackState] = None
    ) -> RecommendationResponse:
        """Generate OT recommendations using RAG"""
        
        if not self.initialized:
            raise ValueError("RAG system not initialized")
        
        logger.info("Generating recommendations...")
        
        try:
            # Build queries from user input
            queries = self._build_queries(user_input)
            
            # Retrieve relevant chunks
            retrieved_chunks = await self._retrieve_chunks(queries, rag_manifest)
            
            # Rerank results
            reranked_chunks = self._rerank_chunks(queries, retrieved_chunks)
            
            # Generate recommendations
            recommendations = self._generate_recommendations_from_chunks(
                reranked_chunks, user_input, feedback_state
            )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            raise
    
    def _build_queries(self, user_input: UserInput) -> List[str]:
        """Build search queries from user input"""
        queries = []
        
        # Main query combining condition and outcome
        main_query = f"{user_input.patient_condition} {user_input.desired_outcome}"
        queries.append(main_query)
        
        # Specific queries for different aspects
        if user_input.diagnosis:
            queries.append(f"{user_input.diagnosis} treatment exercises")
        
        if user_input.severity:
            queries.append(f"{user_input.severity} {user_input.diagnosis} interventions")
        
        if user_input.treatment_progression:
            queries.append(f"treatment progression {user_input.treatment_progression}")
        
        # Add specific exercise queries
        queries.extend([
            "CPT billing codes documentation",
            "therapeutic exercises interventions",
            "functional training activities"
        ])
        
        return queries
    
    async def _retrieve_chunks(
        self,
        queries: List[str],
        rag_manifest: Optional[RAGManifest]
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks for queries"""
        
        all_results = []
        
        for query in queries:
            # Get source boosts from manifest
            source_boosts = None
            header_boosts = None
            topic_boosts = None
            
            if rag_manifest:
                source_boosts = rag_manifest.source_boosts
                header_boosts = rag_manifest.header_boosts
                topic_boosts = rag_manifest.topic_boosts
            
            # Retrieve chunks
            results = self.retriever.search(
                query=query,
                top_k=settings.TOP_K_RETRIEVAL,
                source_boosts=source_boosts,
                header_boosts=header_boosts,
                topic_boosts=topic_boosts
            )
            
            all_results.extend(results)
        
        # Remove duplicates and combine scores
        unique_results = self._deduplicate_results(all_results)
        
        return unique_results
    
    def _deduplicate_results(self, results: List[Any]) -> List[Dict[str, Any]]:
        """Remove duplicate results and combine scores"""
        seen_chunks = {}
        
        for result in results:
            chunk_id = result.chunk.chunk_id
            
            if chunk_id in seen_chunks:
                # Combine scores
                existing = seen_chunks[chunk_id]
                existing["combined_score"] = max(
                    existing["combined_score"],
                    result.combined_score
                )
            else:
                seen_chunks[chunk_id] = {
                    "chunk": result.chunk,
                    "combined_score": result.combined_score,
                    "query": result.query
                }
        
        # Sort by combined score
        unique_results = sorted(
            seen_chunks.values(),
            key=lambda x: x["combined_score"],
            reverse=True
        )
        
        return unique_results
    
    def _rerank_chunks(
        self,
        queries: List[str],
        retrieved_chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Rerank retrieved chunks using cross-encoder"""
        
        # Convert to RetrievalResult objects
        results = []
        for chunk_data in retrieved_chunks:
            from .retriever import RetrievalResult
            result = RetrievalResult(
                chunk=chunk_data["chunk"],
                bm25_score=0.0,  # Not used in reranking
                dense_score=0.0,  # Not used in reranking
                combined_score=chunk_data["combined_score"],
                query=chunk_data["query"]
            )
            results.append(result)
        
        # Rerank using the main query
        main_query = queries[0] if queries else ""
        reranked_results = self.reranker.rerank(
            query=main_query,
            results=results,
            top_n=settings.TOP_N_RERANK
        )
        
        # Convert back to dictionary format
        reranked_chunks = []
        for result in reranked_results:
            reranked_chunks.append({
                "chunk": result.chunk,
                "combined_score": result.combined_score,
                "rerank_score": getattr(result, 'rerank_score', result.combined_score)
            })
        
        return reranked_chunks
    
    def _generate_recommendations_from_chunks(
        self,
        chunks: List[Dict[str, Any]],
        user_input: UserInput,
        feedback_state: Optional[FeedbackState]
    ) -> RecommendationResponse:
        """Generate structured recommendations from chunks"""
        
        # Organize chunks by source type and content
        note_ninjas_chunks = [c for c in chunks if c["chunk"].source_type == "note_ninjas"]
        cpg_chunks = [c for c in chunks if c["chunk"].source_type == "cpg"]
        
        # Generate high-level recommendations
        high_level = self._extract_high_level_recommendations(chunks, user_input)
        
        # Generate subsections with exercises
        subsections = self._extract_subsections(note_ninjas_chunks, user_input)
        
        # Generate alternatives from CPG chunks
        alternatives = self._extract_alternatives(cpg_chunks, user_input)
        
        # Determine confidence level
        confidence = self._determine_confidence(chunks, note_ninjas_chunks)
        
        # Create response
        response = RecommendationResponse(
            high_level=high_level,
            subsections=subsections,
            suggested_alternatives=alternatives,
            confidence=confidence
        )
        
        # Apply feedback filtering if available
        if feedback_state:
            response = self._apply_feedback_filtering(response, feedback_state)
        
        return response
    
    def _extract_high_level_recommendations(
        self,
        chunks: List[Dict[str, Any]],
        user_input: UserInput
    ) -> List[str]:
        """Extract high-level recommendations"""
        
        recommendations = []
        
        # Look for general treatment principles
        for chunk_data in chunks[:5]:  # Top 5 chunks
            chunk = chunk_data["chunk"]
            content = chunk.content
            
            # Extract treatment principles
            if "prioritize" in content.lower() or "focus on" in content.lower():
                # Extract relevant sentences
                sentences = content.split('.')
                for sentence in sentences:
                    if len(sentence.strip()) > 20 and len(sentence.strip()) < 200:
                        if any(word in sentence.lower() for word in ["prioritize", "focus", "emphasize"]):
                            recommendations.append(sentence.strip())
                            break
        
        # If no specific recommendations found, create generic ones
        if not recommendations:
            if user_input.diagnosis:
                recommendations.append(f"Focus on evidence-based interventions for {user_input.diagnosis}")
            if user_input.desired_outcome:
                recommendations.append(f"Target specific outcomes: {user_input.desired_outcome}")
        
        return recommendations[:3]  # Limit to 3 recommendations
    
    def _extract_subsections(
        self,
        chunks: List[Dict[str, Any]],
        user_input: UserInput
    ) -> List[Subsection]:
        """Extract subsections with exercises"""
        
        subsections = []
        
        # Group chunks by headers/topics
        topic_groups = self._group_chunks_by_topic(chunks)
        
        for topic, topic_chunks in topic_groups.items():
            if len(topic_chunks) < 2:  # Need at least 2 chunks for a subsection
                continue
            
            # Extract exercises from chunks
            exercises = self._extract_exercises_from_chunks(topic_chunks, user_input)
            
            if exercises:
                subsection = Subsection(
                    title=topic,
                    rationale=self._generate_rationale(topic_chunks, user_input),
                    exercises=exercises
                )
                subsections.append(subsection)
        
        return subsections[:4]  # Limit to 4 subsections
    
    def _group_chunks_by_topic(self, chunks: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group chunks by topic/header"""
        
        topic_groups = {}
        
        for chunk_data in chunks:
            chunk = chunk_data["chunk"]
            
            # Use headers to determine topic
            topic = "General Exercises"
            if chunk.headers:
                # Use the first meaningful header
                for header in chunk.headers:
                    if len(header) > 5 and len(header) < 50:
                        topic = header
                        break
            
            # Also check content for topic indicators
            content_lower = chunk.content.lower()
            if "transfer" in content_lower or "sit to stand" in content_lower:
                topic = "Transfer Training"
            elif "balance" in content_lower:
                topic = "Balance Training"
            elif "strength" in content_lower or "resistance" in content_lower:
                topic = "Strength Training"
            elif "endurance" in content_lower or "cardiovascular" in content_lower:
                topic = "Endurance Training"
            elif "cognitive" in content_lower or "memory" in content_lower:
                topic = "Cognitive Training"
            
            if topic not in topic_groups:
                topic_groups[topic] = []
            topic_groups[topic].append(chunk_data)
        
        return topic_groups
    
    def _extract_exercises_from_chunks(
        self,
        chunks: List[Dict[str, Any]],
        user_input: UserInput
    ) -> List[Exercise]:
        """Extract exercises from chunks"""
        
        exercises = []
        
        for chunk_data in chunks[:3]:  # Limit to 3 exercises per subsection
            chunk = chunk_data["chunk"]
            
            # Extract exercise information
            exercise = self._parse_exercise_from_chunk(chunk, user_input)
            if exercise:
                exercises.append(exercise)
        
        return exercises
    
    def _parse_exercise_from_chunk(
        self,
        chunk: DocumentChunk,
        user_input: UserInput
    ) -> Optional[Exercise]:
        """Parse exercise from a single chunk"""
        
        content = chunk.content
        
        # Extract title (use first sentence or header)
        title = chunk.title
        if chunk.headers:
            title = chunk.headers[0]
        
        # Extract description (first few sentences)
        sentences = content.split('.')
        description = '. '.join(sentences[:3]) + '.'
        
        # Extract cues (look for bullet points or numbered lists)
        cues = self._extract_cues(content)
        
        # Generate documentation
        documentation = self._generate_documentation(content, user_input)
        
        # Extract CPT code
        cpt = self._extract_cpt_code(content)
        
        # Create sources
        sources = [Source(
            type=SourceType.NOTE_NINJAS if chunk.source_type == "note_ninjas" else SourceType.CPG,
            id=chunk.source_id,
            section=chunk.headers[0] if chunk.headers else None,
            page=chunk.page_ref,
            quote=content[:300]  # First 300 chars
        )]
        
        exercise = Exercise(
            title=title,
            description=description,
            cues=cues,
            documentation=documentation,
            cpt=cpt,
            notes=None,
            sources=sources
        )
        
        return exercise
    
    def _extract_cues(self, content: str) -> List[str]:
        """Extract cueing instructions from content"""
        cues = []
        
        # Look for bullet points or numbered lists
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if line and (
                line.startswith('•') or 
                line.startswith('-') or 
                line.startswith('*') or
                re.match(r'^\d+\.', line)
            ):
                # Clean up the cue
                cue = re.sub(r'^[•\-*\d+\.]\s*', '', line)
                if len(cue) > 5 and len(cue) < 100:
                    cues.append(cue)
        
        # If no cues found, generate generic ones
        if not cues:
            if "balance" in content.lower():
                cues = ["Maintain stable base of support", "Focus on core activation"]
            elif "strength" in content.lower():
                cues = ["Maintain proper form", "Control the movement"]
            else:
                cues = ["Follow proper technique", "Monitor for safety"]
        
        return cues[:5]  # Limit to 5 cues
    
    def _generate_documentation(self, content: str, user_input: UserInput) -> str:
        """Generate documentation exemplar"""
        
        # Extract key terms
        diagnosis = user_input.diagnosis or "condition"
        
        # Generate documentation based on content
        if "instructed" in content.lower():
            return f"Instructed {diagnosis} management techniques; patient demonstrated understanding and performed exercises with minimal assistance."
        elif "assessed" in content.lower():
            return f"Assessed {diagnosis} functional limitations; patient showed improvement in targeted areas with skilled intervention."
        else:
            return f"Provided skilled intervention for {diagnosis}; patient participated actively and showed positive response to treatment."
    
    def _extract_cpt_code(self, content: str) -> Optional[str]:
        """Extract CPT code from content"""
        
        # Look for CPT codes (5-digit numbers)
        cpt_pattern = r'\b(97\d{3}|96\d{3}|95\d{3})\b'
        matches = re.findall(cpt_pattern, content)
        
        if matches:
            return matches[0]
        
        # Look for common CPT mentions
        if "97530" in content or "therapeutic exercise" in content.lower():
            return "97530"
        elif "97535" in content or "self-care" in content.lower():
            return "97535"
        elif "97110" in content or "therapeutic activity" in content.lower():
            return "97110"
        
        return None
    
    def _generate_rationale(self, chunks: List[Dict[str, Any]], user_input: UserInput) -> str:
        """Generate rationale for subsection"""
        
        # Look for rationale in chunk content
        for chunk_data in chunks:
            content = chunk_data["chunk"].content
            if "rationale" in content.lower() or "evidence" in content.lower():
                sentences = content.split('.')
                for sentence in sentences:
                    if len(sentence.strip()) > 20 and len(sentence.strip()) < 150:
                        if "rationale" in sentence.lower() or "evidence" in sentence.lower():
                            return sentence.strip()
        
        # Generate generic rationale
        diagnosis = user_input.diagnosis or "condition"
        return f"Evidence-based interventions for {diagnosis} management with focus on functional outcomes."
    
    def _extract_alternatives(
        self,
        chunks: List[Dict[str, Any]],
        user_input: UserInput
    ) -> List[Alternative]:
        """Extract alternative recommendations from CPG chunks"""
        
        alternatives = []
        
        for chunk_data in chunks[:3]:  # Limit to 3 alternatives
            chunk = chunk_data["chunk"]
            content = chunk.content
            
            # Look for alternative recommendations
            if "alternative" in content.lower() or "instead" in content.lower():
                # Extract when condition
                when = "When primary intervention is not effective"
                
                # Extract alternative recommendation
                instead_try = content[:200] + "..." if len(content) > 200 else content
                
                alternative = Alternative(
                    when=when,
                    instead_try=instead_try,
                    sources=[Source(
                        type=SourceType.CPG,
                        id=chunk.source_id,
                        section=chunk.headers[0] if chunk.headers else None,
                        page=chunk.page_ref,
                        quote=content[:300]
                    )]
                )
                alternatives.append(alternative)
        
        return alternatives
    
    def _determine_confidence(
        self,
        all_chunks: List[Dict[str, Any]],
        note_ninjas_chunks: List[Dict[str, Any]]
    ) -> ConfidenceLevel:
        """Determine confidence level based on available sources"""
        
        # High confidence: Multiple Note Ninjas sources with good scores
        if len(note_ninjas_chunks) >= 3:
            avg_score = sum(c["combined_score"] for c in note_ninjas_chunks[:3]) / 3
            if avg_score > 0.7:
                return ConfidenceLevel.HIGH
        
        # Medium confidence: Some Note Ninjas sources
        if len(note_ninjas_chunks) >= 1:
            return ConfidenceLevel.MEDIUM
        
        # Low confidence: No Note Ninjas sources
        return ConfidenceLevel.LOW
    
    def _apply_feedback_filtering(
        self,
        response: RecommendationResponse,
        feedback_state: FeedbackState
    ) -> RecommendationResponse:
        """Apply feedback-based filtering to response"""
        
        # Filter out blocked CPTs
        if feedback_state.blocked_cpts:
            for subsection in response.subsections:
                subsection.exercises = [
                    ex for ex in subsection.exercises
                    if ex.cpt not in feedback_state.blocked_cpts
                ]
        
        # Filter out blocked exercises
        if feedback_state.blocked_exercises:
            for subsection in response.subsections:
                subsection.exercises = [
                    ex for ex in subsection.exercises
                    if ex.title not in feedback_state.blocked_exercises
                ]
        
        return response
    
    async def get_sources_info(self) -> Dict[str, Any]:
        """Get information about available sources"""
        return self.retriever.get_sources_info()
