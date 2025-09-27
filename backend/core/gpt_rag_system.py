"""
GPT-powered RAG system following the comprehensive Note Ninjas system prompt
"""

import logging
from typing import List, Dict, Any, Optional
import json
import asyncio
from openai import OpenAI

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

# System prompt from the requirements
SYSTEM_PROMPT = """
Role & Purpose

You are an OT recommendation engine that must ground every recommendation in retrieved sources using Retrieval-Augmented Generation (RAG). You produce a structured plan (high-level recommendations → subsections → exercises). Each exercise must include: description, cues, documentation exemplar, CPT code, sources. When you are unsure or evidence is insufficient, say so explicitly and leave fields null as specified. Never fabricate facts, CPT codes, or citations.

Hard Requirements
1. RAG-Only: Do not invent knowledge. Use only content retrieved from the connected corpora.
2. Source Priority (apply at retrieval and synthesis time):
   1. Note Ninjas (in NoteNinjas Folder) (primary, includes Documentation Banks, CPT/Billing, OTPF/terminology, internal notes)
   2. Clinical Practice Guidelines (in Titled_CPGs and Untitled_CPGs) (CPGs) (secondary; evidence, contraindications, levels/classes of recommendation)
   3. Textbooks/Other (tertiary; background, definitions)
3. Citations: Every exercise must include at least one Note Ninjas citation; include CPG citations when relevant. Cite with a sources array (see schema).
4. No Hallucinated CPTs: Only return CPT codes that appear in the retrieved Note Ninjas/CPT sources. If absent, return "cpt": null and add an explanatory note in "notes".
5. Framework Awareness: Apply OTPF-4/OT reasoning when organizing content. Use it as a framework, not as a rigid rule; cite framework sources when used.
6. Feedback-Aware: Accept user feedback (thumbs up/down, corrections, preferences) and reflect it in the next answer within the same session. If the feedback conflicts with sources, respect the feedback for formatting/preferences but do not violate clinical evidence or make unsafe claims.
7. Clinical Guardrails: Provide clinician-facing decision support, not medical advice for laypersons. Flag safety issues and contraindications when surfaced by CPGs.
8. Honesty Under Uncertainty: If retrieval is weak or conflicting, return "confidence": "low" and explain conflict succinctly in "notes".

Return only this JSON (no prose outside the JSON):

{
  "high_level": [
    "string (concise, clinician-facing, action-oriented)"
  ],
  "subsections": [
    {
      "title": "string",
      "rationale": "string | null (1-2 sentences linking to goals/evidence)",
      "exercises": [
        {
          "title": "string",
          "description": "string (how to run it, dose/sets/reps/time, progression/regression if available)",
          "cues": ["string", "string"],
          "documentation": "string (1–2 sentence exemplar; skilled interventions + patient response)",
          "cpt": "string | null",
          "notes": "string | null (uncertainty, contraindications, adaptations)",
          "sources": [
            {
              "type": "note_ninjas | cpg | textbook",
              "id": "string (file/slug/id)",
              "section": "string | null (heading/normalized header)",
              "page": "string | null (e.g., 'p. e345' or 'pp. 23-24')",
              "quote": "string (<= 300 chars from the retrieved chunk)"
            }
          ]
        }
      ]
    }
  ],
  "suggested_alternatives": [
    {
      "when": "string (condition/constraint/contraindication)",
      "instead_try": "string",
      "sources": [ { "type": "cpg", "id": "…", "page": "…"} ]
    }
  ],
  "confidence": "high | medium | low"
}

Formatting Rules
• Keep language clinical, concise, and specific.
• Bullets OK in cues; keep to 2–5 concise items.
• documentation uses skilled-terminology (instructed, facilitated, assessed, progressed, response).
• Do not exceed ~8 exercises total unless the user explicitly asks for more.
• If any required field can't be grounded, set it to null and explain in notes.

Prohibited Behaviors
• No uncited claims, no invented CPTs, no generic health advice to patients.
• Do not output anything outside the JSON object.
"""


