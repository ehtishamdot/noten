#!/usr/bin/env python3
"""
Integration example showing how to connect Note Ninjas backend with frontend
"""

import json
import asyncio
from pathlib import Path
import sys

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from core.rag_system import RAGSystem
from core.feedback_manager import FeedbackManager
from models.request_models import UserInput, RecommendationRequest, RAGManifest


async def simulate_frontend_request():
    """Simulate a request from the frontend"""
    
    print("=== Simulating Frontend Request ===\n")
    
    # Initialize systems (in real app, this would be done at startup)
    feedback_manager = FeedbackManager()
    
    # Simulate the RAG system (without full document processing for demo)
    # In real app, this would be initialized with actual documents
    print("Initializing RAG system")
    print("(In production, this would process all documents)")
    print()
    
    # Simulate user input from frontend form
    user_input = UserInput(
        patient_condition="21 year old female with torn rotator cuff",
        desired_outcome="increase right shoulder abduction painless arc to 150° in 3-4 weeks",
        treatment_progression="progressed from 130° to 135° in week 1 with resistance band exercises, but progress stalled",
        age="21",
        gender="Female",
        diagnosis="Torn rotator cuff",
        severity="Moderate - affecting daily activities",
        date_of_onset="3 months ago",
        prior_level_of_function="Full overhead function for work and sports",
        work_life_requirements="Overhead lifting required for job, recreational volleyball player"
    )
    
    print("User Input:")
    print(f"  Condition: {user_input.patient_condition}")
    print(f"  Outcome: {user_input.desired_outcome}")
    print(f"  Diagnosis: {user_input.diagnosis}")
    print(f"  Severity: {user_input.severity}")
    print()
    
    # Create recommendation request
    request = RecommendationRequest(
        user_input=user_input,
        session_id="frontend_session_123",
        rag_manifest=RAGManifest(
            source_boosts={
                "note_ninjas": 1.0,
                "cpg": 0.8,
                "textbook": 0.6
            },
            header_boosts={
                "cpt": 1.2,
                "documentation": 1.1,
                "exercise": 1.0,
                "safety": 1.3
            }
        )
    )
    
    print("Request Configuration:")
    print(f"  Session ID: {request.session_id}")
    print(f"  Source Boosts: {request.rag_manifest.source_boosts}")
    print(f"  Header Boosts: {request.rag_manifest.header_boosts}")
    print()
    
    # Simulate recommendation generation
    print("Generating recommendations")
    print("(In production, this would use the full RAG system)")
    
    # Mock response (in real app, this comes from RAG system)
    mock_response = {
        "high_level": [
            "Prioritize progressive resistance training with emphasis on scapular stability and rotator cuff strengthening",
            "Focus on functional overhead movements with proper form and pain-free range"
        ],
        "subsections": [
            {
                "title": "Progressive Strengthening",
                "rationale": "Systematic progression from isometric to isotonic exercises supports rotator cuff healing",
                "exercises": [
                    {
                        "title": "Isometric External Rotation",
                        "description": "Hold arm at 90° elbow flexion, press against wall. 3 sets of 10 seconds, progress to 30 seconds",
                        "cues": [
                            "Keep elbow at side",
                            "Press outward against resistance",
                            "Maintain neutral spine"
                        ],
                        "documentation": "Instructed isometric external rotation exercises; patient performed 3x10 seconds with good form, no pain reported",
                        "cpt": "97530",
                        "notes": "Progress to resistance band when pain-free",
                        "sources": [
                            {
                                "type": "note_ninjas",
                                "id": "therapeutic_exercises",
                                "section": "rotator_cuff_strengthening",
                                "page": None,
                                "quote": "Isometric exercises provide early strengthening without compromising healing"
                            }
                        ]
                    },
                    {
                        "title": "Scapular Stabilization",
                        "description": "Wall slides with focus on scapular movement. 3 sets of 10 repetitions",
                        "cues": [
                            "Keep core engaged",
                            "Retract shoulder blades",
                            "Control the movement"
                        ],
                        "documentation": "Instructed scapular stabilization exercises; patient demonstrated improved scapular control with verbal cues",
                        "cpt": "97530",
                        "notes": None,
                        "sources": [
                            {
                                "type": "note_ninjas",
                                "id": "therapeutic_exercises",
                                "section": "scapular_stabilization",
                                "page": None,
                                "quote": "Scapular stabilization is fundamental to rotator cuff function"
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Functional Training",
                "rationale": "Task-specific training promotes carryover to daily activities and sports",
                "exercises": [
                    {
                        "title": "Overhead Reach Progression",
                        "description": "Gradual progression of overhead reaching. Start with cane assist, progress to free movement",
                        "cues": [
                            "Reach overhead slowly",
                            "Stop at pain threshold",
                            "Use cane for support initially"
                        ],
                        "documentation": "Instructed overhead reach progression; patient achieved 145° with cane assist, demonstrating improved range",
                        "cpt": "97110",
                        "notes": "Monitor for impingement signs",
                        "sources": [
                            {
                                "type": "note_ninjas",
                                "id": "functional_training",
                                "section": "overhead_activities",
                                "page": None,
                                "quote": "Progressive overhead training restores functional range"
                            }
                        ]
                    }
                ]
            }
        ],
        "suggested_alternatives": [
            {
                "when": "Pain persists with overhead activities",
                "instead_try": "Focus on pain-free range exercises and manual therapy for soft tissue restrictions",
                "sources": [
                    {
                        "type": "cpg",
                        "id": "rotator_cuff_guidelines",
                        "page": "p. 45",
                        "quote": "Pain-free exercise progression is essential for healing"
                    }
                ]
            }
        ],
        "confidence": "high"
    }
    
    print("Generated Response:")
    print(json.dumps(mock_response, indent=2))
    print()
    
    # Simulate user feedback
    print("Simulating user feedback")
    
    # Positive feedback
    feedback1 = feedback_manager.store_feedback(
        session_id="frontend_session_123",
        recommendation_id="rec_001",
        feedback_type="thumbs_up",
        feedback_data={
            "exercise": "Isometric External Rotation",
            "reason": "helpful"
        }
    )
    
    # Negative feedback with correction
    feedback2 = feedback_manager.store_feedback(
        session_id="frontend_session_123",
        recommendation_id="rec_002",
        feedback_type="correction",
        feedback_data={
            "exercise": "Overhead Reach Progression",
            "old_cpt": "97110",
            "corrected_cpt": "97530",
            "reason": "CPT mismatch"
        }
    )
    
    # Get updated feedback state
    feedback_state = feedback_manager.get_feedback_state("frontend_session_123")
    
    print("Feedback State:")
    print(f"  Session: {feedback_state.session_id}")
    print(f"  Total feedback: {len(feedback_state.feedback_entries)}")
    print(f"  Preferences: {feedback_state.preferences}")
    print(f"  CPT Corrections: {feedback_state.preferences.get('cpt_corrections', {})}")
    print()
    
    # Show how feedback would affect next request
    print("Next request would be modified based on feedback:")
    print("  - CPT corrections would be applied")
    print("  - User preferences would influence retrieval")
    print("  - Blocked content would be filtered")
    
    return mock_response


async def main():
    """Run the integration example"""
    print("=== Note Ninjas Backend Integration Example ===\n")
    
    try:
        response = await simulate_frontend_request()
        
        print("\n=== Integration Example Complete ===")
        print("\nTo integrate with your frontend:")
        print("1. Start the backend server: python run.py")
        print("2. Make HTTP requests to http://localhost:8000/recommendations")
        print("3. Handle responses and submit feedback")
        print("4. Use session management for user feedback")
        
    except Exception as e:
        print(f"Integration example failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
