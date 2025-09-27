"""
Models package for Note Ninjas backend
"""

from .request_models import (
    RecommendationRequest,
    FeedbackRequest,
    RAGManifest,
    UserInput
)
from .response_models import (
    RecommendationResponse,
    FeedbackResponse,
    HealthResponse,
    Exercise,
    Subsection,
    Source,
    Alternative
)

__all__ = [
    "RecommendationRequest",
    "FeedbackRequest", 
    "RAGManifest",
    "UserInput",
    "RecommendationResponse",
    "FeedbackResponse",
    "HealthResponse",
    "Exercise",
    "Subsection",
    "Source",
    "Alternative"
]
