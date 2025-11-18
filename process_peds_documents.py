#!/usr/bin/env python3
"""
Pediatric documents processing script to build a dedicated RAG system for pediatric therapy content
"""

import asyncio
import sys
import logging
from pathlib import Path
import json
import time

# Add backend to path for imports
backend_dir = Path(__file__).parent / "backend"
root_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(root_dir))

from core.document_processor import DocumentProcessorFactory
from core.retriever import Retriever
from core.reranker import Reranker
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def process_pediatric_documents():
    """Process all pediatric documents and build the RAG system"""

    logger.info("Starting pediatric document processing for Note Ninjas RAG system")
    logger.info("="*70)

    # Initialize document processor
    processor_factory = DocumentProcessorFactory()

    # Process Pediatric Content documents
    logger.info("Processing Pediatric Therapy Content documents")
    peds_path = Path(settings.PEDS_CONTENT_PATH)
    peds_chunks = []

    if peds_path.exists():
        docx_files = list(peds_path.glob("**/*.docx"))
        logger.info(f"Found {len(docx_files)} DOCX files in Pediatric Content directory")
        logger.info(f"Directory: {peds_path}")
        logger.info("-"*70)

        for i, file_path in enumerate(docx_files):
            logger.info(f"Processing {i+1}/{len(docx_files)}: {file_path.name}")
            try:
                chunks = processor_factory.process_file(file_path)
                # Update source type to peds_content
                for chunk in chunks:
                    chunk.source_type = "peds_content"
                    # Add file category based on filename
                    chunk.metadata = chunk.metadata or {}
                    chunk.metadata['file_name'] = file_path.name
                    chunk.metadata['category'] = extract_category_from_filename(file_path.name)

                peds_chunks.extend(chunks)
                logger.info(f"  ✓ Generated {len(chunks)} chunks")
            except Exception as e:
                logger.error(f"  ✗ Error processing {file_path.name}: {e}")

        logger.info("-"*70)
    else:
        logger.error(f"Pediatric Content path not found: {peds_path}")
        logger.error("Please check the path in config.py")
        return

    logger.info(f"📊 Total Pediatric Content chunks: {len(peds_chunks)}")

    if len(peds_chunks) == 0:
        logger.error("No chunks were processed. Please check your document paths.")
        return

    # Analyze categories
    categories = {}
    for chunk in peds_chunks:
        cat = chunk.metadata.get('category', 'Unknown')
        categories[cat] = categories.get(cat, 0) + 1

    logger.info("\n📁 Content Categories:")
    for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        logger.info(f"  - {category}: {count} chunks")

    # Save chunks metadata
    chunks_metadata = []
    for chunk in peds_chunks:
        chunks_metadata.append({
            "chunk_id": chunk.chunk_id,
            "source_type": chunk.source_type,
            "source_id": chunk.source_id,
            "title": chunk.title,
            "headers": chunk.headers,
            "page_ref": chunk.page_ref,
            "content_length": len(chunk.content),
            "category": chunk.metadata.get('category', 'Unknown'),
            "file_name": chunk.metadata.get('file_name', '')
        })

    # Save metadata to file
    metadata_file = backend_dir / "peds_chunks_metadata.json"
    with open(metadata_file, 'w') as f:
        json.dump(chunks_metadata, f, indent=2)

    logger.info(f"\n💾 Saved chunks metadata to {metadata_file}")

    # Initialize and build retrieval system
    logger.info("\n🔨 Building pediatric-specific retrieval system")
    retriever = Retriever(
        embedding_model=settings.EMBEDDING_MODEL,
        vector_store_path=settings.PEDS_VECTOR_STORE_PATH
    )

    logger.info("Initializing retriever with processed chunks")
    retriever.initialize(peds_chunks)

    logger.info("Initializing reranker")
    reranker = Reranker(
        model_name=settings.RERANK_MODEL,
        max_length=512
    )
    reranker.initialize()

    # Test the system with pediatric-specific sample queries
    logger.info("\n🧪 Testing the Pediatric RAG system")
    logger.info("="*70)

    test_queries = [
        "fine motor activities for handwriting",
        "sensory integration techniques for autism",
        "gross motor developmental milestones",
        "emotional regulation strategies for children",
        "visual motor integration exercises",
        "balance activities for pediatric patients",
        "ADL training for children",
        "heavy work activities for sensory needs"
    ]

    for query in test_queries:
        logger.info(f"\n🔍 Testing query: '{query}'")
        try:
            results = retriever.search(query, top_k=5)
            logger.info(f"  → Retrieved {len(results)} results")

            # Rerank results
            reranked = reranker.rerank(query, results, top_n=3)
            logger.info(f"  → Reranked to {len(reranked)} results")

            # Show top result
            if reranked:
                top_result = reranked[0]
                logger.info(f"  ✓ Top result from: {top_result.chunk.metadata.get('file_name', 'Unknown')} (score: {top_result.combined_score:.3f})")
                logger.info(f"     Category: {top_result.chunk.metadata.get('category', 'Unknown')}")
                logger.info(f"     Title: {top_result.chunk.title}")
                logger.info(f"     Preview: {top_result.chunk.content[:150]}...")

        except Exception as e:
            logger.error(f"  ✗ Error testing query: {e}")

    # Get sources info
    sources_info = retriever.get_sources_info()
    logger.info("\n" + "="*70)
    logger.info("📊 Sources summary:")
    logger.info(f"  Total chunks: {sources_info['total_chunks']}")
    logger.info(f"  Source counts: {sources_info['source_counts']}")

    logger.info("\n" + "="*70)
    logger.info("✅ Pediatric document processing completed!")
    logger.info(f"Vector store saved to: {settings.PEDS_VECTOR_STORE_PATH}")
    logger.info(f"Chunks metadata saved to: {metadata_file}")


