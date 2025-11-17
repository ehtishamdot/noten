#!/usr/bin/env python3
"""
Script to reprocess CPG documents with improved timeout handling
"""

import logging
import sys
from pathlib import Path
from core.document_processor import DocumentProcessorFactory
import time

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s:%(name)s:%(message)s',
    handlers=[
        logging.FileHandler('cpg_processing.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main function to reprocess CPG documents"""
    
    # Define CPG paths
    cpg_paths = [
        Path("../Untitled_CPGs"),
        Path("../Titled_CPGs")
    ]
    
    processor_factory = DocumentProcessorFactory()
    
    total_processed = 0
    total_failed = 0
    total_chunks = 0
    
    for cpg_dir in cpg_paths:
        if not cpg_dir.exists():
            logger.warning(f"CPG directory not found: {cpg_dir}")
            continue
            
        logger.info(f"Processing CPG documents from {cpg_dir}")
        
        # Find all PDF files
        pdf_files = list(cpg_dir.glob("**/*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files in {cpg_dir}")
        
        for pdf_file in pdf_files:
            try:
                start_time = time.time()
                logger.info(f"Processing {pdf_file.name}...")
                
                chunks = processor_factory.process_file(pdf_file)
                
                processing_time = time.time() - start_time
                
                if chunks:
                    logger.info(f"✓ {pdf_file.name}: {len(chunks)} chunks created in {processing_time:.2f}s")
                    total_chunks += len(chunks)
                    total_processed += 1
                else:
                    logger.warning(f"⚠ {pdf_file.name}: No chunks created")
                    total_failed += 1
                    
            except Exception as e:
                logger.error(f"✗ {pdf_file.name}: Failed to process - {e}")
                total_failed += 1
    
    # Summary
    logger.info("="*50)
    logger.info("PROCESSING SUMMARY")
    logger.info("="*50)
    logger.info(f"Total files processed successfully: {total_processed}")
    logger.info(f"Total files failed: {total_failed}")
    logger.info(f"Total chunks created: {total_chunks}")
    logger.info(f"Average chunks per file: {total_chunks / max(total_processed, 1):.1f}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Processing interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)