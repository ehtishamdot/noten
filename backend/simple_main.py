from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Optional
from openai import OpenAI
import json
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

openai_client: Optional[OpenAI] = None
executor = ThreadPoolExecutor(max_workers=6)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global openai_client
    logger.info("Initializing simple GPT backend (no RAG)")
    try:
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        logger.info("Backend initialized with parallel processing")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        raise
    finally:
        logger.info("Shutting down")
        executor.shutdown(wait=True)

app = FastAPI(title="Note Ninjas OT Recommender", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    patient_condition: str
    desired_outcome: str
    input_mode: str = "simple"

class RecommendationRequest(BaseModel):
    user_input: UserInput
    session_id: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0", "rag_system_ready": False, "feedback_system_ready": False}

def generate_subsection(subsection_info: dict, patient_condition: str, desired_outcome: str) -> dict:
    """Generate a single subsection using GPT-4o"""
    try:
        client = openai_client
        
        prompt = f"""Generate 1 OT treatment subsection for: {patient_condition} | Goal: {desired_outcome}

Subsection: {subsection_info['title']} - {subsection_info['focus']}

Create 2-3 patient-specific exercises. Description MUST mention all exercise names naturally.

Each exercise needs:
- name: Specific exercise name
- description: 2-3 detailed sentences about technique and positioning
- cues: EXACTLY 3 detailed cues (each cue should be 1-2 full sentences explaining the technique clearly)
  * Verbal cue: What to say to the patient (detailed instruction)
  * Tactile cue: How to physically guide or touch the patient (detailed technique)
  * Visual cue: What to show or how to demonstrate (detailed visual feedback)
- documentation_examples: 1 detailed clinical note (2-3 sentences)
- cpt_codes: 1 appropriate CPT code with full details
- notes: 1 sentence about contraindications

Example cue format:
"Verbal: Instruct the patient to relax their shoulder muscles completely and breathe deeply, explaining that they should feel a gentle stretch but no sharp pain as you perform the mobilization technique."

Format:
{{
  "title": "{subsection_info['title']}",
  "description": "Start with [Exercise 1 name] to address X, then [Exercise 2 name] for Y, and optionally [Exercise 3 name] to improve Z.",
  "rationale": "Clinical rationale for this approach",
  "exercises": [
    {{
      "name": "Specific Exercise Name",
      "description": "Detailed description of how to perform this exercise. Patient positioning and setup. Progression and modifications as needed.",
      "cues": [
        "Verbal: Detailed instruction to give the patient explaining what to do and what they should feel during the exercise.",
        "Tactile: Detailed explanation of where and how to place your hands to guide the patient through proper form and positioning.",
        "Visual: Detailed description of what to show the patient, such as using mirrors, diagrams, or demonstrating the movement yourself."
      ],
      "documentation_examples": [
        "Comprehensive clinical note documenting the exercise performed, patient positioning, number of repetitions or duration, patient response and tolerance, and measurable outcomes achieved."
      ],
      "cpt_codes": [
        {{"code": "97XXX", "description": "Full billing code description", "notes": "Specific billing notes and time requirements"}}
      ],
      "notes": "Detailed contraindication or precaution to consider for this specific exercise"
    }}
  ]
}}

Return ONLY JSON. Make cues detailed and comprehensive."""

        response = client.chat.completions.create(
            model="gpt-4o",  # Using full GPT-4o for best quality
            messages=[
                {"role": "system", "content": "Expert OT. Generate patient-specific exercises with DETAILED cues (1-2 sentences each). Description must mention all exercise names. Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        
        # Strip markdown if present
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].strip().startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            content = "\n".join(lines)
        
        return json.loads(content)
        
    except Exception as e:
        logger.error(f"Error generating subsection {subsection_info['title']}: {e}")
        # Return fallback subsection
        return {
            "title": subsection_info['title'],
            "description": f"Treatment approach for {subsection_info['title'].lower()}.",
            "rationale": "Evidence-based intervention",
            "exercises": []
        }

@app.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    try:
        logger.info(f"Processing parallel request for session: {request.session_id}")
        
        # Define 6 subsections to generate in parallel
        subsection_configs = [
            {"title": "Manual Therapy Techniques", "focus": "mobilizations, soft tissue work"},
            {"title": "Progressive Strengthening Protocol", "focus": "strengthening exercises"},
            {"title": "Neuromuscular Re-education", "focus": "coordination, balance, proprioception"},
            {"title": "Work-Specific Functional Training", "focus": "functional activities for goals"},
            {"title": "Pain Management Modalities", "focus": "modalities for pain control"},
            {"title": "Home Exercise Program", "focus": "home exercises patient can do"}
        ]
        
        # Generate all subsections in parallel using ThreadPoolExecutor
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(
                executor,
                generate_subsection,
                config,
                request.user_input.patient_condition,
                request.user_input.desired_outcome
            )
            for config in subsection_configs
        ]
        
        # Wait for all parallel tasks to complete
        subsections = await asyncio.gather(*tasks)
        
        # Build final response
        response_data = {
            "high_level": [
                f"Focus on progressive treatment for {request.user_input.patient_condition}",
                f"Incorporate activities to achieve: {request.user_input.desired_outcome}"
            ],
            "subsections": subsections,
            "suggested_alternatives": ["Consider aquatic therapy if appropriate", "Explore telehealth options for home program"],
            "confidence": "high"
        }
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("simple_main:app", host="0.0.0.0", port=8000, reload=True)
