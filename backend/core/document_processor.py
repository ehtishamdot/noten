"""
Document processing for various file types (PDF, DOCX, TXT)
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from abc import ABC, abstractmethod
import hashlib

# Document processing libraries
import PyPDF2
import docx
from docx import Document

logger = logging.getLogger(__name__)


class DocumentChunk:
    """Represents a chunk of processed document"""
    
    def __init__(
        self,
        content: str,
        source_type: str,
        source_id: str,
        title: str,
        headers: List[str],
        page_ref: Optional[str] = None,
        chunk_id: str = None
    ):
        self.content = content
        self.source_type = source_type
        self.source_id = source_id
        self.title = title
        self.headers = headers
        self.page_ref = page_ref
        self.chunk_id = chunk_id or self._generate_chunk_id()
    
    def _generate_chunk_id(self) -> str:
        """Generate unique chunk ID"""
        content_hash = hashlib.md5(self.content.encode()).hexdigest()[:8]
        return f"{self.source_id}_{content_hash}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "content": self.content,
            "source_type": self.source_type,
            "source_id": self.source_id,
            "title": self.title,
            "headers": self.headers,
            "page_ref": self.page_ref,
            "chunk_id": self.chunk_id
        }


class DocumentProcessor(ABC):
    """Abstract base class for document processors"""
    
    @abstractmethod
    def can_process(self, file_path: Path) -> bool:
        """Check if this processor can handle the file"""
        pass
    
    @abstractmethod
    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Process a file and return chunks"""
        pass


class PDFProcessor(DocumentProcessor):
    """PDF document processor"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def can_process(self, file_path: Path) -> bool:
        """Check if file is a PDF"""
        return file_path.suffix.lower() == '.pdf'
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Process PDF file"""
        chunks = []
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract text from all pages
                full_text = ""
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        full_text += f"\n[Page {page_num + 1}]\n{page_text}"
                
                # Split into chunks
                text_chunks = self._split_text(full_text)
                
                # Create document chunks
                for i, chunk_text in enumerate(text_chunks):
                    chunk = DocumentChunk(
                        content=chunk_text.strip(),
                        source_type=self._get_source_type(file_path),
                        source_id=self._get_source_id(file_path),
                        title=self._get_title(file_path),
                        headers=self._extract_headers(chunk_text),
                        page_ref=self._extract_page_ref(chunk_text)
                    )
                    chunks.append(chunk)
                    
        except Exception as e:
            logger.error(f"Error processing PDF {file_path}: {e}")
            
        return chunks
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            
            # Try to break at sentence boundary
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
        """Determine source type from file path"""
        if "NoteNinjas" in str(file_path):
            return "note_ninjas"
        elif "CPG" in str(file_path) or "Titled_CPGs" in str(file_path) or "Untitled_CPGs" in str(file_path):
            return "cpg"
        else:
            return "textbook"
    
    def _get_source_id(self, file_path: Path) -> str:
        """Generate source ID from file path"""
        return file_path.stem
    
    def _get_title(self, file_path: Path) -> str:
        """Extract title from file path"""
        return file_path.stem.replace('_', ' ').replace('-', ' ')
    
    def _extract_headers(self, text: str) -> List[str]:
        """Extract potential headers from text"""
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
        """Extract page reference from text"""
        import re
        page_match = re.search(r'\[Page (\d+)\]', text)
        if page_match:
            return f"p. {page_match.group(1)}"
        return None


class DOCXProcessor(DocumentProcessor):
    """DOCX document processor"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def can_process(self, file_path: Path) -> bool:
        """Check if file is a DOCX"""
        return file_path.suffix.lower() == '.docx'
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Process DOCX file"""
        chunks = []
        
        try:
            doc = Document(file_path)
            
            # Extract text and structure
            full_text = ""
            headers = []
            
            for paragraph in doc.paragraphs:
                text = paragraph.text.strip()
                if text:
                    # Check if it's a header (bold or specific style)
                    if paragraph.style.name.startswith('Heading') or (
                        paragraph.runs and paragraph.runs[0].bold
                    ):
                        headers.append(text)
                        full_text += f"\n## {text}\n"
                    else:
                        full_text += f"{text}\n"
            
            # Split into chunks
            text_chunks = self._split_text(full_text)
            
            # Create document chunks
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
        """Split text into overlapping chunks"""
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            
            # Try to break at paragraph boundary
            chunk = text[start:end]
            last_newline = chunk.rfind('\n')
            
            if last_newline > self.chunk_size * 0.7:
                end = start + last_newline + 1
            
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
            
        return chunks
    
    def _get_source_type(self, file_path: Path) -> str:
        """Determine source type from file path"""
        if "NoteNinjas" in str(file_path):
            return "note_ninjas"
        elif "CPG" in str(file_path):
            return "cpg"
        else:
            return "textbook"
    
    def _get_source_id(self, file_path: Path) -> str:
        """Generate source ID from file path"""
        return file_path.stem
    
    def _get_title(self, file_path: Path) -> str:
        """Extract title from file path"""
        return file_path.stem.replace('_', ' ').replace('-', ' ')
    
    def _extract_headers_from_chunk(self, chunk_text: str, all_headers: List[str]) -> List[str]:
        """Extract relevant headers for this chunk"""
        chunk_headers = []
        lines = chunk_text.split('\n')
        
        for line in lines:
            if line.startswith('## '):
                header = line[3:].strip()
                chunk_headers.append(header)
        
        return chunk_headers[:5]


class TXTProcessor(DocumentProcessor):
    """TXT document processor"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def can_process(self, file_path: Path) -> bool:
        """Check if file is a TXT"""
        return file_path.suffix.lower() == '.txt'
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Process TXT file"""
        chunks = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            # Split into chunks
            text_chunks = self._split_text(text)
            
            # Create document chunks
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
        """Split text into overlapping chunks"""
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            
            # Try to break at sentence boundary
            chunk = text[start:end]
            last_period = chunk.rfind('.')
            
            if last_period > self.chunk_size * 0.7:
                end = start + last_period + 1
            
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
            
        return chunks
    
    def _get_source_type(self, file_path: Path) -> str:
        """Determine source type from file path"""
        if "NoteNinjas" in str(file_path):
            return "note_ninjas"
        elif "CPG" in str(file_path):
            return "cpg"
        else:
            return "textbook"
    
    def _get_source_id(self, file_path: Path) -> str:
        """Generate source ID from file path"""
        return file_path.stem
    
    def _get_title(self, file_path: Path) -> str:
        """Extract title from file path"""
        return file_path.stem.replace('_', ' ').replace('-', ' ')
    
    def _extract_headers(self, text: str) -> List[str]:
        """Extract potential headers from text"""
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
    """Factory for creating document processors"""
    
    def __init__(self):
        self.processors = [
            PDFProcessor(),
            DOCXProcessor(),
            TXTProcessor()
        ]
    
    def get_processor(self, file_path: Path) -> Optional[DocumentProcessor]:
        """Get appropriate processor for file"""
        for processor in self.processors:
            if processor.can_process(file_path):
                return processor
        return None
    
    def process_file(self, file_path: Path) -> List[DocumentChunk]:
        """Process file with appropriate processor"""
        processor = self.get_processor(file_path)
        if processor:
            return processor.process_file(file_path)
        else:
            logger.warning(f"No processor found for file: {file_path}")
            return []
