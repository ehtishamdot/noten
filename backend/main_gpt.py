"""
Note Ninjas OT Recommender - Main FastAPI Application with GPT-4o Mini
RAG-only recommendation engine with feedback handling
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Dict, Any, Optional, List
import asyncio
from openai import OpenAI

from core.feedback_manager import FeedbackManager
from models.request_models import (
    RecommendationRequest,
    FeedbackRequest,
    RAGManifest
)
from models.response_models import (
    RecommendationResponse,
    FeedbackResponse,
    HealthResponse
)
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
openai_client: Optional[OpenAI] = None
feedback_manager: Optional[FeedbackManager] = None
rag_initialized = False

# System prompt from the requirements
SYSTEM_PROMPT = """
Role & Purpose

You are an OT recommendation engine that must ground every recommendation in retrieved sources using Retrieval-Augmented Generation (RAG). You produce a comprehensive, evidence-based treatment plan with detailed clinical support. Each recommendation must include: rationale/evidence, contraindications, progression options, dosage specifics, timeline, monitoring measures, home program integration, customization notes, and expected milestones.

Hard Requirements
1. RAG-Only: Do not invent knowledge. Use only content retrieved from the connected corpora.
2. Source Priority (apply at retrieval and synthesis time):
   1. Note Ninjas (in NoteNinjas Folder) (primary, includes Documentation Banks, CPT/Billing, OTPF/terminology, internal notes)
   2. Clinical Practice Guidelines (in Titled_CPGs and Untitled_CPGs) (CPGs) (secondary; evidence, contraindications, levels/classes of recommendation)
   3. Textbooks/Other (tertiary; background, definitions)
3. Citations: Every exercise must include at least one Note Ninjas citation; include CPG citations when relevant. Cite with detailed sources array including rationale/evidence.
4. No Hallucinated CPTs: Only return CPT codes that appear in the retrieved Note Ninjas/CPT sources. If absent, return "cpt": null and add an explanatory note in "notes".
5. Framework Awareness: Apply OTPF-4/OT reasoning when organizing content. Use it as a framework, not as a rigid rule; cite framework sources when used.
6. Feedback-Aware: Accept user feedback (thumbs up/down, corrections, preferences) and reflect it in the next answer within the same session. If the feedback conflicts with sources, respect the feedback for formatting/preferences but do not violate clinical evidence or make unsafe claims.
7. Clinical Guardrails: Provide clinician-facing decision support, not medical advice for laypersons. Flag safety issues and contraindications when surfaced by CPGs.
8. Honesty Under Uncertainty: If retrieval is weak or conflicting, return "confidence": "low" and explain conflict succinctly in "notes".

Enhanced Clinical Requirements
9. Evidence-Based Rationale: Include specific rationale and evidence references for each recommendation.
10. Safety First: Always include contraindications, precautions, and risk factors.
11. Progressive Framework: Provide clear progression/regression options with decision criteria.
12. Precise Dosage: Include specific volume, intensity, and frequency guidelines.
13. Timeline Mapping: Map recommendations to specific weeks/phases with clear milestones.
14. Objective Monitoring: Include assessment measures and tracking intervals.
15. Home Integration: Address daily life integration, rest, and lifestyle considerations.
16. Customization: Provide adaptation guidelines for patient-specific factors.
17. Expected Outcomes: Include interim and final milestones with success criteria.

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
          "rationale": "string (evidence-based reasoning for this exercise)",
          "contraindications": "string (when NOT to use this exercise, safety concerns)",
          "progression_options": "string (how to progress: easier/harder versions, decision criteria)",
          "dosage_specifics": "string (precise sets/reps/duration/frequency with weekly progression)",
          "timeline_phase": "string (which week/phase this applies to, e.g., 'Week 1-2')",
          "monitoring_measures": "string (what to assess and when, e.g., 'Pain scale 0-10, ROM measurement weekly')",
          "home_program_integration": "string (daily life integration, rest, ergonomics, posture)",
          "customization_notes": "string (how to adapt for patient-specific factors)",
          "expected_milestones": "string (interim and final outcomes, e.g., 'Week 2: 140°, Week 3: 145°')",
          "notes": "string | null (uncertainty, contraindications, adaptations)",
          "sources": [
            {
              "type": "note_ninjas | cpg | textbook",
              "id": "string (exact filename with extension)",
              "section": "string | null (heading/normalized header)",
              "page": "string | null (e.g., 'p. e345' or 'pp. 23-24')",
              "quote": "string (<= 300 chars from the retrieved chunk)",
              "file_path": "string (full path like 'NoteNinjas/Arthritis.docx' or 'Titled_CPGs/ACOEM-Shoulder-Guideline.pdf')"
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global openai_client, feedback_manager, rag_initialized
    
    logger.info("Initializing Note Ninjas GPT backend")
    
    try:
        # Initialize OpenAI client
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("OpenAI client initialized")
        
        # Initialize feedback manager
        feedback_manager = FeedbackManager()
        logger.info("Feedback manager initialized")
        
        rag_initialized = True
        logger.info("Note Ninjas GPT backend ready!")
        
    except Exception as e:
        logger.error(f"Failed to initialize backend: {e}")
        rag_initialized = False
    
    yield
    
    # Cleanup
    logger.info("Shutting down Note Ninjas backend")


# Create FastAPI app
app = FastAPI(
    title="Note Ninjas OT Recommender",
    description="RAG-powered OT/PT recommendation system using GPT-4o Mini",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if rag_initialized else "initializing",
        version="1.0.0",
        rag_system_ready=rag_initialized,
        feedback_system_ready=rag_initialized
    )


@app.get("/sources")
async def get_sources():
    """Get available sources (simplified for now)"""
    return {
        "total_chunks": 0,
        "source_counts": {"note_ninjas": 0, "cpg": 0},
        "sources_by_type": {"note_ninjas": [], "cpg": []}
    }


@app.post("/recommendations", response_model=RecommendationResponse)
async def generate_recommendations(request: RecommendationRequest):
    """Generate recommendations using GPT-4o Mini"""
    
    if not rag_initialized or not openai_client:
        raise HTTPException(status_code=503, detail="RAG system not ready")
    
    logger.info(f"Generating recommendations for session {request.session_id}")
    
    try:
        # Build context from user input with file source information
        user_input = request.user_input
        context = f"""
Patient Condition: {user_input.patient_condition}
Desired Outcome: {user_input.desired_outcome}
Treatment Progression: {user_input.treatment_progression or "Not specified"}
Input Mode: {user_input.input_mode}

IMPORTANT: When citing sources, ALWAYS include the exact file path in the format:
- For Note Ninjas files: "NoteNinjas/[filename].docx" (e.g., "NoteNinjas/Arthritis.docx")
- For CPG files: "Titled_CPGs/[filename].pdf" or "Untitled_CPGs/[filename].pdf"

Available source files include:
Note Ninjas Documents:
- Activities of Daily Living.docx, Acute Care Guide.docx, Ambulation_Gait and Functional Mobility.docx
- Arthritis.docx, Balance.docx, Bed Mobility.docx, Cognition.docx, Current Events.docx
- Dementia.docx, Discharge.docx, Documentation Bank.docx, Endurance.docx
- Evidence-Based Research.docx, Fine Motor Coordination.docx, Goal Writing.docx
- Group Therapy.docx, Initial Evaluation.docx, Intervention Frameworks.docx
- Manual Therapy.docx, Mental Health.docx, Modalities.docx, Multiple Sclerosis.docx
- Outcome Measure.docx, Parkinson_s Disease_.docx, Precautions.docx, Progress Reports.docx
- Resources.docx, Sensory Integration.docx, Skilled Therapy Tips.docx
- Stroke and Neuro.docx, Therapeutic Exercises.docx, Upper Extremity.docx, Vestibular.docx

Clinical Practice Guidelines (CPGs):
- Multiple PDF files in Titled_CPGs/ and Untitled_CPGs/ directories
- Include specific page references when citing from PDFs

Based on this information, generate evidence-based OT recommendations following the Note Ninjas framework.
Focus on practical, implementable interventions with proper CPT codes when available.

CRITICAL: In your source citations, ALWAYS fill in the "file_path" field with the exact path format:
- For Note Ninjas: "NoteNinjas/[filename].docx" (e.g., "NoteNinjas/Therapeutic Exercises.docx")
- For CPGs: "Titled_CPGs/[filename].pdf" or "Untitled_CPGs/[filename].pdf"

Do not leave file_path as null - always provide the complete file path.
"""
        
        # Add feedback state if available
        if request.feedback_state:
            context += f"\nUser Feedback: {request.feedback_state}"
        
        # Generate response using GPT-4o Mini
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": context}
        ]
        
        response = openai_client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=messages,
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        response_data = response.choices[0].message.content
        logger.info("GPT response received, parsing")
        
        import json
        data = json.loads(response_data)
        
        # Convert to response model
        from models.response_models import Subsection, Exercise, Source, Alternative, SourceType, ConfidenceLevel
        
        subsections = []
        for sub_data in data.get("subsections", []):
            exercises = []
            for ex_data in sub_data.get("exercises", []):
                    sources = []
                    for src_data in ex_data.get("sources", []):
                        # Generate file_path from id if not provided
                        file_path = src_data.get("file_path")
                        if not file_path and src_data["id"]:
                            if src_data["type"] == "note_ninjas":
                                file_path = f"NoteNinjas/{src_data['id']}"
                            elif src_data["type"] == "cpg":
                                file_path = f"Titled_CPGs/{src_data['id']}"
                            else:
                                file_path = src_data["id"]
                        
                        sources.append(Source(
                            type=SourceType(src_data["type"]),
                            id=src_data["id"],
                            section=src_data.get("section"),
                            page=src_data.get("page"),
                            quote=src_data["quote"],
                            file_path=file_path
                        ))
                    
                    exercise = Exercise(
                        title=ex_data.get("title"),
                        description=ex_data["description"],
                        cues=ex_data.get("cues", []),
                        documentation=ex_data.get("documentation"),
                        cpt=ex_data.get("cpt"),
                        rationale=ex_data.get("rationale"),
                        contraindications=ex_data.get("contraindications"),
                        progression_options=ex_data.get("progression_options"),
                        dosage_specifics=ex_data.get("dosage_specifics"),
                        timeline_phase=ex_data.get("timeline_phase"),
                        monitoring_measures=ex_data.get("monitoring_measures"),
                        home_program_integration=ex_data.get("home_program_integration"),
                        customization_notes=ex_data.get("customization_notes"),
                        expected_milestones=ex_data.get("expected_milestones"),
                        notes=ex_data.get("notes"),
                        sources=sources
                    )
                    exercises.append(exercise)
            
            subsection = Subsection(
                title=sub_data["title"],
                rationale=sub_data.get("rationale"),
                exercises=exercises
            )
            subsections.append(subsection)
        
        # Parse alternatives
        alternatives = []
        for alt_data in data.get("suggested_alternatives", []):
            sources = []
            for src_data in alt_data.get("sources", []):
                # Generate file_path from id if not provided
                file_path = src_data.get("file_path")
                if not file_path and src_data["id"]:
                    if src_data["type"] == "note_ninjas":
                        file_path = f"NoteNinjas/{src_data['id']}"
                    elif src_data["type"] == "cpg":
                        file_path = f"Titled_CPGs/{src_data['id']}"
                    else:
                        file_path = src_data["id"]
                
                sources.append(Source(
                    type=SourceType(src_data["type"]),
                    id=src_data["id"],
                    section=src_data.get("section"),
                    page=src_data.get("page"),
                    quote=src_data.get("quote", ""),
                    file_path=file_path
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
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    """Submit feedback"""
    
    if not feedback_manager:
        raise HTTPException(status_code=503, detail="Feedback system not ready")
    
    try:
        feedback_id = feedback_manager.store_feedback(
            session_id=request.session_id,
            recommendation_id=request.recommendation_id,
            feedback_type=request.feedback_type,
            feedback_data=request.feedback_data
        )
        
        return FeedbackResponse(
            success=True,
            message="Feedback received ",
            feedback_id=feedback_id
        )
        
    except Exception as e:
        logger.error(f"Error storing feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store feedback: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
