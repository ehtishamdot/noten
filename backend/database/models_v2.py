from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.models import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    cases = relationship("Case", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    
    # Input data
    input_simple = Column(JSONB, nullable=True)  # Simple input mode
    input_detailed = Column(JSONB, nullable=True)  # Detailed input mode
    
    # Progression output
    progression_output = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="cases")
    exercises = relationship("Exercise", back_populates="case", cascade="all, delete-orphan")

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    
    # Optional fields
    rationale = Column(Text, nullable=True)
    contraindications = Column(Text, nullable=True)
    progression_options = Column(Text, nullable=True)
    dosage_specifics = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    case = relationship("Case", back_populates="exercises")
    cues = relationship("Cue", back_populates="exercise", cascade="all, delete-orphan")
    documentation_examples = relationship("DocumentationExample", back_populates="exercise", cascade="all, delete-orphan")
    cpt_codes = relationship("CPTCode", back_populates="exercise", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="exercise", cascade="all, delete-orphan")

class Cue(Base):
    __tablename__ = "cues"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    cue_type = Column(String(50), nullable=True)  # 'Verbal', 'Tactile', 'Visual'
    cue_text = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    exercise = relationship("Exercise", back_populates="cues")
    feedback = relationship("Feedback", back_populates="cue", cascade="all, delete-orphan")

class DocumentationExample(Base):
    __tablename__ = "documentation_examples"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    example_text = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    exercise = relationship("Exercise", back_populates="documentation_examples")
    feedback = relationship("Feedback", back_populates="documentation_example", cascade="all, delete-orphan")

class CPTCode(Base):
    __tablename__ = "cpt_codes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    code = Column(String(10), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    exercise = relationship("Exercise", back_populates="cpt_codes")
    feedback = relationship("Feedback", back_populates="cpt_code", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # What is being given feedback on
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=True, index=True)
    cue_id = Column(UUID(as_uuid=True), ForeignKey("cues.id", ondelete="CASCADE"), nullable=True, index=True)
    documentation_example_id = Column(UUID(as_uuid=True), ForeignKey("documentation_examples.id", ondelete="CASCADE"), nullable=True, index=True)
    cpt_code_id = Column(UUID(as_uuid=True), ForeignKey("cpt_codes.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Feedback details
    feedback_type = Column(String(50), nullable=False)  # 'helpful', 'not_helpful', 'very_helpful', etc.
    rating = Column(Integer, nullable=True)  # 1-5 scale
    comment = Column(Text, nullable=True)
    
    # Additional context
    feedback_scope = Column(String(50), nullable=False)  # 'exercise', 'cue', 'documentation', 'cpt_code'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="feedback")
    exercise = relationship("Exercise", back_populates="feedback")
    cue = relationship("Cue", back_populates="feedback")
    documentation_example = relationship("DocumentationExample", back_populates="feedback")
    cpt_code = relationship("CPTCode", back_populates="feedback")
