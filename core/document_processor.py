"""
Document processing for various file types (PDF, DOCX, TXT)
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from abc import ABC, abstractmethod
import hashlib
import asyncio
import signal
from contextlib import contextmanager
import time
import platform
import threading

# Document processing libraries
import PyPDF2
import docx
from docx import Document

logger = logging.getLogger(__name__)

# Timeout constants
PDF_PROCESSING_TIMEOUT = 30  # seconds
PAGE_PROCESSING_TIMEOUT = 5   # seconds per page
MAX_RETRIES = 2

def with_timeout(func, timeout_duration: int, operation_name: str = "operation"):
    """Execute a function with timeout handling (cross-platform)"""
    import concurrent.futures
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func)
        try:
            result = future.result(timeout=timeout_duration)
            return result
        except concurrent.futures.TimeoutError:
            raise TimeoutError(f"{operation_name} timed out after {timeout_duration} seconds")

@contextmanager
def timeout_handler(timeout_duration: int, operation_name: str = "operation"):
    """Simple timeout context manager for Unix systems only"""
    if platform.system() != 'Windows':
        # Use signal-based timeout for Unix systems
        def timeout_handler_func(signum, frame):
            raise TimeoutError(f"{operation_name} timed out after {timeout_duration} seconds")
        
        # Set the signal handler
        old_handler = signal.signal(signal.SIGALRM, timeout_handler_func)
        signal.alarm(timeout_duration)
        
        try:
            yield
        finally:
            # Reset the alarm and restore the old handler
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old_handler)
    else:
        # For Windows, just yield without timeout (fallback)
        logger.warning(f"Timeout not supported on Windows for {operation_name}")
        yield

class DocumentChunk:

    
    def __init__(
        self,
        content: str,
        source_type: str,
        source_id: str,
        title: str,
        headers: List[str],
        page_ref: Optional[str] = None,
        chunk_id: str = None,
        file_path: Optional[str] = None
    ):
        self.content = content
        self.source_type = source_type
        self.source_id = source_id
        self.title = title
        self.headers = headers
        self.page_ref = page_ref
        self.chunk_id = chunk_id or self._generate_chunk_id()
        # Optional path to the original source file for backward compatibility / tracing
        self.file_path = file_path
    
    def _generate_chunk_id(self) -> str:

        content_hash = hashlib.md5(self.content.encode()).hexdigest()[:8]
        return f"{self.source_id}_{content_hash}"
    
    def to_dict(self) -> Dict[str, Any]:

        return {
            "content": self.content,
            "source_type": self.source_type,
            "source_id": self.source_id,
            "title": self.title,
            "headers": self.headers,
            "page_ref": self.page_ref,
            "chunk_id": self.chunk_id,
            "file_path": self.file_path
        }
class DocumentProcessor(ABC):

    
    @abstractmethod
    def can_process(self, file_path: Path) -> bool:

        pass
    
    @abstractmethod
    def process_file(self, file_path: Path) -> List[DocumentChunk]:

        pass
class PDFProcessor(DocumentProcessor):

    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def can_process(self, file_path: Path) -> bool:

        return file_path.suffix.lower() == '.pdf'
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Process PDF file with timeout handling and page-by-page processing"""
        chunks = []
        
        try:
            # First, try to validate the PDF structure
            if not self._validate_pdf(file_path):
                logger.error(f"PDF validation failed for {file_path}")
                return chunks
            
            with timeout_handler(PDF_PROCESSING_TIMEOUT, f"PDF processing for {file_path.name}"):
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    
                    logger.info(f"Processing PDF {file_path.name} with {len(pdf_reader.pages)} pages")
                    
                    # Process pages individually with timeout
                    full_text = ""
                    processed_pages = 0
                    skipped_pages = 0
                    
                    for page_num, page in enumerate(pdf_reader.pages):
                        try:
                            with timeout_handler(PAGE_PROCESSING_TIMEOUT, f"Page {page_num + 1} processing"):
                                page_text = page.extract_text()
                                if page_text and page_text.strip():
                                    full_text += f"\n[Page {page_num + 1}]\n{page_text}"
                                    processed_pages += 1
                                else:
                                    logger.debug(f"Page {page_num + 1} in {file_path.name} has no extractable text")
                                    skipped_pages += 1
                        
                        except TimeoutError as te:
                            logger.warning(f"Timeout processing page {page_num + 1} in {file_path.name}: {te}")
                            skipped_pages += 1
                            continue
                        except Exception as page_error:
                            logger.warning(f"Error processing page {page_num + 1} in {file_path.name}: {page_error}")
                            skipped_pages += 1
                            continue
                    
                    logger.info(f"PDF {file_path.name}: processed {processed_pages} pages, skipped {skipped_pages} pages")
                    
                    if not full_text.strip():
                        logger.warning(f"No text extracted from PDF {file_path.name}")
                        return chunks
                    
                    # Split text into chunks
                    text_chunks = self._split_text(full_text)
                    
                    # Create document chunks
                    for i, chunk_text in enumerate(text_chunks):
                        if chunk_text.strip():  # Only create chunks with actual content
                            chunk = DocumentChunk(
                                content=chunk_text.strip(),
                                source_type=self._get_source_type(file_path),
                                source_id=self._get_source_id(file_path),
                                title=self._get_title(file_path),
                                headers=self._extract_headers(chunk_text),
                                page_ref=self._extract_page_ref(chunk_text)
                            )
                            chunks.append(chunk)
                    
                    logger.info(f"Created {len(chunks)} chunks from PDF {file_path.name}")
                    
        except TimeoutError as te:
            logger.error(f"Timeout processing PDF {file_path}: {te}")
        except Exception as e:
            logger.error(f"Error processing PDF {file_path}: {e}")
            
        return chunks
    
    def _validate_pdf(self, file_path: Path) -> bool:
        """Validate PDF file before processing"""
        try:
            with timeout_handler(5, f"PDF validation for {file_path.name}"):
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    
                    # Check if PDF has pages
                    if len(pdf_reader.pages) == 0:
                        logger.warning(f"PDF {file_path.name} has no pages")
                        return False
                    
                    # Check if PDF is encrypted
                    if pdf_reader.is_encrypted:
                        logger.warning(f"PDF {file_path.name} is encrypted")
                        return False
                    
                    # Try to access the first page to check if it's readable
                    first_page = pdf_reader.pages[0]
                    
                    logger.debug(f"PDF {file_path.name} validation successful")
                    return True
                    
        except TimeoutError:
            logger.error(f"Timeout during PDF validation for {file_path.name}")
            return False
        except Exception as e:
            logger.error(f"PDF validation failed for {file_path.name}: {e}")
            return False
    
    def _split_text(self, text: str) -> List[str]:

        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            

            chunk = text[start:end]
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            
            if last_period > self.chunk_size * 0.7:
                end = start + last_period + 1
            elif last_newline > self.chunk_size * 0.7:
                end = start + last_newline + 1
            
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
            
        return chunks
    
    def _get_source_type(self, file_path: Path) -> str:

        if "NoteNinjas" in str(file_path):
            return "note_ninjas"
        elif "CPG" in str(file_path) or "Titled_CPGs" in str(file_path) or "Untitled_CPGs" in str(file_path):
            return "cpg"
        else:
            return "textbook"
    
    def _get_source_id(self, file_path: Path) -> str:

        return file_path.stem
    
    def _get_title(self, file_path: Path) -> str:

        return file_path.stem.replace('_', ' ').replace('-', ' ')
    
    def _extract_headers(self, text: str) -> List[str]:

        headers = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if len(line) < 50 and (
                line.isupper() or 
                line.endswith(':') or 
                any(word in line.lower() for word in ['section', 'chapter', 'part', 'unit'])
            ):
                headers.append(line)
                
        return headers[:5]  # Limit to 5 headers
    
    def _extract_page_ref(self, text: str) -> Optional[str]:

        import re
        page_match = re.search(r'\[Page (\d+)\]', text)
        if page_match:
            return f"p. {page_match.group(1)}"
        return None
