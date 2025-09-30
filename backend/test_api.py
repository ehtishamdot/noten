Simple API test to verify the RAG system works
"""

import requests
import json
import time

def test_api():
    """Test the API endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("Testing Note Ninjas API")
    
    # Test health endpoint
    print("\n1. Testing health endpoint")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test sources endpoint
    print("\n2. Testing sources endpoint")
    try:
        response = requests.get(f"{base_url}/sources")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            sources = response.json()
            print(f"Sources: {sources}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test recommendations endpoint
    print("\n3. Testing recommendations endpoint")
    test_request = {
        "user_input": {
            "patient_condition": "21 year old female with torn rotator cuff",
            "desired_outcome": "increase right shoulder abduction to 150°",
            "diagnosis": "Torn rotator cuff",
            "severity": "Moderate"
        },
        "session_id": "test_session_123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/recommendations",
            json=test_request,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            recommendations = response.json()
            print(f"Recommendations received: {len(recommendations.get('subsections', []))} subsections")
            print(f"High-level: {recommendations.get('high_level', [])}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
