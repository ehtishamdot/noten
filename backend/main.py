
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Optional

from core.gpt_rag_system import GPTRAGSystem
from core.feedback_manager import FeedbackManager
from models.request_models import RecommendationRequest, FeedbackRequest
from models.response_models import RecommendationResponse, FeedbackResponse, HealthResponse
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

rag_system: Optional[GPTRAGSystem] = None
feedback_manager: Optional[FeedbackManager] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_system, feedback_manager
    
    logger.info("Initializing backend")
    
    try:
        rag_system = GPTRAGSystem(
            note_ninjas_path=settings.NOTE_NINJAS_PATH,
            cpg_paths=settings.CPG_PATHS,
            vector_store_path=settings.VECTOR_STORE_PATH
        )
        await rag_system.initialize()
        
        feedback_manager = FeedbackManager()
        
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_rag_system() -> GPTRAGSystem:
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    return rag_system

def get_feedback_manager() -> FeedbackManager:
    if feedback_manager is None:
        raise HTTPException(status_code=503, detail="Feedback manager not initialized")
    return feedback_manager


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
    rag: GPTRAGSystem = Depends(get_rag_system),
    feedback: FeedbackManager = Depends(get_feedback_manager)
):
    try:
        logger.info(f"Processing request for session: {request.session_id}")
        
        feedback_state = feedback.get_feedback_state(request.session_id)
        
        recommendations = await rag.generate_recommendations(
            user_input=request.user_input,
            rag_manifest=request.rag_manifest,
            session_id=request.session_id,
            feedback_state=feedback_state
        )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


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
            feedback_data=request.feedback_data
        )
        
        return FeedbackResponse(
            success=True,
            message="Feedback stored",
            feedback_id=result.feedback_id
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
    rag: GPTRAGSystem = Depends(get_rag_system)
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