class DOCXProcessor(DocumentProcessor):

    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def can_process(self, file_path: Path) -> bool:

        return file_path.suffix.lower() == '.docx'
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:

        chunks = []
        
        try:
            doc = Document(file_path)
            

            full_text = ""
            headers = []
            
            for paragraph in doc.paragraphs:
                text = paragraph.text.strip()
                if text:

                    if paragraph.style.name.startswith('Heading') or (
                        paragraph.runs and paragraph.runs[0].bold
                    ):
                        headers.append(text)
                        full_text += f"\n## {text}\n"
                    else:
                        full_text += f"{text}\n"
            

            text_chunks = self._split_text(full_text)
            

            for i, chunk_text in enumerate(text_chunks):
                chunk = DocumentChunk(
                    content=chunk_text.strip(),
                    source_type=self._get_source_type(file_path),
                    source_id=self._get_source_id(file_path),
                    title=self._get_title(file_path),
                    headers=self._extract_headers_from_chunk(chunk_text, headers),
                    page_ref=None  # DOCX doesn't have page numbers
                )
                chunks.append(chunk)
                
        except Exception as e:
            logger.error(f"Error processing DOCX {file_path}: {e}")
            
        return chunks
    
    def _split_text(self, text: str) -> List[str]:

        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            

            chunk = text[start:end]
            last_newline = chunk.rfind('\n')
            
            if last_newline > self.chunk_size * 0.7:
                end = start + last_newline + 1
            
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
            
        return chunks
    
    def _get_source_type(self, file_path: Path) -> str:

        if "NoteNinjas" in str(file_path):
            return "note_ninjas"
        elif "CPG" in str(file_path):
            return "cpg"
        else:
            return "textbook"
    
    def _get_source_id(self, file_path: Path) -> str:

        return file_path.stem
    
    def _get_title(self, file_path: Path) -> str:

        return file_path.stem.replace('_', ' ').replace('-', ' ')
    
    def _extract_headers_from_chunk(self, chunk_text: str, all_headers: List[str]) -> List[str]:

        chunk_headers = []
        lines = chunk_text.split('\n')
        
        for line in lines:
            if line.startswith('## '):
                header = line[3:].strip()
                chunk_headers.append(header)
        
        return chunk_headers[:5]
