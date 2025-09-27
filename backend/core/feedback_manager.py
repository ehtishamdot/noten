"""
Feedback management system for session-based feedback handling
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import uuid
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum

from models.request_models import FeedbackType

logger = logging.getLogger(__name__)


class FeedbackStorageType(str, Enum):
    """Feedback storage types"""
    MEMORY = "memory"
    FILE = "file"
    DATABASE = "database"


@dataclass
class FeedbackEntry:
    """Individual feedback entry"""
    feedback_id: str
    session_id: str
    recommendation_id: Optional[str]
    feedback_type: str
    feedback_data: Dict[str, Any]
    comment: Optional[str]
    timestamp: datetime
    processed: bool = False


@dataclass
class FeedbackState:
    """Session feedback state"""
    session_id: str
    feedback_entries: List[FeedbackEntry]
    preferences: Dict[str, Any]
    blocked_cpts: List[str]
    blocked_exercises: List[str]
    preferred_sources: List[str]
    last_updated: datetime


class FeedbackManager:
    """Manages user feedback and session state"""
    
    def __init__(self, storage_type: str = "memory", storage_path: Optional[str] = None):
        self.storage_type = FeedbackStorageType(storage_type)
        self.storage_path = Path(storage_path) if storage_path else Path("./feedback_storage")
        
        # In-memory storage
        self.feedback_states: Dict[str, FeedbackState] = {}
        
        # Initialize storage
        if self.storage_type == FeedbackStorageType.FILE:
            self.storage_path.mkdir(parents=True, exist_ok=True)
    
    def store_feedback(
        self,
        session_id: str,
        recommendation_id: Optional[str],
        feedback_type: str,
        feedback_data: Dict[str, Any],
        comment: Optional[str] = None
    ) -> FeedbackEntry:
        """Store user feedback"""
        
        # Create feedback entry
        feedback_entry = FeedbackEntry(
            feedback_id=str(uuid.uuid4()),
            session_id=session_id,
            recommendation_id=recommendation_id,
            feedback_type=feedback_type,
            feedback_data=feedback_data,
            comment=comment,
            timestamp=datetime.now()
        )
        
        # Get or create feedback state for session
        feedback_state = self.get_feedback_state(session_id)
        
        # Add feedback entry
        feedback_state.feedback_entries.append(feedback_entry)
        feedback_state.last_updated = datetime.now()
        
        # Process feedback for preferences
        self._process_feedback_entry(feedback_entry, feedback_state)
        
        # Save to storage
        self._save_feedback_state(feedback_state)
        
        logger.info(f"Stored feedback {feedback_entry.feedback_id} for session {session_id}")
        
        return feedback_entry
    
    def get_feedback_state(self, session_id: str) -> FeedbackState:
        """Get feedback state for session"""
        
        if session_id in self.feedback_states:
            return self.feedback_states[session_id]
        
        # Try to load from storage
        feedback_state = self._load_feedback_state(session_id)
        
        if feedback_state:
            self.feedback_states[session_id] = feedback_state
            return feedback_state
        
        # Create new feedback state
        feedback_state = FeedbackState(
            session_id=session_id,
            feedback_entries=[],
            preferences={},
            blocked_cpts=[],
            blocked_exercises=[],
            preferred_sources=[],
            last_updated=datetime.now()
        )
        
        self.feedback_states[session_id] = feedback_state
        return feedback_state
    
    def _process_feedback_entry(self, feedback_entry: FeedbackEntry, feedback_state: FeedbackState):
        """Process feedback entry to extract preferences"""
        
        feedback_data = feedback_entry.feedback_data
        
        # Process different types of feedback
        if feedback_entry.feedback_type == FeedbackType.THUMBS_DOWN:
            # Extract reasons for thumbs down
            if "reason" in feedback_data:
                reason = feedback_data["reason"]
                
                if "too_advanced" in reason:
                    feedback_state.preferences["difficulty"] = "easier"
                elif "too_basic" in reason:
                    feedback_state.preferences["difficulty"] = "harder"
                elif "cpt_mismatch" in reason:
                    if "cpt_code" in feedback_data:
                        feedback_state.blocked_cpts.append(feedback_data["cpt_code"])
        
        elif feedback_entry.feedback_type == FeedbackType.CORRECTION:
            # Process corrections
            if "corrected_cpt" in feedback_data:
                old_cpt = feedback_data.get("old_cpt")
                new_cpt = feedback_data["corrected_cpt"]
                
                if old_cpt and old_cpt in feedback_state.blocked_cpts:
                    feedback_state.blocked_cpts.remove(old_cpt)
                
                feedback_state.preferences["cpt_corrections"] = feedback_state.preferences.get(
                    "cpt_corrections", {}
                )
                feedback_state.preferences["cpt_corrections"][old_cpt] = new_cpt
        
        elif feedback_entry.feedback_type == FeedbackType.PREFERENCE:
            # Process preferences
            if "preference_type" in feedback_data:
                pref_type = feedback_data["preference_type"]
                pref_value = feedback_data["preference_value"]
                
                feedback_state.preferences[pref_type] = pref_value
        
        elif feedback_entry.feedback_type == FeedbackType.BLOCK:
            # Process blocks
            if "blocked_content" in feedback_data:
                blocked = feedback_data["blocked_content"]
                
                if "cpt" in blocked:
                    feedback_state.blocked_cpts.append(blocked["cpt"])
                elif "exercise" in blocked:
                    feedback_state.blocked_exercises.append(blocked["exercise"])
                elif "source" in blocked:
                    if blocked["source"] not in feedback_state.preferred_sources:
                        feedback_state.preferred_sources.append(blocked["source"])
    
    def apply_feedback_to_request(
        self,
        feedback_state: FeedbackState,
        request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply feedback to modify request parameters"""
        
        modified_request = request_data.copy()
        
        # Apply difficulty preferences
        if "difficulty" in feedback_state.preferences:
            difficulty = feedback_state.preferences["difficulty"]
            if "rag_manifest" not in modified_request:
                modified_request["rag_manifest"] = {}
            
            if "topic_boosts" not in modified_request["rag_manifest"]:
                modified_request["rag_manifest"]["topic_boosts"] = {}
            
            if difficulty == "easier":
                modified_request["rag_manifest"]["topic_boosts"]["beginner"] = 1.2
                modified_request["rag_manifest"]["topic_boosts"]["basic"] = 1.1
            elif difficulty == "harder":
                modified_request["rag_manifest"]["topic_boosts"]["advanced"] = 1.2
                modified_request["rag_manifest"]["topic_boosts"]["complex"] = 1.1
        
        # Apply source preferences
        if feedback_state.preferred_sources:
            if "rag_manifest" not in modified_request:
                modified_request["rag_manifest"] = {}
            
            if "source_boosts" not in modified_request["rag_manifest"]:
                modified_request["rag_manifest"]["source_boosts"] = {}
            
            # Boost preferred sources
            for source in feedback_state.preferred_sources:
                modified_request["rag_manifest"]["source_boosts"][source] = 1.2
        
        return modified_request
    
    def filter_recommendations(
        self,
        feedback_state: FeedbackState,
        recommendations: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Filter recommendations based on feedback"""
        
        filtered_recommendations = recommendations.copy()
        
        # Filter out blocked CPTs
        if feedback_state.blocked_cpts:
            filtered_exercises = []
            
            for subsection in filtered_recommendations.get("subsections", []):
                filtered_subsection_exercises = []
                
                for exercise in subsection.get("exercises", []):
                    if exercise.get("cpt") not in feedback_state.blocked_cpts:
                        filtered_subsection_exercises.append(exercise)
                    else:
                        # Add note about filtering
                        if "notes" not in exercise:
                            exercise["notes"] = ""
                        exercise["notes"] += " (Filtered based on previous feedback)"
                
                subsection["exercises"] = filtered_subsection_exercises
                filtered_exercises.extend(filtered_subsection_exercises)
        
        # Filter out blocked exercises
        if feedback_state.blocked_exercises:
            for subsection in filtered_recommendations.get("subsections", []):
                subsection["exercises"] = [
                    ex for ex in subsection.get("exercises", [])
                    if ex.get("title") not in feedback_state.blocked_exercises
                ]
        
        # Apply CPT corrections
        cpt_corrections = feedback_state.preferences.get("cpt_corrections", {})
        if cpt_corrections:
            for subsection in filtered_recommendations.get("subsections", []):
                for exercise in subsection.get("exercises", []):
                    current_cpt = exercise.get("cpt")
                    if current_cpt in cpt_corrections:
                        exercise["cpt"] = cpt_corrections[current_cpt]
                        if "notes" not in exercise:
                            exercise["notes"] = ""
                        exercise["notes"] += f" (CPT corrected from {current_cpt})"
        
        return filtered_recommendations
    
    def clear_feedback(self, session_id: str):
        """Clear all feedback for a session"""
        
        if session_id in self.feedback_states:
            del self.feedback_states[session_id]
        
        # Remove from storage
        if self.storage_type == FeedbackStorageType.FILE:
            feedback_file = self.storage_path / f"{session_id}.json"
            if feedback_file.exists():
                feedback_file.unlink()
        
        logger.info(f"Cleared feedback for session {session_id}")
    
    def _save_feedback_state(self, feedback_state: FeedbackState):
        """Save feedback state to storage"""
        
        if self.storage_type == FeedbackStorageType.MEMORY:
            # Already stored in memory
            return
        
        elif self.storage_type == FeedbackStorageType.FILE:
            feedback_file = self.storage_path / f"{feedback_state.session_id}.json"
            
            # Convert to serializable format
            data = {
                "session_id": feedback_state.session_id,
                "feedback_entries": [
                    {
                        **asdict(entry),
                        "timestamp": entry.timestamp.isoformat()
                    }
                    for entry in feedback_state.feedback_entries
                ],
                "preferences": feedback_state.preferences,
                "blocked_cpts": feedback_state.blocked_cpts,
                "blocked_exercises": feedback_state.blocked_exercises,
                "preferred_sources": feedback_state.preferred_sources,
                "last_updated": feedback_state.last_updated.isoformat()
            }
            
            with open(feedback_file, 'w') as f:
                json.dump(data, f, indent=2)
    
    def _load_feedback_state(self, session_id: str) -> Optional[FeedbackState]:
        """Load feedback state from storage"""
        
        if self.storage_type == FeedbackStorageType.FILE:
            feedback_file = self.storage_path / f"{session_id}.json"
            
            if not feedback_file.exists():
                return None
            
            try:
                with open(feedback_file, 'r') as f:
                    data = json.load(f)
                
                # Convert back to FeedbackState
                feedback_entries = []
                for entry_data in data["feedback_entries"]:
                    entry = FeedbackEntry(
                        feedback_id=entry_data["feedback_id"],
                        session_id=entry_data["session_id"],
                        recommendation_id=entry_data["recommendation_id"],
                        feedback_type=entry_data["feedback_type"],
                        feedback_data=entry_data["feedback_data"],
                        comment=entry_data["comment"],
                        timestamp=datetime.fromisoformat(entry_data["timestamp"])
                    )
                    feedback_entries.append(entry)
                
                feedback_state = FeedbackState(
                    session_id=data["session_id"],
                    feedback_entries=feedback_entries,
                    preferences=data["preferences"],
                    blocked_cpts=data["blocked_cpts"],
                    blocked_exercises=data["blocked_exercises"],
                    preferred_sources=data["preferred_sources"],
                    last_updated=datetime.fromisoformat(data["last_updated"])
                )
                
                return feedback_state
                
            except Exception as e:
                logger.error(f"Error loading feedback state for {session_id}: {e}")
                return None
        
        return None
