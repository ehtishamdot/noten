#!/usr/bin/env python3
"""
Test script to verify OpenAI embeddings integration
This script tests the configuration and basic functionality without running the full system.
"""

import os
import asyncio
import logging
from openai import OpenAI

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_openai_embeddings():
    """Test OpenAI embeddings functionality"""
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY environment variable not set")
        logger.info("Please set your OpenAI API key:")
        logger.info("export OPENAI_API_KEY='your-key-here'")
        return False
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)
        
        # Test embedding generation
        test_texts = [
            "Physical therapy exercise for shoulder rehabilitation",
            "Patient needs help with range of motion exercises",
            "Document CPT codes for billing purposes"
        ]
        
        model = "text-embedding-3-small"
        logger.info(f"Testing OpenAI embeddings with model: {model}")
        
        response = client.embeddings.create(
            input=test_texts,
            model=model
        )
        
        # Verify results
        embeddings = [data.embedding for data in response.data]
        
        logger.info("✅ OpenAI embeddings test successful!")
        logger.info(f"Generated {len(embeddings)} embeddings")
        logger.info(f"Embedding dimensions: {len(embeddings[0])}")
        logger.info(f"Model used: {response.model}")
        logger.info(f"Usage: {response.usage}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ OpenAI embeddings test failed: {e}")
        return False


async def test_config():
    """Test configuration loading"""
    try:
        from config import settings
        
        logger.info("Testing configuration...")
        logger.info(f"USE_OPENAI_EMBEDDINGS: {settings.USE_OPENAI_EMBEDDINGS}")
        logger.info(f"OPENAI_EMBEDDING_MODEL: {settings.OPENAI_EMBEDDING_MODEL}")
        logger.info(f"OPENAI_API_KEY set: {bool(settings.OPENAI_API_KEY)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Configuration test failed: {e}")
        return False


async def main():
    """Main test function"""
    logger.info("🧪 Testing OpenAI Embeddings Integration")
    logger.info("=" * 50)
    
    # Test configuration
    config_ok = await test_config()
    
    if not config_ok:
        logger.error("Configuration test failed. Please check your settings.")
        return
    
    # Test OpenAI embeddings
    embeddings_ok = await test_openai_embeddings()
    
    if embeddings_ok:
        logger.info("=" * 50)
        logger.info("🎉 ALL TESTS PASSED!")
        logger.info("Your OpenAI embeddings integration is ready to use.")
        logger.info("=" * 50)
    else:
        logger.error("=" * 50)
        logger.error("❌ TESTS FAILED!")
        logger.error("Please check your OpenAI API key and internet connection.")
        logger.error("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())