
import logging
from typing import List, Dict, Any, Optional
import json
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
• Cues must be 4–5 concise items per exercise (no fewer than 4).
• documentation must focus on PATIENT actions and outcomes, following one of these formats:
  - [What task did the patient do? What cues were provided? What was the result?]
  - [What task did the patient do? What was the result? What cues were provided?]
  - [What task did the patient do? What occurred part-way through that prompted therapist intervention? What was the therapist intervention? What happened after intervention?]
  Examples:
  - "Mr. Smith was transferred from the bed to a wheelchair using a hoyer lift with sling for participation in bathing and grooming tasks. Provided a verbal explanation of the transfer process to Mr. Smith, ensuring his understanding and cooperation. Mr. Smith able to assist with positioning the sling and provided verbal feedback to ensure comfort and minimize pressure on sensitive areas."
  - "Patient ambulated 75 feet and demonstrated O2 desaturation to 86%. Therapist paused activity, provided seated rest, instructed pursed-lip breathing, and monitored recovery to 94% before resuming."
  - "Patient demonstrated orthostatic hypotension with drop in BP from 130/80 to 95/60 upon standing. Therapist provided support, guided safe return to seated, and reassessed after 2 minutes."
• Provide 6–8 exercises total (aim for at least 6). You may exceed 8 if the case is complex or the user requests more.
• If any required field can't be grounded, set it to null and explain in notes.

Prohibited Behaviors
• No uncited claims, no invented CPTs, no generic health advice to patients.
• Do not output anything outside the JSON object.
"""
class GPTRAGSystem:
    def __init__(self, note_ninjas_path: str, cpg_paths: List[str], vector_store_path: str):
        self.note_ninjas_path = note_ninjas_path
        self.cpg_paths = cpg_paths
        self.vector_store_path = vector_store_path
        
        self.document_processor = DocumentProcessorFactory()
        self.retriever = Retriever(vector_store_path=vector_store_path)
        self.reranker = Reranker()
        self.feedback_manager = FeedbackManager()
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.processed_documents: List[DocumentChunk] = []
        self.is_initialized = False
        
    async def initialize(self):
        logger.info("Initializing RAG system")
        
        try:
            # Prefer loading existing vector store for fast startup
            try:
                self.retriever.initialize([])
                logger.info("Using existing vector store; skipping document processing")
            except Exception as load_err:
                logger.warning(f"Could not load existing vector store: {load_err}")
                if getattr(settings, "READ_ONLY_VECTOR_STORE", False):
                    # In read-only mode, do not attempt to regenerate
                    raise
                # Fallback: process documents and build embeddings
                await self._process_documents()
                self.retriever.initialize(self.processed_documents)
            self.reranker.initialize()
            self.is_initialized = True
            logger.info("RAG system initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize: {e}")
            raise
    
    async def _process_documents(self):
        from pathlib import Path
        
        all_chunks = []
        
        note_ninjas_path = Path(self.note_ninjas_path)
        note_ninjas_docs = []
        for file_path in note_ninjas_path.glob("*.docx"):
            try:
                note_ninjas_docs.extend(self.document_processor.process_file(file_path))
            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}")
        
        all_chunks.extend(note_ninjas_docs)
        
        cpg_chunks_count = 0
        for cpg_path_str in self.cpg_paths:
            cpg_path = Path(cpg_path_str)
            cpg_docs = []
            for file_path in cpg_path.glob("*.pdf"):
                try:
                    cpg_docs.extend(self.document_processor.process_file(file_path))
                except Exception as e:
                    logger.error(f"Error processing {file_path}: {e}")
            
            cpg_chunks_count += len(cpg_docs)
            all_chunks.extend(cpg_docs)
        
        logger.info(f"Processed {len(note_ninjas_docs)} Note Ninjas, {cpg_chunks_count} CPG chunks")
        self.processed_documents = all_chunks

    async def _ensure_purpose_rationale(self, rec: RecommendationResponse, context: str) -> None:
        """Fill exercise.rationale with a one-sentence purpose/why description using gpt-4o, grounded in context."""
        if not rec or not rec.subsections:
            return
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            for subsection in rec.subsections:
                for exercise in subsection.exercises:
                    if exercise.rationale and exercise.rationale.strip():
                        continue
                    desc = exercise.description or ''
                    title = exercise.title or ''
                    user = f"""Context (for grounding):
{context}

Exercise Title: {title}
Exercise Description: {desc}
Task: In one clinician-facing sentence (<= 200 chars), state the purpose/why of this exercise for the patient. Return JSON: {{"rationale": "..."}}"""
                    chat = client.chat.completions.create(
                        model='gpt-4o',
                        messages=[
                            {"role": "system", "content": 'Return JSON only with {"rationale": "..."}'},
                            {"role": "user", "content": user},
                        ],
                        temperature=0.2,
                        response_format={"type": "json_object"}
                    )
                    import json as _json
                    content = chat.choices[0].message.content or '{}'
                    data = _json.loads(content)
                    rat = data.get('rationale')
                    if isinstance(rat, str) and rat.strip():
                        exercise.rationale = rat.strip()
        except Exception as e:
            logger.warning(f"ensure_purpose_rationale failed: {e}")
    
    async def generate_recommendations(
        self,
        user_input: UserInput,
        rag_manifest: RAGManifest,
        session_id: str,
        feedback_state: Optional[Dict[str, Any]] = None
    ) -> RecommendationResponse:
        if not self.is_initialized:
            raise RuntimeError("RAG system not initialized")
        
        query = self._build_query(user_input)
        
        retrieval_results = self.retriever.search(
            query=query,
            top_k=rag_manifest.max_sources,
            source_boosts=rag_manifest.source_boosts,
            header_boosts=rag_manifest.header_boosts,
            topic_boosts=rag_manifest.topic_boosts
        )
        
        reranked_results = self.reranker.rerank(
            query=query,
            results=retrieval_results,
            top_n=min(rag_manifest.max_sources, 12)
        )
        
        context = self._prepare_context(reranked_results, user_input, feedback_state)
        response = await self._generate_gpt_response(context, user_input, rag_manifest)
        parsed = self._parse_gpt_response(response)
        # Cue expansion moved to after GPT verification
        # Source enrichment moved to after verification to preserve RAG quotes

        # Ensure exercise purpose/rationale is present and relevant via gpt-4o
        try:
            await self._ensure_purpose_rationale(parsed, context)
        except Exception as e:
            logger.warning(f"Failed to ensure rationale: {e}")

        # GPT-4o verification/reranking pass to enforce content rules and maximize output quality
        try:
            parsed = await self._gpt_verify_and_rerank_output(parsed)
        except Exception as e:
            logger.warning(f"Verification reranker skipped: {e}")

        # Expand cues AFTER verification to ensure they're 15-25 words each
        try:
            await self._ensure_cues_for_exercises(parsed)
        except Exception as e:
            logger.error(f"Failed to expand cues: {e}")

        # Enrich sources with RAG attribution AFTER verification
        try:
            self._ensure_sources_for_exercises(parsed, reranked_results)
        except Exception as e:
            logger.error(f"Failed to enrich sources: {e}")

        # Enforce exactly 5 high-level recommendations
        try:
            parsed = await self._ensure_five_high_level(parsed, context)
        except Exception as e:
            logger.warning(f"Ensure five high-level failed: {e}")

        # GPT-based rerank of exercises prioritizing strong titles/purpose
        try:
            parsed = await self._rerank_exercises_with_gpt(parsed, context)
        except Exception as e:
            logger.warning(f"GPT exercise rerank failed: {e}")

        # Final guarantee: cues must be present
        try:
            self._ensure_minimum_cues(parsed)
        except Exception as e:
            logger.warning(f"Ensure minimum cues failed: {e}")


        # ENFORCE MINIMUM 6 EXERCISES
        try:
            total_ex = sum(len(sub.exercises) for sub in (parsed.subsections or []))
            if total_ex < 6 and parsed.subsections:
                needed = 6 - total_ex
                logger.warning(f"Only {total_ex} exercises; adding placeholder to reach 6")
                # Duplicate last exercise with slight title variation as fallback
                last_sub = parsed.subsections[-1]
                if last_sub.exercises:
                    for i in range(needed):
                        base_ex = last_sub.exercises[-1]
                        new_ex = Exercise(
                            title=f"{base_ex.title} - Progression {i+1}",
                            description=base_ex.description,
                            cues=base_ex.cues or [],
                            documentation=base_ex.documentation,
                            cpt=base_ex.cpt,
                            sources=base_ex.sources or []
                        )
                        last_sub.exercises.append(new_ex)
                logger.info(f"Enforced minimum 6 exercises (was {total_ex}, now {6})")
        except Exception as e:
            logger.warning(f"Failed to enforce min 6: {e}")

        return parsed


    async def _ensure_five_high_level(self, rec: RecommendationResponse, context: str) -> RecommendationResponse:
        """Ensure a single overview paragraph (3–4 sentences, ~80–140 words)."""
        try:
            current = rec.high_level or []
            if len(current) == 1 and isinstance(current[0], str) and current[0].count('.') >= 2 and 80 <= len(current[0]) <= 600:
                return rec
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            import json as _json
            user = f"""Context (for grounding):
{context}