def extract_category_from_filename(filename: str) -> str:
    """Extract category from document filename"""
    # Remove extension
    name = filename.replace('.docx', '')

    # Common categories based on the file list
    categories_map = {
        'ADLs': 'Activities of Daily Living',
        'Autism': 'Autism Spectrum Disorder',
        'Balance': 'Balance & Coordination',
        'Core': 'Core Strength',
        'Creative Treatment': 'Creative Treatment Ideas',
        'Developmental Milestones': 'Developmental Milestones',
        'Documentation': 'Documentation & Templates',
        'Early Intervention': 'Early Intervention',
        'Emotional Regulation': 'Emotional Regulation',
        'Executive Functioning': 'Executive Functioning',
        'Expert Sessions': 'Expert Sessions',
        'Fine Motor': 'Fine Motor Skills',
        'Goal Writing': 'Goal Writing',
        'Gross Motor': 'Gross Motor Skills',
        'Handwriting': 'Handwriting',
        'Heavy Work': 'Heavy Work Activities',
        'Intervention Framework': 'Intervention Frameworks',
        'Obstacle Course': 'Obstacle Courses',
        'Pelvic Floor': 'Pelvic Floor',
        'Primitive Reflexes': 'Primitive Reflexes',
        'Speech': 'Speech & Language',
        'Sensory': 'Sensory Processing',
        'Typing': 'Typing & Communication',
        'Visual Motor': 'Visual Motor Integration',
        'Visual Tools': 'Visual Tools',
        'Welcome': 'Welcome & Introduction'
    }

    # Check for category keywords in filename
    for keyword, category in categories_map.items():
        if keyword.lower() in name.lower():
            return category

    return 'General Pediatric Content'


async def main():
    """Main function"""
    start_time = time.time()

    try:
        await process_pediatric_documents()

        end_time = time.time()
        duration = end_time - start_time
        logger.info(f"\n⏱️  Total processing time: {duration:.2f} seconds")

        print("\n" + "="*70)
        print("🎉 PEDIATRIC DOCUMENT PROCESSING COMPLETED!")
        print("="*70)
        print("\nYour Pediatric RAG system is now ready with specialized content.")
        print("\n📚 Content processed:")
        print("  • Fine Motor Skills & Handwriting")
        print("  • Gross Motor Development")
        print("  • Sensory Integration")
        print("  • Autism Interventions")
        print("  • Emotional Regulation")
        print("  • Developmental Milestones")
        print("  • ADLs & IADLs")
        print("  • And more...")
        print("\n💡 Next steps:")
        print("1. The pediatric vector store is ready to use")
        print("2. Update your API to use this specialized content for pediatric cases")
        print("3. Test queries specific to pediatric therapy")

    except Exception as e:
        logger.error(f"Pediatric document processing failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
