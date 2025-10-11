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
from openai import OpenAI

logger = logging.getLogger(__name__)
class RAGSystem:

    
    def __init__(
        self,
        note_ninjas_path: str,
        cpg_paths: List[str],
        vector_store_path: str
    ):
        self.note_ninjas_path = Path(note_ninjas_path)
        self.cpg_paths = [Path(p) for p in cpg_paths]
        self.vector_store_path = Path(vector_store_path)
        

        self.document_processor = DocumentProcessorFactory()
        self.retriever = Retriever(
            embedding_model=settings.EMBEDDING_MODEL,
            vector_store_path=settings.VECTOR_STORE_PATH
        )
        self.reranker = Reranker(
            model_name=settings.RERANK_MODEL,
            max_length=512
        )
        

        self.processed_documents: List[DocumentChunk] = []
        self.initialized = False
    
    async def initialize(self):

        logger.info("Initializing RAG system")
        
        try:

            # First try to load an existing vector store to avoid re-processing documents
            try:
                self.retriever.initialize([])
                logger.info("Using existing vector store; skipping document processing")
            except Exception as load_err:
                logger.warning(f"Could not load existing vector store: {load_err}")
                if getattr(settings, "READ_ONLY_VECTOR_STORE", False):
                    # In strict read-only mode, do not attempt to regenerate
                    raise
                # Fallback: process documents and generate embeddings
                await self._process_documents()
                self.retriever.initialize(self.processed_documents)

            # Initialize reranker
            self.reranker.initialize()
            
            self.initialized = True
            logger.info("RAG system initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {e}")
            raise
    
    async def _process_documents(self):

        logger.info("Processing documents")
        
        all_chunks = []
        

        if self.note_ninjas_path.exists():
            logger.info(f"Processing Note Ninjas documents from {self.note_ninjas_path}")
            nn_chunks = await self._process_directory(self.note_ninjas_path, "note_ninjas")
            all_chunks.extend(nn_chunks)
            logger.info(f"Processed {len(nn_chunks)} Note Ninjas chunks")
        

        for cpg_path in self.cpg_paths:
            if cpg_path.exists():
                logger.info(f"Processing CPG documents from {cpg_path}")
                cpg_chunks = await self._process_directory(cpg_path, "cpg")
                all_chunks.extend(cpg_chunks)
                logger.info(f"Processed {len(cpg_chunks)} CPG chunks")
        
        self.processed_documents = all_chunks
        logger.info(f"Total processed chunks: {len(all_chunks)}")
    
    async def _process_directory(self, directory: Path, source_type: str) -> List[DocumentChunk]:

        chunks = []
        

        supported_extensions = ['.pdf', '.docx', '.txt']
        files = []
        
        for ext in supported_extensions:
            files.extend(directory.glob(f"**/*{ext}"))
        

        for file_path in files:
            try:
                file_chunks = self.document_processor.process_file(file_path)
                

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

        
        if not self.initialized:
            raise ValueError("RAG system not initialized")
        
        logger.info("Generating recommendations")
        
        try:

            queries = self._build_queries(user_input)
            

            retrieved_chunks = await self._retrieve_chunks(queries, rag_manifest)
            

            reranked_chunks = self._rerank_chunks(queries, retrieved_chunks)
            

            recommendations = self._generate_recommendations_from_chunks(
                reranked_chunks, user_input, feedback_state
            )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            raise
    
    def _build_queries(self, user_input: UserInput) -> List[str]:

        queries = []
        

        main_query = f"{user_input.patient_condition} {user_input.desired_outcome}"
        queries.append(main_query)
        

        if user_input.diagnosis:
            queries.append(f"{user_input.diagnosis} treatment exercises")
        
        if user_input.severity:
            queries.append(f"{user_input.severity} {user_input.diagnosis} interventions")
        
        if user_input.treatment_progression:
            queries.append(f"treatment progression {user_input.treatment_progression}")
        

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

        
        all_results = []
        
        for query in queries:

            source_boosts = None
            header_boosts = None
            topic_boosts = None
            
            if rag_manifest:
                source_boosts = rag_manifest.source_boosts
                header_boosts = rag_manifest.header_boosts
                topic_boosts = rag_manifest.topic_boosts
            

            results = self.retriever.search(
                query=query,
                top_k=settings.TOP_K_RETRIEVAL,
                source_boosts=source_boosts,
                header_boosts=header_boosts,
                topic_boosts=topic_boosts
            )
            
            all_results.extend(results)
        

        unique_results = self._deduplicate_results(all_results)
        
        return unique_results
    
    def _deduplicate_results(self, results: List[Any]) -> List[Dict[str, Any]]:

        seen_chunks = {}
        
        for result in results:
            chunk_id = result.chunk.chunk_id
            
            if chunk_id in seen_chunks:

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
        

        main_query = queries[0] if queries else ""
        reranked_results = self.reranker.rerank(
            query=main_query,
            results=results,
            top_n=settings.TOP_N_RERANK
        )
        

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

        # Separate sources
        note_ninjas_chunks = [c for c in chunks if c["chunk"].source_type == "note_ninjas"]
        cpg_chunks = [c for c in chunks if c["chunk"].source_type == "cpg"]

        # High-level recs
        high_level = self._extract_high_level_recommendations(chunks, user_input)

        # Subsections and exercises
        subsections = self._extract_subsections(note_ninjas_chunks, user_input)

        # Ensure we always have at least 6 exercises total for the UI
        subsections = self._ensure_min_exercises(subsections, chunks, user_input, min_count=6)

        # Alternatives
        alternatives = self._extract_alternatives(cpg_chunks, user_input)

        # Confidence flag
        confidence = self._determine_confidence(chunks, note_ninjas_chunks)

        response = RecommendationResponse(
            high_level=high_level,
            subsections=subsections,
            suggested_alternatives=alternatives,
            confidence=confidence
        )

        # Optionally refine exercise titles/descriptions and enforce exercise nature + uniqueness
        try:
            if getattr(settings, 'OPENAI_API_KEY', None):
                # 1) Refine titles and descriptions
                self._refine_exercise_titles_and_descriptions_with_gpt(response.subsections)
                # 2) Coerce non-exercise items into appropriate exercises using patient context
                self._coerce_exercises_with_gpt(response.subsections, user_input)
            # 3) Ensure unique, distinguishable titles across the set
            self._ensure_unique_exercise_titles(response.subsections)
        except Exception as e:
            logger.warning(f"Refinement/enforcement step skipped: {e}")

        if feedback_state:
            response = self._apply_feedback_filtering(response, feedback_state)

        return response
    
    def _extract_high_level_recommendations(
        self,
        chunks: List[Dict[str, Any]],
        user_input: UserInput
    ) -> List[str]:

        
        recommendations = []
        

        for chunk_data in chunks[:5]:  # Top 5 chunks
            chunk = chunk_data["chunk"]
            content = chunk.content
            

            if "prioritize" in content.lower() or "focus on" in content.lower():

                sentences = content.split('.')
                for sentence in sentences:
                    if len(sentence.strip()) > 20 and len(sentence.strip()) < 200:
                        if any(word in sentence.lower() for word in ["prioritize", "focus", "emphasize"]):
                            recommendations.append(sentence.strip())
                            break
        

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

        
        subsections = []
        

        topic_groups = self._group_chunks_by_topic(chunks)
        
        for topic, topic_chunks in topic_groups.items():
            if len(topic_chunks) < 2:  # Need at least 2 chunks for a subsection
                continue
            

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

        
        topic_groups = {}
        
        for chunk_data in chunks:
            chunk = chunk_data["chunk"]
            

            topic = "General Exercises"
            if chunk.headers:

                for header in chunk.headers:
                    if len(header) > 5 and len(header) < 50:
                        topic = header
                        break
            

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

        
        exercises = []
        
        for chunk_data in chunks[:3]:  # Limit to 3 exercises per subsection
            chunk = chunk_data["chunk"]
            

            exercise = self._parse_exercise_from_chunk(chunk, user_input)
            if exercise:
                exercises.append(exercise)
        
        return exercises
    
    def _parse_exercise_from_chunk(
        self,
        chunk: DocumentChunk,
        user_input: UserInput
    ) -> Optional[Exercise]:

        content = chunk.content.strip()
        if not content or len(content) < 20:
            return None

        # Prefer a header that looks like an exercise name
        title = None
        if chunk.headers:
            for h in chunk.headers:
                h_clean = h.strip().rstrip(':')
                if 3 <= len(h_clean) <= 60 and not any(w in h_clean.lower() for w in ["section", "chapter", "part", "unit", "references", "appendix"]):
                    title = h_clean
                    if self._is_exercise_title(title):
                        break
                    # keep looking for a more exercise-like header
                    title = None
            if not title and chunk.headers:
                # fallback to first non-structural header
                for h in chunk.headers:
                    h2 = h.strip().rstrip(':')
                    if 3 <= len(h2) <= 60 and not any(w in h2.lower() for w in ["section", "chapter", "part", "unit", "references", "appendix"]):
                        title = h2
                        break
        if not title:
            title = chunk.title.strip().replace('_', ' ').replace('-', ' ')

        # If title looks like an assessment/evaluation, try to derive an exercise-like title from content heuristics
        if not self._is_exercise_title(title):
            lowered = content.lower()
            candidates = [
                ("wall slides", ["wall slide", "wall-slide", "wall slide"],),
                ("shoulder external rotation with band", ["external rotation", "er with band", "rotator cuff"],),
                ("scapular retraction with band", ["scapular retraction", "scapula", "retraction"],),
                ("bridge exercise", ["bridge", "glute bridge"],),
                ("sit-to-stand", ["sit to stand", "sts"],),
                ("closed-chain shoulder tap", ["closed-chain", "closed chain", "shoulder tap"],),
            ]
            for label, keys in candidates:
                if any(k in lowered for k in keys):
                    title = label.title()
                    break

        # Build purpose-oriented description
        purpose = self._extract_purpose(content)
        sentences = [s.strip() for s in content.split('.') if s.strip()]
        how = (sentences[0] + '.') if sentences else ''
        description = (f"{purpose} {how}").strip()
        # Trim overly long descriptions
        if len(description) > 400:
            description = description[:397] + '…'

        # Deterministic cue extraction
        cues = self._extract_cues(content, title)

        # Deterministic documentation exemplars
        documentation = self._generate_documentation(content, user_input)

        # CPT code if present
        cpt = self._extract_cpt_code(content)

        # Ground sources
        sources = [Source(
            type=SourceType.NOTE_NINJAS if chunk.source_type == "note_ninjas" else SourceType.CPG,
            id=chunk.source_id,
            section=chunk.headers[0] if chunk.headers else None,
            page=chunk.page_ref,
            quote="",  # First 300 chars
            file_path=chunk.file_path
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
    
    def _extract_cues(self, content: str, ex_title: Optional[str] = None) -> List[str]:
            import re as _re
            def _quality_filter(text: str) -> bool:
                t = (text or '').strip()
                if len(t) < 6 or len(t) > 180:
                    return False
                low = t.lower()
                if 'limb' in low:
                    return False
                if 'good technique' in low and 'cue' in low:
                    return False
                if 'alignment' in low and not any(k in low for k in ['neutral spine', 'knees', 'scapula', 'pelvis', 'ribs']):
                    return False
                if _re.search(r'\btarget\b', low):
                    return False
                return True
    
            def _synthesize_from_context(title: str, content: str) -> list[str]:
                lower = ((title or '').lower() + "\n" + (content or '').lower())
                cues: list[str] = []
                def add(*items):
                    for it in items:
                        if _quality_filter(it):
                            cues.append(it)
                if any(k in lower for k in ['sit to stand', 'sit-to-stand', 'sts', 'transfer']):
                    add(
                        'Verbal: Nose over toes, shift weight forward before rising',
                        'Visual: Knees track over the second toe during rise and lower',
                        'Tactile: Tap at glutes to cue hip drive instead of pushing with arms'
                    )
                elif any(k in lower for k in ['scapula', 'retraction', 'scapular']):
                    add(
                        'Verbal: Draw shoulder blades gently down and back; avoid shrugging',
                        'Tactile: Cue along the medial border to encourage posterior tilt and retraction',
                        'Visual: Keep collarbones level; no rib flare'
                    )
                elif any(k in lower for k in ['external rotation', 'rotator cuff', 'er with band']):
                    add(
                        'Verbal: Keep elbow at side with a towel roll; rotate forearm out without trunk lean',
                        'Visual: Wrist stays neutral; forearm rotates around a quiet elbow',
                        'Tactile: Cue scapula to stay down/back throughout'
                    )
                elif any(k in lower for k in ['bridge', 'glute bridge']):
                    add(
                        'Verbal: Brace abdomen and lift pelvis in one piece; avoid lumbar arching',
                        'Visual: Keep pelvis level and knees hip‑width',
                        'Tactile: Press through heels to recruit glutes'
                    )
                elif any(k in lower for k in ['balance', 'stability']):
                    add(
                        'Verbal: Soften knees and stack ribs over pelvis',
                        'Visual: Fix gaze at an eye‑level target to steady sway',
                        'Tactile: Light fingertip support, then wean to no support'
                    )
                else:
                    add(
                        'Verbal: Move in a pain‑free range with steady breathing',
                        'Visual: Maintain neutral spine—ribs stacked over pelvis',
                        'Tactile: Light tap on the primary mover to facilitate activation'
                    )
                return cues[:5]
    
            cues: List[str] = []
            for raw in content.split("\n"):
                line = (raw or '').strip()
                if not line:
                    continue
                if line.startswith(('•','-','*')) or _re.match(r'^\d+\.', line):
                    cue = _re.sub(r'^[•\-*\d+\.]\s*', '', line).strip()
                    if _quality_filter(cue):
                        cues.append(cue)
                    continue
                m = _re.match(r'^(Verbal|Tactile|Visual)\s*:\s*(.+)$', line, flags=_re.I)
                if m:
                    label = m.group(1).capitalize()
                    body = m.group(2).strip()
                    cand = f"{label}: {body}"
                    if _quality_filter(cand):
                        cues.append(cand)
            if len(cues) < 3:
                cues.extend(_synthesize_from_context(ex_title or '', content))
            out: List[str] = []
            seen = set()
            for c in cues:
                key = c.strip().lower()
                if key not in seen:
                    seen.add(key)
                    out.append(c)
            return out[:5]
    def _generate_documentation(self, content: str, user_input: UserInput) -> str:

        # Return a single, specific clinician-facing exemplar (no duplicates).
        dx = (user_input.diagnosis or "the condition").strip()
        goal = (user_input.desired_outcome or "functional goals").strip()
        hints = content.lower()
        # Heuristic focus based on content keywords for specificity
        if any(k in hints for k in ["sit to stand", "sit-to-stand", "sts", "transfer"]):
            focus = "hip hinge and forward weight shift; knees track over the second toe"
        elif any(k in hints for k in ["scapula", "retraction", "scapular"]):
            focus = "scapular depression and retraction without rib flare"
        elif any(k in hints for k in ["external rotation", "rotator cuff", "er with band"]):
            focus = "elbow at side with towel roll; isolate rotator cuff external rotation"
        elif any(k in hints for k in ["bridge", "glute bridge"]):
            focus = "gluteal activation with neutral lumbopelvic position"
        elif any(k in hints for k in ["balance", "stability"]):
            focus = "mid‑foot balance with soft knees and steady gaze"
        else:
            focus = "task mechanics and safety within a pain‑free range"
        ex = (
            f"Instructed therapeutic exercise for {dx}, emphasizing {focus}. "
            f"Patient completed 2–3 sets within a pain‑free range and demonstrated measurable improvement toward {goal}."
        )
        return ex

    
    def _extract_cpt_code(self, content: str) -> Optional[str]:

        cpt_pattern = r'\b(97\d{3}|96\d{3}|95\d{3})\b'
        matches = re.findall(cpt_pattern, content)
        if matches:
            return matches[0]

        lower = content.lower()
        if "97110" in lower or "therapeutic exercise" in lower:
            return "97110"
        if "97530" in lower or "therapeutic activities" in lower or "functional" in lower:
            return "97530"
        if "97535" in lower or "self-care" in lower or "home program" in lower:
            return "97535"
        return None
    
    def _generate_rationale(self, chunks: List[Dict[str, Any]], user_input: UserInput) -> str:

        for chunk_data in chunks:
            content = chunk_data["chunk"].content
            if "rationale" in content.lower() or "evidence" in content.lower() or "purpose" in content.lower():
                sentences = content.split('.')
                for sentence in sentences:
                    s = sentence.strip()
                    if 20 < len(s) < 180:
                        if any(k in s.lower() for k in ["rationale", "evidence", "purpose", "goal", "aim"]):
                            return s
        diagnosis = user_input.diagnosis or "condition"
        return f"Purpose: support functional improvement for {diagnosis} with evidence-aligned interventions."
    
    def _extract_alternatives(
        self,
        chunks: List[Dict[str, Any]],
        user_input: UserInput
    ) -> List[Alternative]:

        
        alternatives = []
        
        for chunk_data in chunks[:3]:  # Limit to 3 alternatives
            chunk = chunk_data["chunk"]
            content = chunk.content
            

            if "alternative" in content.lower() or "instead" in content.lower():

                when = "When primary intervention is not effective"
                

                instead_try = content[:200] + "" if len(content) > 200 else content
                
                alternative = Alternative(
                    when=when,
                    instead_try=instead_try,
                    sources=[Source(
                        type=SourceType.CPG,
                        id=chunk.source_id,
                        section=chunk.headers[0] if chunk.headers else None,
                        page=chunk.page_ref,
                        quote=""
                    )]
                )
                alternatives.append(alternative)
        
        return alternatives
    
    def _determine_confidence(
        self,
        all_chunks: List[Dict[str, Any]],
        note_ninjas_chunks: List[Dict[str, Any]]
    ) -> ConfidenceLevel:

        

        if len(note_ninjas_chunks) >= 3:
            avg_score = sum(c["combined_score"] for c in note_ninjas_chunks[:3]) / 3
            if avg_score > 0.7:
                return ConfidenceLevel.HIGH
        

        if len(note_ninjas_chunks) >= 1:
            return ConfidenceLevel.MEDIUM
        

        return ConfidenceLevel.LOW
    
    def _apply_feedback_filtering(
        self,
        response: RecommendationResponse,
        feedback_state: FeedbackState
    ) -> RecommendationResponse:

        

        if feedback_state.blocked_cpts:
            for subsection in response.subsections:
                subsection.exercises = [
                    ex for ex in subsection.exercises
                    if ex.cpt not in feedback_state.blocked_cpts
                ]
        

        if feedback_state.blocked_exercises:
            for subsection in response.subsections:
                subsection.exercises = [
                    ex for ex in subsection.exercises
                    if ex.title not in feedback_state.blocked_exercises
                ]
        
        return response
    
    def _extract_purpose(self, content: str) -> str:
        """Heuristically derive a purpose-like first sentence."""
        import re
        # Look for explicit purpose/goal/aim sentences
        for sentence in [s.strip() for s in re.split(r'(?<=\.)\s+', content) if s.strip()]:
            lower = sentence.lower()
            if any(k in lower for k in ["purpose", "goal", "aim", "benefit", "helps to", "helps", "in order to"]):
                return f"Purpose: {sentence.rstrip('.').strip()}."
            m = re.search(r"to\s+(improve|increase|enhance|restore|reduce|decrease|maintain|develop)\b.+", lower)
            if m and len(sentence) < 180:
                return f"Purpose: {sentence.rstrip('.').strip()}."
        # Fallback
        return "Purpose: Improve function and tolerance while ensuring safety."

    def _ensure_min_exercises(
        self,
        subsections: List[Subsection],
        chunks: List[Dict[str, Any]],
        user_input: UserInput,
        min_count: int = 6,
    ) -> List[Subsection]:
        # Count existing exercises
        current = sum(len(s.exercises) for s in subsections)
        if current >= min_count:
            return subsections

        # Target subsection to receive padding
        if not subsections:
            subsections = [Subsection(title="General Exercises", rationale=None, exercises=[])]
        target = subsections[0]

        # Build a set of existing signatures to avoid duplicates (normalized title + desc prefix)
        sigs = set()
        for s in subsections:
            for ex in s.exercises:
                norm_t = self._norm_title(ex.title or "")
                sigs.add((norm_t, (ex.description or "")[:140]))

        # Iterate reranked chunks and add more exercises until min_count
        for item in chunks:
            if current >= min_count:
                break
            chunk = item.get("chunk")
            ex = self._parse_exercise_from_chunk(chunk, user_input)
            if not ex:
                continue
            # Skip clearly non-exercise titles here; GPT-coercion will happen later if needed
            if not self._is_exercise_title(ex.title or ""):
                continue
            norm_t = self._norm_title(ex.title or "")
            sig = (norm_t, (ex.description or "")[:140])
            if sig in sigs:
                continue
            target.exercises.append(ex)
            sigs.add(sig)
            current += 1

        return subsections

    def _norm_title(self, t: str) -> str:
        import re
        return re.sub(r"[^a-z0-9]+", "", t.lower()).strip()

    def _refine_exercise_titles_with_gpt(self, subsections: List[Subsection]) -> None:
        """Legacy: refine only titles (kept for fallback)."""
        self._refine_exercise_titles_and_descriptions_with_gpt(subsections, refine_descriptions=False)

    def _refine_exercise_titles_and_descriptions_with_gpt(self, subsections: List[Subsection], refine_descriptions: bool = True) -> None:
        """Use GPT to improve exercise titles (and descriptions if enabled).
        Updates in place. Best-effort; no-ops on failure."""
        # Collect exercises (keep order) – limit to 36 to bound tokens
        pairs: List[tuple] = []
        for s in subsections:
            for ex in s.exercises:
                # Require current title/description
                if (ex.title and ex.description) and len(pairs) < 36:
                    pairs.append((ex, ex.title.strip(), ex.description.strip()))
        if not pairs:
            return

        # Build JSON payload
        items = [{"title": t, "description": d} for (_, t, d) in pairs]
        import json as _json
        user_payload = _json.dumps({"items": items}, ensure_ascii=False)

        # System instructions
        system = (
            "You are a clinical editor for a PT/OT planning app. Improve each exercise title and, if requested, its description.\n"
            "Constraints for Title:\n"
            "- Keep original meaning and scope (no invented tools/modalities).\n"
            "- 2–6 words, Title Case, no punctuation except apostrophes.\n"
            "- Prefer specific, clinician-friendly names (e.g., 'Wall Slides', 'Prone T', 'Scapular Retraction with Band').\n"
            "Constraints for Description (if requested):\n"
            "- 1–2 sentences, clinician-facing, concise, professional.\n"
            "- Sentence 1: Purpose/outcome. Sentence 2: How to perform (key setup or cue), pain-free range.\n"
            "- Do not add information not inferable from the given title/description.\n"
            "Output strictly as JSON with matching order.\n"
        )
        # User content
        ask_desc = "true" if refine_descriptions else "false"
        user = (
            "Refine these items. Keep array length and order the same.\n"
            f"refine_descriptions: {ask_desc}\n\n"
            f"INPUT_JSON:\n{user_payload}\n\n"
            "Return ONLY JSON in the form:\n"
            "{\"items\":[{\"title\":\"...\",\"description\":\"...\"}, ...]}\n"
            "If refine_descriptions is false, keep description identical but still return the same structure."
        )

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model=getattr(settings, 'OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        content = resp.choices[0].message.content or '{}'
        try:
            data = _json.loads(content)
            out_items = data.get('items', [])
            if not isinstance(out_items, list) or len(out_items) != len(pairs):
                return
            # Apply back in order
            for (i, (ex, _old_t, _old_d)) in enumerate(pairs):
                entry = out_items[i] or {}
                new_t = str(entry.get('title', ex.title)).strip()
                new_d = str(entry.get('description', ex.description)).strip()
                if 0 < len(new_t) < 80:
                    ex.title = new_t
                if refine_descriptions and 30 <= len(new_d) <= 600:
                    ex.description = new_d
        except Exception:
            return

    def _ensure_unique_exercise_titles(self, subsections: List[Subsection]) -> None:
        """Ensure all exercise titles are unique across subsections and more easily distinguishable.
        First try GPT to de-duplicate across the group and optionally clarify descriptions.
        Then fall back to deterministic suffixes and description tweaks if needed.
        """
        # Flatten exercises
        ex_list: List[Exercise] = []
        for s in subsections:
            for ex in s.exercises:
                if ex.title:
                    ex_list.append(ex)
        if not ex_list:
            return

        def collect_dupes(items: List[Exercise]) -> Dict[str, List[Exercise]]:
            buckets: Dict[str, List[Exercise]] = {}
            for ex in items:
                key = self._norm_title(ex.title or "")
                if not key:
                    key = self._norm_title((ex.description or "")[:40])
                buckets.setdefault(key, []).append(ex)
            return {k: v for k, v in buckets.items() if len(v) > 1}

        dupes = collect_dupes(ex_list)

        # Group-wise GPT pass to ensure distinctness (titles and descriptions)
        try:
            if getattr(settings, 'OPENAI_API_KEY', None):
                import json as _json
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                items = [{"title": ex.title, "description": ex.description} for ex in ex_list]
                payload = _json.dumps({"items": items}, ensure_ascii=False)
                system = (
                    "You are a clinical editor. Make exercise titles distinct across the list without changing meaning.\n"
                    "Rules: 2–6 words, Title Case, no invented tools/modalities, no punctuation except apostrophes.\n"
                    "If two items are similar, choose differentiators from each description (position, tool, plane) and reflect that in the title OR first sentence of description.\n"
                    "Keep descriptions 1–2 sentences, clinician-facing, concise.\n"
                    "Return ONLY JSON: {\"items\":[{\"title\":\"...\",\"description\":\"...\"}, ...]} in the SAME ORDER."
                )
                user = (
                    "Ensure list-wide distinctness for selection and feedback.\n\n"
                    f"INPUT_JSON:\n{payload}\n"
                )
                resp = client.chat.completions.create(
                    model=getattr(settings, 'OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
                    messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                content = resp.choices[0].message.content or '{}'
                data = _json.loads(content)
                out_items = data.get('items', [])
                if isinstance(out_items, list) and len(out_items) == len(ex_list):
                    for i, ex in enumerate(ex_list):
                        entry = out_items[i] or {}
                        new_t = str(entry.get('title', ex.title)).strip()
                        new_d = str(entry.get('description', ex.description)).strip()
                        if new_t:
                            ex.title = new_t
                        if 30 <= len(new_d) <= 600:
                            ex.description = new_d
                    dupes = collect_dupes(ex_list)
        except Exception:
            pass

        # Heuristic fallback if duplicates persist
        if dupes:
            for key, group in dupes.items():
                for idx, ex in enumerate(group):
                    tokens = self._extract_disambiguators(ex.description or "")
                    # Update title with a concise differentiator
                    suffix = f" ({tokens[0]})" if tokens else f" (Variant {idx+1})"
                    ex.title = (ex.title or "Exercise") + suffix
                    # Also clarify description briefly if possible
                    if tokens:
                        first_period = ex.description.find('.')
                        if first_period != -1 and first_period < 200:
                            ex.description = ex.description[:first_period+1] + f" Emphasis: {tokens[0]}." + ex.description[first_period+1:]
                        else:
                            ex.description = (ex.description + f" Emphasis: {tokens[0]}.").strip()

    def _is_exercise_title(self, t: str) -> bool:
        tl = (t or "").strip().lower()
        if not tl:
            return False
        disallow = [
            'assessment', 'evaluate', 'evaluation', 'intake', 'screen', 'screening',
            'test', 'measure', 'questionnaire', 'scale', 'diagnosis', 'pathology'
        ]
        if any(w in tl for w in disallow):
            return False
        exercise_markers = [
            'exercise', 'stretch', 'slide', 'raise', 'rotation', 'flexion', 'extension', 'abduction', 'adduction',
            'bridge', 'hinge', 'row', 'press', 'curl', 'plank', 'squat', 'lunge', 'step', 'tap', 'glide', 'retraction',
            'isometric', 'eccentric', 'concentric', 'closed-chain', 'open-chain'
        ]
        return any(w in tl for w in exercise_markers)

    def _extract_disambiguators(self, description: str) -> List[str]:
        import re
        keywords = [
            'prone', 'supine', 'seated', 'standing', 'side-lying',
            'band', 'dumbbell', 'wall', 'foam roller', 'closed-chain', 'open-chain',
            'isometric', 'isotonic', 'eccentric', 'concentric',
            'scapular', 'overhead', 'external rotation', 'internal rotation', 'hinge',
            'balance', 'stability', 'endurance'
        ]
        lower = description.lower()
        hits = []
        for k in keywords:
            if k in lower:
                token = k.title() if ' ' not in k else ' '.join(w.capitalize() for w in k.split())
                hits.append(token)
        return hits[:2]

    def _coerce_exercises_with_gpt(self, subsections: List[Subsection], user_input: UserInput) -> None:
        """Ensure every item is an exercise. If an item appears to be an assessment/procedure,
        convert it to a clinically-appropriate exercise name and description consistent with the
        user's condition and desired outcome. Best-effort with strict JSON output."""
        try:
            import json as _json
            items = []
            ptrs = []
            for s in subsections:
                for ex in s.exercises:
                    ptrs.append(ex)
                    items.append({"title": ex.title or "", "description": ex.description or ""})
            if not items:
                return
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            context = {
                "patient_condition": user_input.patient_condition,
                "desired_outcome": user_input.desired_outcome,
                "treatment_progression": user_input.treatment_progression or ""
            }
            payload = _json.dumps({"context": context, "items": items}, ensure_ascii=False)
            system = (
                "You are a clinical editor for PT/OT exercises. Ensure ALL items are exercises, not assessments/diagnostics.\n"
                "If any item is an assessment/evaluation/test/procedure, replace it with a standard, appropriate EXERCISE that aligns with the context and original intent.\n"
                "Title: 2–6 words, Title Case, clinician-friendly; Description: 1–2 sentences: purpose then brief how-to.\n"
                "Do not invent unsafe modalities; prefer widely used PT/OT exercises. Return ONLY JSON with same order."
            )
            user = (
                "COERCE TO EXERCISES\n\n"
                f"INPUT_JSON:\n{payload}\n\n"
                "Return strictly:\n{\"items\":[{\"title\":\"...\",\"description\":\"...\"}, ...]}"
            )
            resp = client.chat.completions.create(
                model=getattr(settings, 'OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
                messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            content = resp.choices[0].message.content or '{}'
            data = _json.loads(content)
            out_items = data.get('items', [])
            if isinstance(out_items, list) and len(out_items) == len(ptrs):
                for i, ex in enumerate(ptrs):
                    entry = out_items[i] or {}
                    new_t = str(entry.get('title', ex.title)).strip()
                    new_d = str(entry.get('description', ex.description)).strip()
                    if new_t:
                        ex.title = new_t
                    if 20 <= len(new_d) <= 600:
                        ex.description = new_d
        except Exception as _e:
            # If GPT fails, leave as is; uniqueness/disambiguators will still run
            pass

    def _augment_cues_from_all_sources(self, subsections: List[Subsection], chunks: List[dict]) -> None:
        """Augment cues by mining cue-like lines across ALL retrieved sources and keep them distinct across exercises."""
        import re as _re
        # Build candidate pool
        candidates: list[str] = []
        for item in (chunks or []):
            chunk = item.get('chunk') if isinstance(item, dict) else None
            content = getattr(chunk, 'content', '') if chunk else ''
            for raw in (content or '').split('\n'):
                line = (raw or '').strip()
                if not line:
                    continue
                if line.startswith(('•','-','*')) or _re.match(r'^\d+\.', line):
                    cue = _re.sub(r'^[•\-*\d+\.]\s*', '', line).strip()
                else:
                    m = _re.match(r'^(Verbal|Tactile|Visual)\s*:\s*(.+)$', line, flags=_re.I)
                    cue = f"{m.group(1).capitalize()}: {m.group(2).strip()}" if m else ''
                if not cue:
                    continue
                low = cue.lower()
                if (6 <= len(cue) <= 180 and 'limb' not in low and not _re.search(r'\btarget\b', low)
                    and not ('alignment' in low and not any(k in low for k in ['neutral spine','knees','scapula','pelvis','ribs']))):
                    candidates.append(cue)
        used = set()
        for subsection in subsections or []:
            for ex in subsection.exercises or []:
                title = ex.title or ''
                keys = set(w for w in _re.split(r'[^a-z]+', title.lower()) if w and w not in {'with','and','the','of','to','in','for','a','an'})
                # keep quality existing cues first
                new_list: list[str] = []
                for c in ex.cues or []:
                    low = c.lower()
                    if (6 <= len(c) <= 180 and 'limb' not in low and not _re.search(r'\btarget\b', low)
                        and not ('alignment' in low and not any(k in low for k in ['neutral spine','knees','scapula','pelvis','ribs']))
                        and low not in used):
                        new_list.append(c)
                        used.add(low)
                # add from candidates by keyword
                for cand in candidates:
                    low = cand.lower()
                    if low in used:
                        continue
                    if any(k in low for k in keys):
                        new_list.append(cand)
                        used.add(low)
                    if len(new_list) >= 5:
                        break
                if len(new_list) < 3:
                    synth = self._extract_cues('', title)
                    for c in synth:
                        low = c.lower()
                        if low not in used:
                            new_list.append(c)
                            used.add(low)
                        if len(new_list) >= 5:
                            break
                ex.cues = new_list[:5]
    async def get_sources_info(self) -> Dict[str, Any]:
        return self.retriever.get_sources_info()
