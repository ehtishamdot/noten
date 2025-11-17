
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Optional

from core.gpt_rag_system import GPTRAGSystem as RAGSystem
from pathlib import Path
from core.feedback_manager import FeedbackManager
from models.request_models import RecommendationRequest, FeedbackRequest, RAGManifest
from models.response_models import RecommendationResponse, FeedbackResponse, HealthResponse
from config import settings
from openai import OpenAI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

rag_system: Optional[RAGSystem] = None
feedback_manager: Optional[FeedbackManager] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_system, feedback_manager
    
    logger.info("Initializing backend")
    
    try:
                # Resolve corpus paths robustly relative to this file to avoid cwd issues
        base = Path(__file__).resolve().parent.parent  # /.../note-ninjas/backend
        nn_path = Path(settings.NOTE_NINJAS_PATH)
        if not nn_path.is_absolute():
            # try ../../NoteNinjas if ../NoteNinjas doesn't exist
            nn_path = (base / settings.NOTE_NINJAS_PATH).resolve()
            if not nn_path.exists():
                alt = (base.parent / 'NoteNinjas').resolve()
                if alt.exists():
                    nn_path = alt
        cpg_paths = []
        for p in settings.CPG_PATHS or []:
            pp = Path(p)
            if not pp.is_absolute():
                pp = (base / p).resolve()
                if not pp.exists():
                    alt = (base.parent / Path(p).name).resolve()
                    if alt.exists():
                        pp = alt
            cpg_paths.append(str(pp))
        rag_system = RAGSystem(
            note_ninjas_path=str(nn_path),
            cpg_paths=cpg_paths,
            vector_store_path=settings.VECTOR_STORE_PATH
        )
        await rag_system.initialize()
        
        feedback_manager = FeedbackManager(
            storage_type=settings.FEEDBACK_STORAGE_TYPE,
            storage_path=None,
            database_url=settings.DATABASE_URL
        )
        
        logger.info("Backend initialized")
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        raise
    finally:
        logger.info("Shutting down")


app = FastAPI(
    title="Note Ninjas OT Recommender",
    description="OT recommendation engine",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_rag_system() -> RAGSystem:
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    return rag_system

def get_feedback_manager() -> FeedbackManager:
    if feedback_manager is None:
        raise HTTPException(status_code=503, detail="Feedback manager not initialized")
    return feedback_manager
class GenerateCuesRequest(BaseModel):
    description: str = Field(..., description="Exercise description")
    documentation: str | None = Field(None, description="Documentation exemplar")
    subsection_title: str | None = Field(None, description="Subsection title context")

class GenerateCuesResponse(BaseModel):
    cues: list[str] = Field(default_factory=list, description="Generated cue list")


class GenerateCPTRequest(BaseModel):
    title: str = Field(..., description="Exercise or intervention title")
    description: str = Field(..., description="Exercise or intervention description")


class GenerateCPTResponse(BaseModel):
    cpt_code: str = Field(..., description="CPT code")
    cpt_title: str = Field(..., description="Official CPT code title")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        rag_system_ready=rag_system is not None,
        feedback_system_ready=feedback_manager is not None
    )

@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    rag: RAGSystem = Depends(get_rag_system),
    feedback: FeedbackManager = Depends(get_feedback_manager)
):
    try:
        logger.info(f"Processing request for session: {request.session_id}")
        
        feedback_state = feedback.get_feedback_state(request.session_id)
        
        recommendations = await rag.generate_recommendations(
            user_input=request.user_input,
            rag_manifest=request.rag_manifest or RAGManifest(),
            session_id=request.session_id,
            feedback_state=feedback_state
        )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")
@app.post("/generate_cues", response_model=GenerateCuesResponse)
async def generate_cues(payload: GenerateCuesRequest):
    try:
        client = OpenAI()
        prompt = (
            "You are an OT assistant. Generate 4-5 concise clinician-facing cue statements for the exercise described. "
            "Prefer short, actionable phrasing. Include a mix of verbal, tactile, and visual cues where appropriate.\n\n"
            "IMPORTANT: Consider the option of using mirror cues where appropriate. For example:\n"
            "- 'Visual: Have patient look in mirror to observe proper form while performing the movement'\n"
            "- 'Visual: Use mirror to ensure shoulder alignment remains level during the exercise'\n"
            "- 'Visual: Patient observes scapular movement in mirror to ensure proper retraction'\n\n"
            f"Subsection: {payload.subsection_title or 'N/A'}\n"
            f"Exercise Description: {payload.description}\n"
            f"Documentation Exemplar: {payload.documentation or 'N/A'}\n\n"
            "Return ONLY a JSON array of strings."
        )
        chat = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Return JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        content = chat.choices[0].message.content or "[]"
        import json as _json
        try:
            cues = _json.loads(content)
            if not isinstance(cues, list):
                cues = []
        except Exception:
            cues = []
        # Ensure at least 4 cues with safe fillers if needed
        base = []
        seen = set()
        for c in cues:
            s = str(c).strip()
            if not s:
                continue
            k = s.lower()
            if k in seen:
                continue
            seen.add(k)
            base.append(s)
        if len(base) < 4:
            fillers = [
                'Breath: steady inhale/exhale; avoid breath holding',
                'Pace: slow, controlled tempo with 1–2s pauses at end range',
                'Safety: stop if symptomatic; adjust range to remain pain‑free'
            ]
            for f in fillers:
                if len(base) >= 4:
                    break
                if f.lower() not in seen:
                    seen.add(f.lower())
                    base.append(f)
        return GenerateCuesResponse(cues=base[:5])
    except Exception as e:
        logger.error(f"Error generating cues: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate cues")


