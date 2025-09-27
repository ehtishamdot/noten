"""
Basic tests for Note Ninjas backend
"""

import pytest
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models.request_models import UserInput, RecommendationRequest
from models.response_models import RecommendationResponse, ConfidenceLevel
from core.document_processor import DocumentProcessorFactory
from core.feedback_manager import FeedbackManager


def test_user_input_validation():
    """Test UserInput model validation"""
    user_input = UserInput(
        patient_condition="21 year old female with torn rotator cuff",
        desired_outcome="increase right shoulder abduction to 150°",
        age="21",
        gender="Female",
        diagnosis="Torn rotator cuff"
    )
    
    assert user_input.patient_condition == "21 year old female with torn rotator cuff"
    assert user_input.desired_outcome == "increase right shoulder abduction to 150°"
    assert user_input.age == "21"


def test_recommendation_request():
    """Test RecommendationRequest model"""
    user_input = UserInput(
        patient_condition="Test condition",
        desired_outcome="Test outcome"
    )
    
    request = RecommendationRequest(
        user_input=user_input,
        session_id="test_session_123"
    )
    
    assert request.session_id == "test_session_123"
    assert request.user_input.patient_condition == "Test condition"


def test_document_processor_factory():
    """Test document processor factory"""
    factory = DocumentProcessorFactory()
    
    # Test PDF processor
    pdf_path = Path("test.pdf")
    processor = factory.get_processor(pdf_path)
    assert processor is not None
    assert processor.can_process(pdf_path)
    
    # Test DOCX processor
    docx_path = Path("test.docx")
    processor = factory.get_processor(docx_path)
    assert processor is not None
    assert processor.can_process(docx_path)


def test_feedback_manager():
    """Test feedback manager"""
    manager = FeedbackManager()
    
    # Test storing feedback
    feedback = manager.store_feedback(
        session_id="test_session",
        recommendation_id="rec_123",
        feedback_type="thumbs_up",
        feedback_data={"reason": "helpful"}
    )
    
    assert feedback.session_id == "test_session"
    assert feedback.feedback_type == "thumbs_up"
    
    # Test getting feedback state
    state = manager.get_feedback_state("test_session")
    assert state.session_id == "test_session"
    assert len(state.feedback_entries) == 1


def test_confidence_levels():
    """Test confidence level enum"""
    assert ConfidenceLevel.HIGH == "high"
    assert ConfidenceLevel.MEDIUM == "medium"
    assert ConfidenceLevel.LOW == "low"


if __name__ == "__main__":
    pytest.main([__file__])
