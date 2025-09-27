#!/usr/bin/env python3
"""
Demo script for Note Ninjas backend
Tests the basic functionality without starting the full server
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from core.document_processor import DocumentProcessorFactory
from core.feedback_manager import FeedbackManager
from models.request_models import UserInput, RecommendationRequest


async def test_document_processing():
    """Test document processing functionality"""
    print("Testing document processing...")
    
    factory = DocumentProcessorFactory()
    
    # Test with a sample text file
    sample_text = """
    Therapeutic Exercise for Rotator Cuff
    ====================================
    
    Exercise 1: Pendulum Exercise
    - Lean forward and let arm hang
    - Move arm in small circles
    - 10 reps each direction
    
    CPT Code: 97530
    
    Exercise 2: Wall Slides
    - Stand with back to wall
    - Slide arms up wall
    - Hold for 5 seconds
    - 10 repetitions
    
    Documentation: Instructed pendulum exercises for rotator cuff strengthening.
    Patient performed with minimal assistance and demonstrated good form.
    """
    
    # Create a temporary text file
    test_file = backend_dir / "test_sample.txt"
    with open(test_file, 'w') as f:
        f.write(sample_text)
    
    try:
        # Process the file
        chunks = factory.process_file(test_file)
        
        print(f"Processed {len(chunks)} chunks")
        for i, chunk in enumerate(chunks):
            print(f"Chunk {i+1}:")
            print(f"  Title: {chunk.title}")
            print(f"  Source: {chunk.source_type}")
            print(f"  Content: {chunk.content[:100]}...")
            print()
        
        return chunks
        
    finally:
        # Clean up
        if test_file.exists():
            test_file.unlink()


def test_feedback_system():
    """Test feedback management"""
    print("Testing feedback system...")
    
    manager = FeedbackManager()
    
    # Store some feedback
    feedback1 = manager.store_feedback(
        session_id="demo_session",
        recommendation_id="rec_001",
        feedback_type="thumbs_up",
        feedback_data={"reason": "helpful", "exercise": "pendulum"}
    )
    
    feedback2 = manager.store_feedback(
        session_id="demo_session",
        recommendation_id="rec_002",
        feedback_type="thumbs_down",
        feedback_data={"reason": "too_advanced", "exercise": "wall_slides"}
    )
    
    # Get feedback state
    state = manager.get_feedback_state("demo_session")
    
    print(f"Session: {state.session_id}")
    print(f"Feedback entries: {len(state.feedback_entries)}")
    print(f"Preferences: {state.preferences}")
    print(f"Blocked exercises: {state.blocked_exercises}")
    
    return state


def test_models():
    """Test Pydantic models"""
    print("Testing models...")
    
    # Test UserInput
    user_input = UserInput(
        patient_condition="21 year old female with torn rotator cuff",
        desired_outcome="increase right shoulder abduction to 150°",
        age="21",
        gender="Female",
        diagnosis="Torn rotator cuff",
        severity="Moderate - affecting daily activities"
    )
    
    print(f"User Input:")
    print(f"  Condition: {user_input.patient_condition}")
    print(f"  Outcome: {user_input.desired_outcome}")
    print(f"  Diagnosis: {user_input.diagnosis}")
    
    # Test RecommendationRequest
    request = RecommendationRequest(
        user_input=user_input,
        session_id="demo_session_123"
    )
    
    print(f"Request:")
    print(f"  Session ID: {request.session_id}")
    print(f"  Max exercises: {request.max_exercises}")
    
    return request


async def main():
    """Run all tests"""
    print("=== Note Ninjas Backend Demo ===\n")
    
    try:
        # Test models
        request = test_models()
        print()
        
        # Test feedback system
        feedback_state = test_feedback_system()
        print()
        
        # Test document processing
        chunks = await test_document_processing()
        print()
        
        print("=== Demo completed successfully! ===")
        print("\nTo start the full server, run:")
        print("  python run.py")
        print("\nOr with uvicorn:")
        print("  uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        
    except Exception as e:
        print(f"Demo failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
