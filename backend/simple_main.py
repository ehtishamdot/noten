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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

openai_client: Optional[OpenAI] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global openai_client
    logger.info("Initializing simple GPT backend (no RAG)")
    try:
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        logger.info("Backend initialized")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        raise
    finally:
        logger.info("Shutting down")

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

@app.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    try:
        logger.info(f"Processing request for session: {request.session_id}")
        client = openai_client
        
        prompt = f"""You are an expert occupational therapist. Generate 6 treatment recommendation subsections with exercises SPECIFIC to this patient.

Patient Condition: {request.user_input.patient_condition}
Treatment Goal: {request.user_input.desired_outcome}

Generate exactly 6 subsections following these treatment categories, but customize the exercises for THIS specific patient:

1. Manual Therapy Techniques - Select appropriate manual techniques for this condition
2. Progressive Strengthening Protocol - Choose strengthening exercises targeting this patient's deficits
3. Neuromuscular Re-education - Select coordination/balance exercises appropriate for this case
4. Work-Specific Functional Training - Create functional activities matching the desired outcome
5. Pain Management Modalities - Choose modalities appropriate for this condition
6. Home Exercise Program - Design home exercises this patient can safely perform

CRITICAL REQUIREMENTS:
1. Each subsection MUST have MINIMUM 2 exercises (preferably 3)
2. Write a description that NATURALLY mentions EACH exercise name by its EXACT name
3. Exercise names must appear word-for-word in the description text
4. Make exercise names specific (e.g., "Shoulder External Rotation with Theraband" not just "strengthening")

STEP-BY-STEP PROCESS:
1. First, decide on 2-3 specific exercises for the subsection
2. Then write a description that naturally mentions all of them by name
3. Then provide full details for each exercise

EXAMPLE of good description mentioning exercises:
"Begin with Scapular Mobilizations to restore proper shoulder blade motion, then progress to Glenohumeral Joint Mobilizations for improved shoulder socket mobility. Soft Tissue Release techniques can help address muscle tension and restrictions."

EXERCISE FORMAT (for each exercise):
- name: Specific exercise name
- description: 2-3 sentences about technique and positioning
- cues: EXACTLY 3 cues (mix of Verbal, Tactile, Visual)
- documentation_examples: EXACTLY 1 detailed clinical example
- cpt_codes: 1 appropriate CPT code
- notes: 1 sentence about contraindications

JSON format:
{{
  "high_level": ["Patient-specific recommendation 1", "Patient-specific recommendation 2"],
  "subsections": [
    {{
      "title": "Manual Therapy Techniques",
      "description": "Begin with Scapular Mobilizations to restore proper shoulder blade motion, then progress to Glenohumeral Joint Mobilizations for improved shoulder socket mobility. Soft Tissue Release techniques can help address muscle tension and restrictions.",
      "rationale": "Manual therapy addresses movement restrictions",
      "exercises": [
        {{
          "name": "Scapular Mobilizations",
          "description": "Patient positioned side-lying with affected shoulder up. Therapist stabilizes thorax while mobilizing scapula in multiple directions. Perform 2-3 sets of 10 repetitions in each direction.",
          "cues": [
            "Verbal: 'Let your shoulder blade relax completely as I move it'",
            "Tactile: Place hands on medial border and inferior angle of scapula for control",
            "Visual: Show patient scapular movement patterns on skeleton model"
          ],
          "documentation_examples": [
            "Pt received scapular mobilizations in side-lying position to address scapulothoracic restrictions. Mobilizations performed in all planes with focus on inferior and lateral glide. Pt tolerated well with improved scapular mobility and reduced compensatory patterns during shoulder elevation."
          ],
          "cpt_codes": [
            {{"code": "97140", "description": "Manual therapy techniques", "notes": "One or more regions, 15 minutes"}}
          ],
          "notes": "Avoid in acute shoulder trauma or severe osteoporosis"
        }},
        {{
          "name": "Glenohumeral Joint Mobilizations",
          "description": "Patient supine with arm in resting position. Apply Grade III inferior glides to increase overhead mobility. Progress to posterior glides for internal rotation improvements.",
          "cues": [
            "Verbal: 'This should feel like a gentle stretch deep in your shoulder joint'",
            "Tactile: Stabilize scapula while applying mobilization force at humeral head",
            "Visual: Use treatment table positioning to demonstrate proper arm angle"
          ],
          "documentation_examples": [
            "Grade III inferior glides applied to R glenohumeral joint in supine to address capsular restrictions. Sustained mobilizations held 30 seconds with 3 repetitions. Passive shoulder flexion improved from 140° to 155° post-treatment with decreased pain at end range."
          ],
          "cpt_codes": [
            {{"code": "97140", "description": "Manual therapy techniques", "notes": "Joint mobilization, 15 minute increments"}}
          ],
          "notes": "Contraindicated in acute inflammation or joint instability"
        }},
        {{
          "name": "Soft Tissue Release",
          "description": "Apply sustained pressure to rotator cuff muscles and surrounding soft tissue. Focus on areas of restriction with cross-fiber techniques. Treatment time 8-12 minutes per muscle group.",
          "cues": [
            "Verbal: 'Tell me if the pressure becomes too intense - it should be uncomfortable but tolerable'",
            "Tactile: Apply gradually increasing pressure perpendicular to muscle fibers",
            "Visual: Show patient trigger point locations on anatomy chart"
          ],
          "documentation_examples": [
            "Soft tissue release applied to R supraspinatus and infraspinatus muscles to address myofascial restrictions. Cross-fiber techniques used for 10 minutes with patient reporting decreased muscle tension. Improved tolerance to shoulder elevation post-treatment."
          ],
          "cpt_codes": [
            {{"code": "97140", "description": "Manual therapy techniques", "notes": "Soft tissue mobilization, 15 minutes"}}
          ],
          "notes": "May cause temporary soreness; avoid over bony prominences"
        }}
      ]
    }},
    ... (5 more subsections with same format)
  ],
  "suggested_alternatives": ["Alternatives specific to this case"],
  "confidence": "high"
}}

CRITICAL: The description MUST mention every exercise by its exact name. Return ONLY valid JSON.
Specific to: {request.user_input.patient_condition} | Goal: {request.user_input.desired_outcome}"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert OT. Generate patient-specific exercises. CRITICAL: The description text must mention every exercise by its exact name so they can be highlighted. Return valid JSON with exactly 3 cues and 1 doc example per exercise."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=5000
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
        
        data = json.loads(content)
        return data
        
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("simple_main:app", host="0.0.0.0", port=8000, reload=True)