class TXTProcessor(DocumentProcessor):

    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def can_process(self, file_path: Path) -> bool:

        return file_path.suffix.lower() == '.txt'
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:

        chunks = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            

            text_chunks = self._split_text(text)
            

            for i, chunk_text in enumerate(text_chunks):
                chunk = DocumentChunk(
                    content=chunk_text.strip(),
                    source_type=self._get_source_type(file_path),
                    source_id=self._get_source_id(file_path),
                    title=self._get_title(file_path),
                    headers=self._extract_headers(chunk_text),
                    page_ref=None
                )
                chunks.append(chunk)
                
        except Exception as e:
            logger.error(f"Error processing TXT {file_path}: {e}")
            
        return chunks
    
    def _split_text(self, text: str) -> List[str]:

        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            

            chunk = text[start:end]
            last_period = chunk.rfind('.')
            
            if last_period > self.chunk_size * 0.7:
                end = start + last_period + 1
            
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
            
        return chunks
    
    def _get_source_type(self, file_path: Path) -> str:

        if "NoteNinjas" in str(file_path):
            return "note_ninjas"
        elif "CPG" in str(file_path):
            return "cpg"
        else:
            return "textbook"
    
    def _get_source_id(self, file_path: Path) -> str:

        return file_path.stem
    
    def _get_title(self, file_path: Path) -> str:

        return file_path.stem.replace('_', ' ').replace('-', ' ')
    
    def _extract_headers(self, text: str) -> List[str]:

        headers = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if len(line) < 100 and (
                line.isupper() or 
                line.endswith(':') or
                any(word in line.lower() for word in ['section', 'chapter', 'part'])
            ):
                headers.append(line)
                
        return headers[:5]
class DocumentProcessorFactory:

    
    def __init__(self):
        self.processors = [
            PDFProcessor(),
            DOCXProcessor(),
            TXTProcessor()
        ]
    
    def get_processor(self, file_path: Path) -> Optional[DocumentProcessor]:

        for processor in self.processors:
            if processor.can_process(file_path):
                return processor
        return None
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:

        processor = self.get_processor(file_path)
        if processor:
            return processor.process_file(file_path)
        else:
            logger.warning(f"No processor found for file: {file_path}")
            return []
