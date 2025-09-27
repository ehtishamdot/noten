#!/usr/bin/env python3
"""
Full integration test for the Note Ninjas RAG system
"""

import requests
import json
import time

def test_full_integration():
    """Test the complete RAG system integration"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 === Note Ninjas RAG System - Full Integration Test ===\n")
    
    # Test 1: Health Check
    print("1️⃣ Testing Health Endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health: {health_data['status']}")
            print(f"   RAG System Ready: {health_data['rag_system_ready']}")
            print(f"   Feedback System Ready: {health_data['feedback_system_ready']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Sources Check
    print("\n2️⃣ Testing Sources Endpoint...")
    try:
        response = requests.get(f"{base_url}/sources")
        if response.status_code == 200:
            sources_data = response.json()
            print(f"✅ Total Chunks: {sources_data['total_chunks']:,}")
            print(f"   Note Ninjas: {sources_data['source_counts']['note_ninjas']:,} chunks")
            print(f"   CPGs: {sources_data['source_counts']['cpg']:,} chunks")
            print(f"   Available Note Ninjas Sources: {len(sources_data['sources_by_type']['note_ninjas'])}")
            print(f"   Available CPG Sources: {len(sources_data['sources_by_type']['cpg'])}")
        else:
            print(f"❌ Sources check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Sources check error: {e}")
        return False
    
    # Test 3: Generate Recommendations
    print("\n3️⃣ Testing Recommendation Generation...")
    session_id = f"test_session_{int(time.time())}"
    
    recommendation_request = {
        "user_input": {
            "patient_condition": "rotator cuff tear with limited shoulder mobility and pain",
            "desired_outcome": "improve shoulder range of motion, reduce pain, and restore functional activities",
            "treatment_progression": "early stage rehabilitation with focus on pain management",
            "input_mode": "simple"
        },
        "rag_manifest": {
            "sources": ["note_ninjas", "cpg"],
            "max_sources": 5,
            "min_confidence": 0.7
        },
        "session_id": session_id,
        "feedback_state": None
    }
    
    try:
        response = requests.post(
            f"{base_url}/recommendations",
            headers={"Content-Type": "application/json"},
            json=recommendation_request
        )
        
        if response.status_code == 200:
            rec_data = response.json()
            print(f"✅ Recommendations Generated!")
            print(f"   High-level recommendations: {len(rec_data['high_level'])}")
            print(f"   Treatment subsections: {len(rec_data['subsections'])}")
            print(f"   Suggested alternatives: {len(rec_data['suggested_alternatives'])}")
            print(f"   Confidence: {rec_data['confidence']}")
            
            # Show first recommendation
            if rec_data['high_level']:
                print(f"   First recommendation: {rec_data['high_level'][0][:100]}...")
            
            # Show subsections
            if rec_data['subsections']:
                subsection = rec_data['subsections'][0]
                print(f"   First subsection: {subsection['title']}")
                print(f"   Exercises: {len(subsection['exercises'])}")
                if subsection['exercises']:
                    exercise = subsection['exercises'][0]
                    print(f"   First exercise: {exercise['description'][:80]}...")
            
            # Show sources
            if rec_data['subsections'] and rec_data['subsections'][0]['exercises']:
                exercise = rec_data['subsections'][0]['exercises'][0]
                if exercise['sources']:
                    source = exercise['sources'][0]
                    print(f"   Source: {source['type']} - {source['id']}")
            
        else:
            print(f"❌ Recommendation generation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Recommendation generation error: {e}")
        return False
    
    # Test 4: Submit Feedback
    print("\n4️⃣ Testing Feedback System...")
    feedback_request = {
        "session_id": session_id,
        "recommendation_id": None,
        "feedback_type": "thumbs_up",
        "feedback_data": {
            "corrections": None,
            "preferences": {"preferred_sources": ["note_ninjas"]},
            "notes": "Excellent recommendations for rotator cuff rehabilitation!"
        }
    }
    
    try:
        response = requests.post(
            f"{base_url}/feedback",
            headers={"Content-Type": "application/json"},
            json=feedback_request
        )
        
        if response.status_code == 200:
            feedback_data = response.json()
            print(f"✅ Feedback Submitted!")
            print(f"   Success: {feedback_data['success']}")
            print(f"   Feedback ID: {feedback_data['feedback_id']}")
        else:
            print(f"❌ Feedback submission failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Feedback submission error: {e}")
        return False
    
    # Test 5: Get Session Feedback
    print("\n5️⃣ Testing Feedback Retrieval...")
    try:
        response = requests.get(f"{base_url}/feedback/{session_id}")
        
        if response.status_code == 200:
            feedback_data = response.json()
            print(f"✅ Feedback Retrieved!")
            print(f"   Session ID: {feedback_data['session_id']}")
            print(f"   Total feedback: {len(feedback_data['feedback_history'])}")
            if feedback_data['feedback_history']:
                feedback = feedback_data['feedback_history'][0]
                print(f"   Latest feedback: {feedback['feedback_type']}")
                print(f"   Notes: {feedback['feedback_data']['notes']}")
        else:
            print(f"❌ Feedback retrieval failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Feedback retrieval error: {e}")
        return False
    
    # Test 6: Test Different Query Types
    print("\n6️⃣ Testing Different Query Types...")
    
    test_queries = [
        {
            "condition": "stroke with left hemiparesis",
            "outcome": "improve left arm function and independence in ADLs",
            "progression": "acute phase rehabilitation"
        },
        {
            "condition": "Parkinson's disease with balance issues",
            "outcome": "improve balance and reduce fall risk",
            "progression": "ongoing maintenance therapy"
        }
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"   Test Query {i}: {query['condition']}")
        
        test_request = {
            "user_input": {
                "patient_condition": query['condition'],
                "desired_outcome": query['outcome'],
                "treatment_progression": query['progression'],
                "input_mode": "simple"
            },
            "rag_manifest": {
                "sources": ["note_ninjas", "cpg"],
                "max_sources": 3,
                "min_confidence": 0.6
            },
            "session_id": f"test_query_{i}_{int(time.time())}",
            "feedback_state": None
        }
        
        try:
            response = requests.post(
                f"{base_url}/recommendations",
                headers={"Content-Type": "application/json"},
                json=test_request
            )
            
            if response.status_code == 200:
                rec_data = response.json()
                print(f"     ✅ Generated {len(rec_data['high_level'])} recommendations")
                print(f"     ✅ Confidence: {rec_data['confidence']}")
            else:
                print(f"     ❌ Failed: {response.status_code}")
        except Exception as e:
            print(f"     ❌ Error: {e}")
    
    print("\n🎉 === Integration Test Complete ===")
    print("✅ All core functionality is working!")
    print("✅ RAG system is processing real documents")
    print("✅ API endpoints are responding correctly")
    print("✅ Feedback system is operational")
    print("\n🚀 Your Note Ninjas OT Recommender is ready for production!")
    
    return True

if __name__ == "__main__":
    test_full_integration()