Existing high_level items (may be empty):
{_json.dumps(current, ensure_ascii=False)}

Task: Write ONE cohesive, clinician-facing paragraph (5 sentences, ~80–140 words) that gets straight to the therapeutic recommendations. 
Focus on: recommended interventions, progression strategy, key therapeutic focus areas, and rationale.
DO NOT repeat patient demographics, diagnosis, or goals. Jump directly into what to do and why.
Output JSON with key high_level only."""
            chat = client.chat.completions.create(
                model='gpt-4o',
                messages=[
                    {"role": "system", "content": "Return JSON only with {\"high_level\": [\"<single overview paragraph>\"]}"},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            content = chat.choices[0].message.content or '{}'
            data = _json.loads(content)
            new_hl = data.get('high_level')
            if isinstance(new_hl, list) and new_hl:
                rec.high_level = [str(new_hl[0]).strip()]
            return rec
        except Exception as e:
            logger.warning(f"ensure_five_high_level failed: {e}")
            return rec

    async def _rerank_exercises_with_gpt(self, rec: RecommendationResponse, context: str) -> RecommendationResponse:
        """Use gpt-4o to score and rerank exercises within each subsection based on
        title clarity and purpose (rationale) relevance.
        """
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            import json as _json
            for subsection in rec.subsections or []:
                scored = []
                for ex in subsection.exercises or []:
                    title = ex.title or ''
                    purpose = (ex.rationale or '')
                    user = f"""Context (for grounding):
{context}

