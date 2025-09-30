#!/usr/bin/env python3
"""
Document processing script to build the RAG system with real documents
"""

import asyncio
import sys
import logging
from pathlib import Path
import json
import time

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from core.document_processor import DocumentProcessorFactory
from core.retriever import Retriever
from core.reranker import Reranker
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def process_documents():
    """Process all documents and build the RAG system"""
    
    logger.info("Starting document processing for Note Ninjas RAG system")
    
    # Initialize document processor
    processor_factory = DocumentProcessorFactory()
    
    # Process Note Ninjas documents
    logger.info("Processing Note Ninjas documents")
    note_ninjas_path = Path(settings.NOTE_NINJAS_PATH)
    note_ninjas_chunks = []
    
    if note_ninjas_path.exists():
        docx_files = list(note_ninjas_path.glob("**/*.docx"))
        logger.info(f"Found {len(docx_files)} DOCX files in Note Ninjas")
        
        for i, file_path in enumerate(docx_files):
            logger.info(f"Processing {i+1}/{len(docx_files)}: {file_path.name}")
            try:
                chunks = processor_factory.process_file(file_path)
                # Update source type to note_ninjas
                for chunk in chunks:
                    chunk.source_type = "note_ninjas"
                note_ninjas_chunks.extend(chunks)
                logger.info(f"  -> Generated {len(chunks)} chunks")
            except Exception as e:
                logger.error(f"  -> Error processing {file_path.name}: {e}")
    else:
        logger.warning(f"Note Ninjas path not found: {note_ninjas_path}")
    
    logger.info(f"Total Note Ninjas chunks: {len(note_ninjas_chunks)}")
    
    # Process CPG documents
    logger.info("Processing CPG documents")
    cpg_chunks = []
    
    for cpg_path in settings.CPG_PATHS:
        cpg_dir = Path(cpg_path)
        if cpg_dir.exists():
            pdf_files = list(cpg_dir.glob("**/*.pdf"))
            logger.info(f"Found {len(pdf_files)} PDF files in {cpg_dir.name}")
            
            # Process a subset for demo (first 10 files)
            sample_files = pdf_files[:10]
            logger.info(f"Processing sample of {len(sample_files)} files for demo")
            
            for i, file_path in enumerate(sample_files):
                logger.info(f"Processing {i+1}/{len(sample_files)}: {file_path.name}")
                try:
                    chunks = processor_factory.process_file(file_path)
                    # Update source type to cpg
                    for chunk in chunks:
                        chunk.source_type = "cpg"
                    cpg_chunks.extend(chunks)
                    logger.info(f"  -> Generated {len(chunks)} chunks")
                except Exception as e:
                    logger.error(f"  -> Error processing {file_path.name}: {e}")
        else:
            logger.warning(f"CPG path not found: {cpg_dir}")
    
    logger.info(f"Total CPG chunks: {len(cpg_chunks)}")
    
    # Combine all chunks
    all_chunks = note_ninjas_chunks + cpg_chunks
    logger.info(f"Total chunks processed: {len(all_chunks)}")
    
    if len(all_chunks) == 0:
        logger.error("No chunks were processed. Please check your document paths.")
        return
    
    # Save chunks metadata
    chunks_metadata = []
    for chunk in all_chunks:
        chunks_metadata.append({
            "chunk_id": chunk.chunk_id,
            "source_type": chunk.source_type,
            "source_id": chunk.source_id,
            "title": chunk.title,
            "headers": chunk.headers,
            "page_ref": chunk.page_ref,
            "content_length": len(chunk.content)
        })
    
    # Save metadata to file
    metadata_file = backend_dir / "processed_chunks_metadata.json"
    with open(metadata_file, 'w') as f:
        json.dump(chunks_metadata, f, indent=2)
    
    logger.info(f"Saved chunks metadata to {metadata_file}")
    
    # Initialize and build retrieval system
    logger.info("Building retrieval system")
    retriever = Retriever(
        embedding_model=settings.EMBEDDING_MODEL,
        vector_store_path=settings.VECTOR_STORE_PATH
    )
    
    logger.info("Initializing retriever with processed chunks")
    retriever.initialize(all_chunks)
    
    logger.info("Initializing reranker")
    reranker = Reranker(
        model_name=settings.RERANK_MODEL,
        max_length=512
    )
    reranker.initialize()
    
    # Test the system with a sample query
    logger.info("Testing the RAG system")
    test_queries = [
        "rotator cuff tear treatment exercises",
        "CPT billing codes for therapeutic exercise",
        "balance training for stroke patients",
        "documentation examples for OT interventions"
    ]
    
    for query in test_queries:
        logger.info(f"Testing query: '{query}'")
        try:
            results = retriever.search(query, top_k=5)
            logger.info(f"  -> Retrieved {len(results)} results")
            
            # Rerank results
            reranked = reranker.rerank(query, results, top_n=3)
            logger.info(f"  -> Reranked to {len(reranked)} results")
            
            # Show top result
            if reranked:
                top_result = reranked[0]
                logger.info(f"  -> Top result: {top_result.chunk.title} (score: {top_result.combined_score:.3f})")
                logger.info(f"     Source: {top_result.chunk.source_type} - {top_result.chunk.source_id}")
                logger.info("     Content preview: {top_result.chunk.content[:100]}")
            
        except Exception as e:
            logger.error(f"  -> Error testing query: {e}")
    
    # Get sources info
    sources_info = retriever.get_sources_info()
    logger.info("Sources summary:")
    logger.info(f"  Total chunks: {sources_info['total_chunks']}")
    logger.info(f"  Source counts: {sources_info['source_counts']}")
    
    logger.info("Document processing completed")
    logger.info(f"Vector store saved to: {settings.VECTOR_STORE_PATH}")
    logger.info(f"Chunks metadata saved to: {metadata_file}")


async def main():
    """Main function"""
    start_time = time.time()
    
    try:
        await process_documents()
        
        end_time = time.time()
        duration = end_time - start_time
        logger.info(f"Total processing time: {duration:.2f} seconds")
        
        print("\n" + "="*60)
        print("🎉 DOCUMENT PROCESSING COMPLETED!")
        print("="*60)
        print("\nYour RAG system is now ready with processed documents.")
        print("\nNext steps:")
        print("1. Start the server: python run.py")
        print("2. Test the API: http://localhost:8000/docs")
        print("3. Make requests to: http://localhost:8000/recommendations")
        
    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