class GPTRAGSystem:
    """GPT-powered RAG system for OT recommendations"""
    
    def __init__(
        self,
        note_ninjas_path: str,
        cpg_paths: List[str],
        vector_store_path: str
    ):
        self.note_ninjas_path = note_ninjas_path
        self.cpg_paths = cpg_paths
        self.vector_store_path = vector_store_path
        
        # Initialize components
        self.document_processor = DocumentProcessorFactory()
        self.retriever = Retriever(vector_store_path=vector_store_path)
        self.reranker = Reranker()
        self.feedback_manager = FeedbackManager()
        
        # OpenAI client
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Processed documents
        self.processed_documents: List[DocumentChunk] = []
        
        # System initialization status
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize the RAG system with document processing"""
        logger.info("Initializing GPT RAG system...")
        
        try:
            # Process documents
            await self._process_documents()
            
            # Initialize retriever
            self.retriever.initialize(self.processed_documents)
            
            # Initialize reranker
            self.reranker.initialize()
            
            self.is_initialized = True
            logger.info("GPT RAG system initialized successfully!")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {e}")
            raise
    
    async def _process_documents(self):
        """Process all documents in the corpus"""
        logger.info("Processing documents...")
        
        all_chunks = []
        
        # Process Note Ninjas documents
        from pathlib import Path
        note_ninjas_path = Path(self.note_ninjas_path)
        logger.info(f"Processing Note Ninjas documents from {note_ninjas_path}")
        
        note_ninjas_docs = []
        for file_path in note_ninjas_path.glob("*.docx"):
            try:
                note_ninjas_docs.extend(
                    self.document_processor.process_document(file_path, "note_ninjas")
                )
            except Exception as e:
                logger.error(f"Error processing Note Ninjas document {file_path}: {e}")
        
        logger.info(f"Processed {len(note_ninjas_docs)} Note Ninjas chunks")
        all_chunks.extend(note_ninjas_docs)
        
        # Process CPG documents
        cpg_chunks_count = 0
        for cpg_path_str in self.cpg_paths:
            cpg_path = Path(cpg_path_str)
            logger.info(f"Processing CPG documents from {cpg_path}")
            
            cpg_docs = []
            for file_path in cpg_path.glob("*.pdf"):
                try:
                    cpg_docs.extend(
                        self.document_processor.process_document(file_path, "cpg")
                    )
                except Exception as e:
                    logger.error(f"Error processing PDF {file_path}: {e}")
            
            cpg_chunks_count += len(cpg_docs)
            all_chunks.extend(cpg_docs)
        
        logger.info(f"Processed {cpg_chunks_count} CPG chunks")
        logger.info(f"Total processed chunks: {len(all_chunks)}")
        
        self.processed_documents = all_chunks
    
    async def generate_recommendations(
        self,
        user_input: UserInput,
        rag_manifest: RAGManifest,
        session_id: str,
        feedback_state: Optional[Dict[str, Any]] = None
    ) -> RecommendationResponse:
        """Generate recommendations using GPT-4o Mini with RAG"""
        
        if not self.is_initialized:
            raise RuntimeError("RAG system not initialized")
        
        logger.info(f"Generating recommendations for session {session_id}")
        
        # Build query from user input
        query = self._build_query(user_input)
        
        # Retrieve relevant documents
        retrieval_results = self.retriever.retrieve(
            query=query,
            top_k=rag_manifest.max_sources,
            filters=rag_manifest.sources
        )
        
        # Rerank results
        reranked_results = self.reranker.rerank(
            query=query,
            results=retrieval_results,
            top_n=min(rag_manifest.max_sources, 12)
        )
        
        # Prepare context for GPT
        context = self._prepare_context(reranked_results, user_input, feedback_state)
        
        # Generate response using GPT-4o Mini
        response = await self._generate_gpt_response(context, user_input, rag_manifest)
        
        # Parse and validate response
        parsed_response = self._parse_gpt_response(response)
        
        return parsed_response
    
    def _build_query(self, user_input: UserInput) -> str:
        """Build search query from user input"""
        query_parts = []
        
        if user_input.patient_condition:
            query_parts.append(user_input.patient_condition)
        
        if user_input.desired_outcome:
            query_parts.append(user_input.desired_outcome)
        
        if user_input.treatment_progression:
            query_parts.append(user_input.treatment_progression)
        
        return " ".join(query_parts)
    
    def _prepare_context(
        self,
        retrieval_results: List[Any],
        user_input: UserInput,
        feedback_state: Optional[Dict[str, Any]]
    ) -> str:
        """Prepare context from retrieved documents"""
        context_parts = []
        
        # Add user input
        context_parts.append("USER INPUT:")
        context_parts.append(f"Patient Condition: {user_input.patient_condition}")
        context_parts.append(f"Desired Outcome: {user_input.desired_outcome}")
        if user_input.treatment_progression:
            context_parts.append(f"Treatment Progression: {user_input.treatment_progression}")
        context_parts.append(f"Input Mode: {user_input.input_mode}")
        
        # Add feedback state if available
        if feedback_state:
            context_parts.append("\nUSER FEEDBACK:")
            context_parts.append(json.dumps(feedback_state, indent=2))
        
        # Add retrieved documents
        context_parts.append("\nRETRIEVED SOURCES:")
        for i, result in enumerate(retrieval_results[:10]):  # Limit to top 10
            chunk = result.chunk
            context_parts.append(f"\nSource {i+1}:")
            context_parts.append(f"Type: {chunk.source_type}")
            context_parts.append(f"File: {chunk.source_id}")
            if chunk.section:
                context_parts.append(f"Section: {chunk.section}")
            if chunk.page_number:
                context_parts.append(f"Page: {chunk.page_number}")
            context_parts.append(f"Content: {chunk.content[:500]}...")  # Truncate for context
        
        return "\n".join(context_parts)
    
    async def _generate_gpt_response(
        self,
        context: str,
        user_input: UserInput,
        rag_manifest: RAGManifest
    ) -> str:
        """Generate response using GPT-4o Mini"""
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Based on the following context, generate OT recommendations:\n\n{context}"
            }
        ]
        
        try:
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=messages,
                temperature=0.1,  # Low temperature for consistency
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating GPT response: {e}")
            # Return a fallback response
            return self._get_fallback_response(user_input)
    
    def _parse_gpt_response(self, response: str) -> RecommendationResponse:
        """Parse GPT response into structured format"""
        try:
            data = json.loads(response)
            
            # Parse subsections
            subsections = []
            for sub_data in data.get("subsections", []):
                exercises = []
                for ex_data in sub_data.get("exercises", []):
                    sources = []
                    for src_data in ex_data.get("sources", []):
                        sources.append(Source(
                            type=SourceType(src_data["type"]),
                            id=src_data["id"],
                            section=src_data.get("section"),
                            page=src_data.get("page"),
                            quote=src_data["quote"]
                        ))
                    
                    exercise = Exercise(
                        description=ex_data["description"],
                        cues=ex_data.get("cues", []),
                        documentation_exemplar=[ex_data.get("documentation", "")],
                        cpt_code=ex_data.get("cpt"),
                        sources=sources
                    )
                    exercises.append(exercise)
                
                subsection = Subsection(
                    title=sub_data["title"],
                    description=sub_data.get("rationale", ""),
                    exercises=exercises
                )
                subsections.append(subsection)
            
            # Parse alternatives
            alternatives = []
            for alt_data in data.get("suggested_alternatives", []):
                sources = []
                for src_data in alt_data.get("sources", []):
                    sources.append(Source(
                        type=SourceType(src_data["type"]),
                        id=src_data["id"],
                        section=src_data.get("section"),
                        page=src_data.get("page"),
                        quote=src_data.get("quote", "")
                    ))
                
                alternative = Alternative(
                    when=alt_data["when"],
                    instead_try=alt_data["instead_try"],
                    sources=sources
                )
                alternatives.append(alternative)
            
            return RecommendationResponse(
                high_level=data.get("high_level", []),
                subsections=subsections,
                suggested_alternatives=alternatives,
                confidence=ConfidenceLevel(data.get("confidence", "medium"))
            )
            
        except Exception as e:
            logger.error(f"Error parsing GPT response: {e}")
            return self._get_fallback_response()
    
    def _get_fallback_response(self, user_input: Optional[UserInput] = None) -> RecommendationResponse:
        """Get fallback response when GPT fails"""
        return RecommendationResponse(
            high_level=[
                "Unable to generate specific recommendations at this time. Please try again or contact support."
            ],
            subsections=[],
            suggested_alternatives=[],
            confidence=ConfidenceLevel.LOW
        )
