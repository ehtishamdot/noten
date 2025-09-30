#!/usr/bin/env python3
"""
One-time embedding generation script for Note Ninjas.
Run this script once to generate embeddings, then they will be reused.
"""

import asyncio
import logging
from pathlib import Path
from typing import List

from core.document_processor import DocumentProcessorFactory, DocumentChunk
from core.retriever import Retriever
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def process_documents(note_ninjas_path: str, cpg_paths: List[str]) -> List[DocumentChunk]:
    """Process all documents in the corpus"""
    logger.info("Processing documents")
    
    document_processor = DocumentProcessorFactory()
    all_chunks = []
    
    # Process Note Ninjas documents
    note_ninjas_path = Path(note_ninjas_path)
    logger.info(f"Processing Note Ninjas documents from {note_ninjas_path}")
    
    note_ninjas_docs = []
    for file_path in note_ninjas_path.glob("*.docx"):
        try:
            note_ninjas_docs.extend(
                document_processor.process_file(file_path)
            )
        except Exception as e:
            logger.error(f"Error processing Note Ninjas document {file_path}: {e}")
    
    logger.info(f"Processed {len(note_ninjas_docs)} Note Ninjas chunks")
    all_chunks.extend(note_ninjas_docs)
    
    # Process CPG documents
    cpg_chunks_count = 0
    for cpg_path_str in cpg_paths:
        cpg_path = Path(cpg_path_str)
        logger.info(f"Processing CPG documents from {cpg_path}")
        
        cpg_docs = []
        for file_path in cpg_path.glob("*.pdf"):
            try:
                cpg_docs.extend(
                    document_processor.process_file(file_path)
                )
            except Exception as e:
                logger.error(f"Error processing PDF {file_path}: {e}")
        
        cpg_chunks_count += len(cpg_docs)
        all_chunks.extend(cpg_docs)
    
    logger.info(f"Processed {cpg_chunks_count} CPG chunks")
    logger.info(f"Total processed chunks: {len(all_chunks)}")
    
    return all_chunks


async def generate_embeddings_once():
    """Generate embeddings once and save them to disk"""
    logger.info("Starting one-time embedding generation")
    
    try:
        # Process all documents
        chunks = await process_documents(
            note_ninjas_path=settings.NOTE_NINJAS_PATH,
            cpg_paths=settings.CPG_PATHS
        )
        
        if not chunks:
            logger.error("No documents were processed. Check your paths and files.")
            return False
        
        # Initialize retriever
        retriever = Retriever(vector_store_path=settings.VECTOR_STORE_PATH)
        
        # Force regeneration by removing existing files first
        vector_store_path = Path(settings.VECTOR_STORE_PATH)
        embeddings_file = vector_store_path / "embeddings.pkl"
        metadata_file = vector_store_path / "chunks.json"
        
        if embeddings_file.exists():
            logger.info("Removing existing embeddings file")
            embeddings_file.unlink()
        
        if metadata_file.exists():
            logger.info("Removing existing metadata file")
            metadata_file.unlink()
        
        # Initialize retriever (this will generate embeddings)
        retriever.initialize(chunks)
        
        logger.info("✅ Embeddings generated and saved")
        logger.info(f"📁 Location: {settings.VECTOR_STORE_PATH}")
        logger.info(f"📊 Total chunks: {len(chunks)}")
        
        # Verify files were created
        if embeddings_file.exists() and metadata_file.exists():
            logger.info("✅ Verified: Embedding files created")
            return True
        else:
            logger.error("❌ Error: Embedding files were not created properly")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error generating embeddings: {e}")
        return False


def main():
    """Main function"""
    print("🚀 Note Ninjas - One-Time Embedding Generation")
    print("=" * 50)
    
    # Check if embeddings already exist
    vector_store_path = Path(settings.VECTOR_STORE_PATH)
    embeddings_file = vector_store_path / "embeddings.pkl"
    metadata_file = vector_store_path / "chunks.json"
    
    if embeddings_file.exists() and metadata_file.exists():
        response = input("⚠️  Embeddings already exist. Regenerate? (y/N): ")
        if response.lower() not in ['y', 'yes']:
            print("🔄 Keeping existing embeddings. No action taken.")
            return
    
    # Run the async function
    success = asyncio.run(generate_embeddings_once())
    
    if success:
        print("\n🎉 SUCCESS!")
        print("Your embeddings are ready. Now you can start the server and it will use the pre-generated embeddings.")
        print("\nTo start the server:")
        print("  python main.py")
        print("  # or")
        print("  uvicorn main:app --host 0.0.0.0 --port 8002 --reload")
    else:
        print("\n❌ FAILED!")
        print("Please check the logs above for error details.")


if __name__ == "__main__":
    main()