import re
from typing import List
from django.db import transaction
from ..models import Resume, ResumeChunk


# Pre-compile regex patterns for performance
_NEWLINE_REGEX = re.compile(r'\n+')
_BULLET_REGEX = re.compile(r'^[\-\*\•]\s*')
_SENTENCE_END_REGEX = re.compile(r'[.!?]\s+')
_SENTENCE_SPLIT_REGEX = re.compile(r'(?<=[.!?])\s+')


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences using pre-compiled regex patterns.
    Handles newlines as paragraph separators for resumes with bullet points.
    """
    # Normalize multiple newlines to single newline
    text = _NEWLINE_REGEX.sub('\n', text)
    
    # Split by newlines first (for bullet points and list items)
    lines = text.split('\n')
    
    sentences = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Skip pure bullet points
        if line in ('-', '*', '•'):
            continue
        
        # Remove bullet markers at the start
        line = _BULLET_REGEX.sub('', line)
        
        # If line has sentence-ending punctuation, split it
        if _SENTENCE_END_REGEX.search(line):
            parts = _SENTENCE_SPLIT_REGEX.split(line)
            sentences.extend([s.strip() for s in parts if s.strip()])
        else:
            sentences.append(line)
    
    return sentences


def _split_long_sentence(sentence: str, min_words: int, max_words: int) -> List[str]:
    """Split a sentence that exceeds max_words into smaller chunks."""
    chunks = []
    words = sentence.split()
    temp_chunk = []
    temp_count = 0
    
    for word in words:
        temp_chunk.append(word)
        temp_count += 1
        
        if temp_count >= min_words and temp_count <= max_words:
            chunks.append(' '.join(temp_chunk))
            temp_chunk = []
            temp_count = 0
        elif temp_count > max_words:
            chunks.append(' '.join(temp_chunk[:-1]))
            temp_chunk = [temp_chunk[-1]]
            temp_count = 1
    
    if temp_chunk:
        chunks.append(' '.join(temp_chunk))
    
    return chunks


def _finalize_chunks(chunks: List[str], current_chunk: List[str], min_words: int) -> None:
    """Finalize chunks by merging small chunks with the previous one."""
    if not current_chunk:
        return
    
    chunk_text = ' '.join(current_chunk)
    if len(chunk_text.split()) < min_words and chunks:
        chunks[-1] = chunks[-1] + ' ' + chunk_text
    else:
        chunks.append(chunk_text)


def create_word_chunks(sentences: List[str], min_words: int = 300, max_words: int = 500) -> List[str]:
    """Create chunks from sentences with word count constraints."""
    total_words = sum(len(s.split()) for s in sentences)
    
    if total_words < min_words:
        return [' '.join(sentences)]
    
    chunks = []
    current_chunk = []
    current_word_count = 0
    
    for sentence in sentences:
        sentence_word_count = len(sentence.split())
        
        if sentence_word_count > max_words:
            if current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_word_count = 0
            
            long_chunks = _split_long_sentence(sentence, min_words, max_words)
            chunks.extend(long_chunks)
        elif current_word_count + sentence_word_count > max_words and current_word_count >= min_words:
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]
            current_word_count = sentence_word_count
        else:
            current_chunk.append(sentence)
            current_word_count += sentence_word_count
    
    _finalize_chunks(chunks, current_chunk, min_words)
    
    return chunks


def chunk_resume_text(text: str, min_words: int = 300, max_words: int = 500) -> List[str]:
    """Main function to chunk resume text into manageable segments."""
    if not text or not text.strip():
        return []
    
    sentences = split_into_sentences(text)
    
    if not sentences:
        return []
    
    return create_word_chunks(sentences, min_words, max_words)


@transaction.atomic
def chunk_and_store_resume(resume_id: int, min_words: int = 300, max_words: int = 500) -> dict:
    """Chunk a resume and store chunks in the database."""
    try:
        resume = Resume.objects.select_for_update().get(id=resume_id)
    except Resume.DoesNotExist:
        return {'success': False, 'error': f'Resume with ID {resume_id} not found'}
    
    if not resume.text or not resume.text.strip():
        return {'success': False, 'error': 'Resume has no text content to chunk'}
    
    # Delete existing chunks for re-chunking
    ResumeChunk.objects.filter(resume=resume).delete()
    
    # Generate chunks
    chunks = chunk_resume_text(resume.text, min_words, max_words)
    
    if not chunks:
        return {'success': False, 'error': 'No chunks generated from resume text'}
    
    # Bulk create chunks
    chunk_objects = [
        ResumeChunk(resume=resume, chunk_text=chunk_text, chunk_index=index)
        for index, chunk_text in enumerate(chunks)
    ]
    ResumeChunk.objects.bulk_create(chunk_objects)
    
    # Update resume chunked status
    resume.chunked = True
    resume.save(update_fields=['chunked'])
    
    total_words = sum(len(chunk.split()) for chunk in chunks)
    
    return {
        'success': True,
        'resume_id': resume_id,
        'total_chunks': len(chunks),
        'total_words': total_words,
        'avg_words_per_chunk': total_words // len(chunks) if chunks else 0,
        'chunk_sizes': [len(chunk.split()) for chunk in chunks]
    }


def chunk_resumes_batch(resume_ids: List[int], min_words: int = 300, max_words: int = 500) -> dict:
    """Process multiple resumes in batch."""
    results = []
    successful = 0
    failed = 0
    
    for resume_id in resume_ids:
        result = chunk_and_store_resume(resume_id, min_words, max_words)
        results.append({'resume_id': resume_id, **result})
        
        if result['success']:
            successful += 1
        else:
            failed += 1
    
    return {
        'total_processed': len(resume_ids),
        'successful': successful,
        'failed': failed,
        'results': results
    }


def get_resume_chunks(resume_id: int) -> List[ResumeChunk]:
    """Retrieve all chunks for a specific resume."""
    return list(ResumeChunk.objects.filter(resume_id=resume_id).order_by('chunk_index'))


def get_chunk_text_for_embedding(resume_id: int) -> List[str]:
    """Get chunk texts for embedding generation."""
    chunks = get_resume_chunks(resume_id)
    return [chunk.chunk_text for chunk in chunks]