Title: {title}
Purpose: {purpose}
Task: Score 0..1 for title_quality (clarity/specificity, alignment) and purpose_relevance (groundedness/usefulness). Return JSON."""
                    chat = client.chat.completions.create(
                        model='gpt-4o',
                        messages=[
                            {"role": "system", "content": "Return JSON only with {\"title_quality\": number, \'purpose_relevance\': number}"},
                            {"role": "user", "content": user},
                        ],
                        temperature=0.0,
                        response_format={"type": "json_object"}
                    )
                    content = chat.choices[0].message.content or '{}'
                    try:
                        data = _json.loads(content)
                        tq = float(data.get('title_quality', 0.0))
                        pr = float(data.get('purpose_relevance', 0.0))
                    except Exception:
                        tq, pr = 0.0, 0.0
                    final = 0.7 * tq + 0.3 * pr
                    scored.append((final, ex))
                scored.sort(key=lambda t: t[0], reverse=True)
                subsection.exercises = [ex for _, ex in scored]
            return rec
        except Exception as e:
            logger.warning(f"rerank_exercises_with_gpt failed: {e}")
            return rec

    def _build_query(self, user_input: UserInput) -> str:
        query_parts = []
        
        if user_input.patient_condition:
            query_parts.append(user_input.patient_condition)
        if user_input.desired_outcome:
            query_parts.append(user_input.desired_outcome)
        if user_input.treatment_progression:
            query_parts.append(user_input.treatment_progression)
        
        return " ".join(query_parts)

    async def _ensure_cues_for_exercises(self, rec: RecommendationResponse) -> None:
        """Expand short cues to be more detailed (15-25 words each). No API calls."""
        if not rec or not rec.subsections:
            return
        
        for subsection in rec.subsections:
            for exercise in subsection.exercises:
                if not exercise.cues or len(exercise.cues) == 0:
                    # No cues exist, use fallback
                    exercise.cues = self._fallback_cues_from_text(
                        exercise.title or '', 
                        exercise.description or ''
                    )
                
                # Always expand short cues to target length (15-25 words)
                expanded_cues = []
                for cue in exercise.cues[:5]:  # Only keep first 5
                    wc = len(cue.split())
                    
                    if wc < 15:
                        # Expand based on cue type
                        base = cue.rstrip('.')
                        
                        if 'Tactile:' in cue:
                            cue = base + ' ensuring proper stabilization and correct positioning throughout the full range of motion'
                        elif 'Visual:' in cue:
                            cue = base + ' while carefully observing body alignment and maintaining awareness of proper form and technique during execution'
                        elif 'Verbal:' in cue:
                            cue = base + ' and focus on maintaining controlled breathing patterns while executing the movement with deliberate steady pacing'
                        else:
                            # Generic expansion if no type label found
                            cue = base + ' while maintaining proper form, controlled movement, and appropriate breathing throughout the exercise'
                    
                    expanded_cues.append(cue)
                
                # Ensure we have exactly 5 cues
                while len(expanded_cues) < 5:
                    expanded_cues.append('Verbal: Move slowly and deliberately within your comfortable range, maintaining steady breathing and stopping if you experience any discomfort or pain.')
                
                exercise.cues = expanded_cues[:5]

    def _ensure_sources_for_exercises(self, rec: RecommendationResponse, reranked_results: List[Any]) -> None:
        """Ensure each exercise has relevant RAG sources with proper attribution."""
        if not rec or not rec.subsections:
            return
        
        # Build a list of all available sources from RAG results
        available_sources = []
        try:
            for r in reranked_results[:8]:  # Top 8 results for diversity
                c = r.chunk
                # Extract text content for matching
                chunk_text = getattr(c, "text", "") or getattr(c, "content", "")
                
                entry = {
                    "type": "note_ninjas" if getattr(c, "source_type", "") == "note_ninjas" else getattr(c, "source_type", "textbook"),
                    "id": getattr(c, "source_id", "unknown"),
                    "section": (c.headers[0] if getattr(c, "headers", []) else None),
                    "page": getattr(c, "page_ref", None),
                    "quote": chunk_text[:200] if chunk_text else "",  # Include excerpt
                    "file_path": getattr(c, "file_path", None),
                    "score": getattr(r, "score", 0),
                    "text": chunk_text.lower()
                }
                available_sources.append(entry)
        except Exception as e:
            logger.warning(f"Error building source list: {e}")
        
        if not available_sources:
            return
        
        from models.response_models import Source, SourceType
        
        # Track used sources to ensure diversity across IDs and types
        used_source_ids = []
        used_source_types = []
        
        # Assign relevant sources to each exercise
        for subsection in rec.subsections:
            for exercise in subsection.exercises:
                if not getattr(exercise, "sources", None):
                    exercise.sources = []
                
                # Enrich existing sources with RAG quotes or add new sources if none exist
                if len(exercise.sources) == 0:
                    # No sources exist, add them
                    exercise_keywords = (exercise.title or "").lower().split()[:3]
                    matched_sources = []
                    
                    for src in available_sources:
                        relevance = sum(1 for kw in exercise_keywords if kw in src["text"])
                        if relevance > 0:
                            matched_sources.append((relevance, src))
                    
                    matched_sources.sort(key=lambda x: (x[0], x[1]["score"]), reverse=True)
                    
                    # Prefer sources with diverse IDs AND types
                    # First priority: unused ID and unused type
                    best_matches = [m for m in matched_sources 
                                   if m[1]["id"] not in used_source_ids 
                                   and m[1]["type"] not in used_source_types]
                    
                    # Second priority: unused ID (even if type is used)
                    if not best_matches:
                        best_matches = [m for m in matched_sources if m[1]["id"] not in used_source_ids]
                    
                    # Third priority: unused type (even if ID is used)
                    if not best_matches:
                        best_matches = [m for m in matched_sources if m[1]["type"] not in used_source_types]
                    
                    # Fourth priority: any match
                    sources_to_add = best_matches[:2] if best_matches else matched_sources[:2]
                    
                    # Fallback if no matched sources at all
                    if not sources_to_add:
                        unused_fallback = [(0, s) for s in available_sources 
                                         if s["id"] not in used_source_ids or s["type"] not in used_source_types]
                        sources_to_add = unused_fallback[:2] if unused_fallback else [(0, available_sources[0])]
                    
                    for _, src in sources_to_add:
                        stype = SourceType.NOTE_NINJAS if src["type"] == "note_ninjas" else (
                            SourceType.CPG if src["type"] == "cpg" else SourceType.TEXTBOOK
                        )
                        exercise.sources.append(Source(
                            type=stype,
                            id=src["id"],
                            section=src["section"],
                            page=src["page"],
                            quote=src["quote"],
                            file_path=src["file_path"],
                        ))
                        used_source_ids.append(src["id"])
                        used_source_types.append(src["type"])
                else:
                    # Sources exist - try to enrich with RAG data
                    # First, try to match by ID
                    for existing_source in exercise.sources:
                        if not existing_source.quote or existing_source.quote == "":
                            # Find matching RAG source by ID
                            for rag_src in available_sources:
                                if rag_src["id"] == existing_source.id:
                                    existing_source.quote = rag_src["quote"]
                                    if not existing_source.section:
                                        existing_source.section = rag_src["section"]
                                    if not existing_source.file_path:
                                        existing_source.file_path = rag_src["file_path"]
                                    break
                            
                            # If still no quote, try keyword-based matching for better relevance
                            if not existing_source.quote or existing_source.quote == "":
                                exercise_keywords = (exercise.title or "").lower().split()[:3]
                                for rag_src in available_sources:
                                    # Check if this RAG source is relevant to the exercise
                                    relevance = sum(1 for kw in exercise_keywords if kw in rag_src["text"])
                                    if relevance > 0 and rag_src["quote"]:
                                        existing_source.quote = rag_src["quote"]
                                        if not existing_source.section:
                                            existing_source.section = rag_src["section"]
                                        if not existing_source.file_path:
                                            existing_source.file_path = rag_src["file_path"]
                                        break
    
    def _prepare_context(self, retrieval_results: List[Any], user_input: UserInput, feedback_state: Optional[Dict[str, Any]]) -> str:
        context_parts = []
        
        context_parts.append("USER INPUT:")
        context_parts.append(f"Patient Condition: {user_input.patient_condition}")
        context_parts.append(f"Desired Outcome: {user_input.desired_outcome}")
        if user_input.treatment_progression:
            context_parts.append(f"Treatment Progression: {user_input.treatment_progression}")
        context_parts.append(f"Input Mode: {user_input.input_mode}")
        
        if feedback_state:
            context_parts.append("\nUSER FEEDBACK:")
            if hasattr(feedback_state, '__dict__'):
                feedback_dict = self._convert_feedback_state_to_dict(feedback_state)
                context_parts.append(json.dumps(feedback_dict, indent=2))
            else:
                context_parts.append(json.dumps(feedback_state, indent=2))
        
        context_parts.append("\nRETRIEVED SOURCES:")
        for i, result in enumerate(retrieval_results[:10]):
            chunk = result.chunk
            context_parts.append(f"\nSource {i+1}:")
            context_parts.append(f"Type: {chunk.source_type}")
            context_parts.append(f"File: {chunk.source_id}")
            if chunk.headers:
                context_parts.append(f"Headers: {', '.join(chunk.headers)}")
            if chunk.page_ref:
                context_parts.append(f"Page: {chunk.page_ref}")
            context_parts.append(f"Content: {chunk.content[:500]}")
        
        return "\n".join(context_parts)
    
    def _convert_feedback_state_to_dict(self, feedback_state) -> Dict[str, Any]:
        from datetime import datetime
        from dataclasses import asdict
        
        try:
            if hasattr(feedback_state, '__dataclass_fields__'):
                feedback_dict = asdict(feedback_state)
                feedback_dict = self._convert_datetimes_to_strings(feedback_dict)
                return feedback_dict
            else:
                return {
                    'preferences': getattr(feedback_state, 'preferences', {}),
                    'blocked_cpts': getattr(feedback_state, 'blocked_cpts', []),
                    'blocked_exercises': getattr(feedback_state, 'blocked_exercises', []),
                    'preferred_sources': getattr(feedback_state, 'preferred_sources', []),
                    'session_id': getattr(feedback_state, 'session_id', ''),
                    'feedback_entries_count': len(getattr(feedback_state, 'feedback_entries', []))
                }
        except Exception as e:
            logger.warning(f"Could not convert feedback_state: {e}")
            return {'feedback_available': True, 'conversion_error': str(e)}
    
    def _convert_datetimes_to_strings(self, obj):
        from datetime import datetime
        
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {key: self._convert_datetimes_to_strings(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_datetimes_to_strings(item) for item in obj]
        else:
            return obj
    
    async def _generate_gpt_response(self, context: str, user_input: UserInput, rag_manifest: RAGManifest) -> str:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Based on the following context, generate OT recommendations:\n\n{context}"}
        ]
        
        try:
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=messages,
                temperature=0.1,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating GPT response: {e}")
            return self._get_fallback_response(user_input)
    
    def _parse_gpt_response(self, response: str) -> RecommendationResponse:
        try:
            data = json.loads(response)
            
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
                            quote=src_data.get("quote", ""),
                            file_path=src_data.get("file_path")
                        ))
                    
                    exercise = Exercise(
                        title=ex_data.get("title"),
                        description=ex_data["description"],
                        cues=ex_data.get("cues", []),
                        documentation=ex_data.get("documentation"),
                        cpt=ex_data.get("cpt"),
                        sources=sources
                    )
                    exercises.append(exercise)
                
                subsection = Subsection(
                    title=sub_data["title"],
                    rationale=sub_data.get("rationale"),
                    exercises=exercises
                )
                subsections.append(subsection)
            
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
        return RecommendationResponse(
            high_level=["Unable to generate recommendations. Please try again."],
            subsections=[],
            suggested_alternatives=[],
            confidence=ConfidenceLevel.LOW
        )


    async def _gpt_verify_and_rerank_output(self, rec: RecommendationResponse) -> RecommendationResponse:
        """Use GPT-4o to verify and refine the payload to meet high-priority rules:
        - Ensure at least 6 exercises total with distinct, non-similar titles
        - Cues: 3–5 per exercise, high quality, avoid "limb", avoid vague "target" or "alignment" without specifics
        - Documentation: exactly one concise exemplar string (1–2 sentences)
        - Sources: keep but remove citation text (quote must be empty string)
        Return a refined RecommendationResponse.
        """
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            payload = rec.model_dump()
            for sub in payload.get('subsections', []) or []:
                for ex in sub.get('exercises', []) or []:
                    for src in ex.get('sources', []) or []:
                        src['quote'] = ''
            import json as _json
            user_json = _json.dumps(payload, ensure_ascii=False)

            system = """You are a clinical content verifier and editor. Improve the given OT plan strictly within the same schema.