@app.post("/generate_cpt", response_model=GenerateCPTResponse)
async def generate_cpt(payload: GenerateCPTRequest):
    """
    Generate the best CPT code for a given exercise or intervention.
    Uses GPT-4 with strict prompt to ensure accuracy.
    """
    try:
        client = OpenAI()
        prompt = f"""You are a Physical Therapy CPT coding assistant.
Given an exercise or intervention title and description, return the single best CPT code and its official title.
Only choose from the list below.
Never invent codes or output anything not in this list.
Pick one code per input.
If unsure, use the decision rules.

Allowed CPT Codes:
97110 — Therapeutic Exercise
97112 — Neuromuscular Re-education
97530 — Therapeutic Activities
97140 — Manual Therapy Techniques
97535 — Self-Care/Home Management Training
97116 — Gait Training Therapy
97032 — Electrical Stimulation, Manual (Attended)
G0283 / 97014 — Electrical Stimulation (Unattended)
97035 — Ultrasound Therapy
97113 — Aquatic Therapy
97542 — Wheelchair Management Training
97010 — Hot/Cold Pack Therapy

Decision Rules:
97110: Strength, active exercise, stretching, ROM, endurance, reps and sets
97112: Motor control, proprioception, balance, posture, stabilization, PNF, coordinated movement training
97530: Functional and multi-joint tasks tied to real-world activity (sit to stand, lifting, reaching, step training)
97140: Therapist performs hands-on soft tissue mobilization, joint mobilization, manual stretching, IASTM
97535: Teaching self-management, posture, ergonomics, ADLs, home exercise program education
97116: Gait pattern training, walking mechanics, stair training, assistive device training
97032: Therapist applies and attends e-stim
G0283 / 97014: Unattended e-stim
97035: Ultrasound intervention
97113: Exercise or therapy performed in water
97542: Wheelchair propulsion, safety, mechanics, or maneuver training
97010: Heat or cold pack application (note: often unbillable for Medicare, but still classify)

Disambiguation rules:
If exercise is primarily strength/ROM/stretching → 97110
If primary goal is neuromuscular control or proprioception → 97112
If the movement is task-based and functional → 97530
If therapist is physically performing movement or mobilization → 97140
If performed in a pool → 97113
If walking mechanics are the focus → 97116
If the patient is being taught independent management skills → 97535
If e-stim is attended → 97032
If e-stim is unattended → G0283 or 97014

Input:
Title: {payload.title}
Description: {payload.description}

Output format:
No extra text. No rationale. No quotes. Only the CPT code and title in format {{"cpt_code": "*code*", "cpt_title": "*title*"}}"""

        chat = client.chat.completions.create(
            model="gpt-4",  # Using GPT-4 for higher accuracy
            messages=[
                {"role": "system", "content": "You are a Physical Therapy CPT coding expert. Return JSON only with cpt_code and cpt_title."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,  # Deterministic for coding accuracy
            response_format={"type": "json_object"}
        )

        content = chat.choices[0].message.content or '{}'
        import json as _json
        try:
            result = _json.loads(content)
            cpt_code = result.get('cpt_code', '97110')
            cpt_title = result.get('cpt_title', 'Therapeutic Exercise')
            return GenerateCPTResponse(cpt_code=cpt_code, cpt_title=cpt_title)
        except Exception as parse_err:
            logger.error(f"Error parsing CPT response: {parse_err}")
            # Fallback to 97110 (Therapeutic Exercise) as safe default
            return GenerateCPTResponse(cpt_code="97110", cpt_title="Therapeutic Exercise")

    except Exception as e:
        logger.error(f"Error generating CPT code: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate CPT code")


@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    feedback: FeedbackManager = Depends(get_feedback_manager)
):
    try:
        result = feedback.store_feedback(
            session_id=request.session_id,
            recommendation_id=request.recommendation_id,
            feedback_type=request.feedback_type,
            feedback_data=request.feedback_data,
            comment=request.comment
        )
        
        # Extract exercise data from feedback_data if present
        exercise_data = None
        if request.feedback_data and 'exercise' in request.feedback_data:
            exercise_data = request.feedback_data['exercise']
        elif request.feedback_data and 'exercise_data' in request.feedback_data:
            exercise_data = request.feedback_data['exercise_data']
        else:
            # Return all feedback_data as exercise_data for flexibility
            exercise_data = request.feedback_data
        
        return FeedbackResponse(
            success=True,
            message="Feedback stored",
            feedback_id=result.feedback_id,
            exercise_data=exercise_data
        )
        
    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process feedback: {str(e)}")


@app.get("/feedback/{session_id}")
async def get_session_feedback(
    session_id: str,
    feedback: FeedbackManager = Depends(get_feedback_manager)
):
    try:
        feedback_state = feedback.get_feedback_state(session_id)
        return feedback_state
        
    except Exception as e:
        logger.error(f"Error retrieving feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve feedback: {str(e)}")

@app.delete("/feedback/{session_id}")
async def clear_session_feedback(
    session_id: str,
    feedback: FeedbackManager = Depends(get_feedback_manager)
):
    try:
        feedback.clear_feedback(session_id)
        return {"success": True, "message": "Session feedback cleared"}
        
    except Exception as e:
        logger.error(f"Error clearing feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear feedback: {str(e)}")

@app.get("/sources")
async def get_available_sources(
    rag: RAGSystem = Depends(get_rag_system)
):
    try:
        sources_info = await rag.get_sources_info()
        return sources_info
        
    except Exception as e:
        logger.error(f"Error retrieving sources info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sources info: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )
