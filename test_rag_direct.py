Direct test of the RAG system without the server
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from core.rag_system import RAGSystem
from models.request_models import UserInput, RAGManifest
from config import settings


async def test_rag_direct():
    """Test the RAG system directly"""
    
    print("=== Direct RAG System Test ===")
    
    # Initialize RAG system
    print("Initializing RAG system")
    rag = RAGSystem(
        note_ninjas_path=settings.NOTE_NINJAS_PATH,
        cpg_paths=settings.CPG_PATHS,
        vector_store_path=settings.VECTOR_STORE_PATH
    )
    
    print("Loading RAG system")
    await rag.initialize()
    print("✓ RAG system initialized!")
    
    # Test query
    test_query = "rotator cuff tear treatment exercises"
    print(f"\nTesting query: '{test_query}'")
    
    # Create request
    user_input = UserInput(
        patient_condition="21 year old female with torn rotator cuff",
        desired_outcome="increase right shoulder abduction to 150°",
        diagnosis="Torn rotator cuff",
        severity="Moderate"
    )
    
    rag_manifest = RAGManifest(
        max_exercises=5,
        include_cpt_codes=True,
        include_alternatives=True
    )
    
    print("Generating recommendations")
    try:
        response = await rag.generate_recommendations(
            user_input=user_input,
            rag_manifest=rag_manifest
        )
        
        print("✓ Recommendations generated ")
        print(f"High-level recommendations: {len(response.high_level)}")
        print(f"Subsections: {len(response.subsections)}")
        print(f"Alternatives: {len(response.suggested_alternatives)}")
        print(f"Confidence: {response.confidence}")
        
        # Show first high-level recommendation
        if response.high_level:
            print(f"\nFirst recommendation: {response.high_level[0]}")
        
        # Show first subsection
        if response.subsections:
            subsection = response.subsections[0]
            print(f"\nFirst subsection: {subsection.title}")
            print(f"Exercises: {len(subsection.exercises)}")
            if subsection.exercises:
                exercise = subsection.exercises[0]
                print(f"First exercise: {exercise.description[:100]}")
                print(f"Description: {exercise.description[:100]}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Main function"""
    success = await test_rag_direct()
    
    if success:
        print("\n🎉 RAG System Test PASSED!")
        print("Your backend is working correctly with real documents!")
    else:
        print("\n❌ RAG System Test FAILED!")
        print("Please check the error messages above.")


if __name__ == "__main__":
    asyncio.run(main())