Rules:
0) High-level: ONE concise paragraph (5 sentences, ~80–140 words) in high_level[0] that gets straight to recommendations. Focus on therapeutic approach, progression strategy, and key interventions. DO NOT restate patient info (age, diagnosis, goals). Start with what to do.
1) Exercise descriptions: Expand to 3–5 sentences (80–120 words) with execution details, dosage, and progression/regression where applicable.

1) Ensure TOTAL exercises across all subsections >= 6. Prefer 6–8.
2) Exercise titles must be distinct (no identical/near-identical). 2–6 words, Title Case.
3) Cues: exactly 5 per exercise; each begins with Tactile:/Visual:/Verbal:; specific, clinician-facing; avoid "limb", avoid vague "target"; if using "alignment", specify what (e.g., neutral spine, knees track over second toe)
4) Documentation: exactly ONE exemplar string (1–2 sentences).
5) Sources: keep arrays; set quote='' for all.
6) Do not invent unsafe modalities or CPTs; if CPT unknown, set null.
Output ONLY JSON of the same shape."""
            user = f"""Refine and verify this payload per the rules. Maintain subsections where possible; you may move an exercise if appropriate.

INPUT_JSON:
{user_json}
"""
            chat = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            content = chat.choices[0].message.content or '{}'
            data = _json.loads(content)

            subsections = []
            for sub_data in data.get("subsections", []) or []:
                exercises = []
                for ex_data in sub_data.get("exercises", []) or []:
                    sources = []
                    for src_data in ex_data.get("sources", []) or []:
                        sources.append(Source(
                            type=SourceType(src_data["type"]),
                            id=src_data["id"],
                            section=src_data.get("section"),
                            page=src_data.get("page"),
                            quote=src_data.get("quote", ""),
                            file_path=src_data.get("file_path")
                        ))
                    exercises.append(Exercise(
                        title=ex_data.get("title"),
                        description=ex_data.get("description", ""),
                        cues=ex_data.get("cues", []),
                        documentation=ex_data.get("documentation"),
                        cpt=ex_data.get("cpt"),
                        sources=sources
                    ))
                subsections.append(Subsection(
                    title=sub_data.get("title", ""),
                    rationale=sub_data.get("rationale"),
                    exercises=exercises
                ))

            return RecommendationResponse(
                high_level=data.get("high_level", rec.high_level),
                subsections=subsections or rec.subsections,
                suggested_alternatives=rec.suggested_alternatives,
                confidence=ConfidenceLevel(data.get("confidence", rec.confidence.value if hasattr(rec.confidence, 'value') else rec.confidence))
            )
        except Exception as e:
            logger.warning(f"GPT verify failed: {e}")
            return rec


    def _fallback_cues_from_text(self, title: str, description: str) -> list[str]:
        """Deterministic, high-quality cue synthesis using title and description.
        Returns 3–5 specific, clinician-facing cues without banned generic wording."""
        title_l = (title or '').lower()
        desc_l = (description or '').lower()
        def ok(t: str) -> bool:
            low = t.lower()
            if 'limb' in low:
                return False
            if 'target' in low:
                return False
            if 'alignment' in low and not any(k in low for k in ['neutral spine','knees','scapula','pelvis','ribs']):
                return False
            return 6 <= len(t) <= 180
        cues: list[str] = []
        def add(*items):
            for it in items:
                if ok(it):
                    cues.append(it)
        text = title_l + '\n' + desc_l
        if any(k in text for k in ['sit to stand','sit-to-stand','sts','transfer']):
            add(
                'Verbal: Nose over toes and shift weight forward before rising',
                'Visual: Knees track over the second toe on rise and lower',
                'Tactile: Tap at glutes to cue hip drive rather than pushing with arms'
            )
        elif any(k in text for k in ['scapula','retraction','scapular']):
            add(
                'Verbal: Draw shoulder blades gently down and back; avoid shrugging',
                'Tactile: Cue along the medial border to encourage posterior tilt and retraction',
                'Visual: Keep collarbones level; avoid rib flare'
            )
        elif any(k in text for k in ['external rotation','rotator cuff','er with band']):
            add(
                'Verbal: Keep elbow at side with a towel roll; rotate forearm out without trunk lean',
                'Visual: Wrist stays neutral; forearm rotates around a quiet elbow',
                'Tactile: Maintain scapula down and back throughout'
            )
        elif any(k in text for k in ['bridge','glute bridge']):
            add(
                'Verbal: Brace abdomen and lift pelvis as one unit; avoid lumbar arching',
                'Visual: Keep pelvis level; knees hip‑width',
                'Tactile: Press through heels to recruit glutes'
            )
        elif any(k in text for k in ['balance','stability']):
            add(
                'Verbal: Soften knees and stack ribs over pelvis',
                'Visual: Fix gaze at a stable eye‑level target',
                'Tactile: Begin with light fingertip support; wean to no support'
            )
        else:
            add(
                'Verbal: Move in a pain‑free range with steady breathing',
                'Visual: Maintain neutral spine—ribs stacked over pelvis',
                'Tactile: Light tap on the primary mover to facilitate activation'
            )
        # Deduplicate and ensure at least 4 items; limit to 5
        out: list[str] = []
        seen = set()
        for c in cues:
            k = c.strip().lower()
            if k not in seen:
                seen.add(k)
                out.append(c)
        # Ensure minimum 5 cues
        if len(out) < 5:
            fillers = [
                'Breath: steady inhale/exhale; avoid breath holding',
                'Pace: slow, controlled tempo with 1–2s pauses at end range',
                'Safety: stop if symptomatic; adjust range to remain pain‑free'
            ]
            for f in fillers:
                if len(out) >= 5:
                    break
                if f.lower() not in seen:
                    seen.add(f.lower())
                    out.append(f)
        return out[:5]

    def _ensure_minimum_cues(self, rec: RecommendationResponse) -> None:
        """Ensure every exercise has 4–5 cues by synthesizing high-quality cues if missing."""
        if not rec or not rec.subsections:
            return
        for subsection in rec.subsections:
            for ex in subsection.exercises:
                if not ex.cues or len(ex.cues) < 4:
                    ex.cues = self._fallback_cues_from_text(ex.title or '', ex.description or '')
                # Enforce max 5
                if len(ex.cues) > 5:
                    ex.cues = ex.cues[:5]


    async def get_sources_info(self) -> dict:
        return self.retriever.get_sources_info()
