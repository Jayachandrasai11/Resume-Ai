import os
import logging
from typing import List, Dict
from django.conf import settings
from django.db.models import FloatField, ExpressionWrapper
from pgvector.django import CosineDistance
import google.generativeai as genai
from ..models import Candidate, ResumeChunk
from .embeddings import service as embedding_service

# Configure logging
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY')))
LLM_MODEL = genai.GenerativeModel('gemini-2.5-flash')


class ResumeRAGService:
    def __init__(self, top_k: int = 5, similarity_threshold: float = 0.0):
        """
        Initialize the RAG service.
        
        Args:
            top_k: Maximum number of chunks to retrieve (increased from 3 to 5)
            similarity_threshold: Minimum similarity score (lowered from 0.3 to 0.0)
                                 Setting to 0.0 means accept all chunks regardless of similarity
        """
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold

    def _get_relevant_chunks(self, candidate_id: int, question_embedding: List[float]) -> List[ResumeChunk]:
        """
        Search for the most relevant resume chunks using pgvector similarity search.
        
        Strategy:
        1. First try with the configured similarity threshold
        2. If no chunks found, fall back to getting all chunks (sorted by similarity)
        """
        # First attempt with threshold
        chunks = (
            ResumeChunk.objects
            .filter(resume__candidate_id=candidate_id, embedding__isnull=False)
            .annotate(similarity=ExpressionWrapper(
                1 - CosineDistance('embedding', question_embedding),
                output_field=FloatField()
            ))
            .filter(similarity__gte=self.similarity_threshold)
            .order_by('-similarity')[:self.top_k]
        )
        result = list(chunks)
        
        if result:
            logger.info(f"[RAG Chat] Found {len(result)} chunks with threshold={self.similarity_threshold}")
            return result
        
        # Fallback: Get top chunks regardless of similarity threshold
        logger.info(f"[RAG Chat] No chunks found with threshold={self.similarity_threshold}, using fallback")
        fallback_chunks = (
            ResumeChunk.objects
            .filter(resume__candidate_id=candidate_id, embedding__isnull=False)
            .annotate(similarity=ExpressionWrapper(
                1 - CosineDistance('embedding', question_embedding),
                output_field=FloatField()
            ))
            .order_by('-similarity')[:self.top_k]
        )
        return list(fallback_chunks)

    def _construct_prompt(self, question: str, context_chunks: List[ResumeChunk]) -> str:
        """
        Construct a prompt for the LLM with the retrieved context and the question.
        """
        context = "\n---\n".join([
            f"Chunk {i+1}: {chunk.chunk_text}" 
            for i, chunk in enumerate(context_chunks)
        ])
        
        prompt = f"""
You are a helpful AI assistant for a recruiter analyzing a candidate's resume.

## Resume Context:
{context}

## Question:
{question}

## Instructions:
- Answer the question based ONLY on the provided resume context above.
- If the answer is not in the context, clearly state "I don't have enough information from the resume to answer that."
- Be concise, professional, and helpful.
- Format your answer clearly with bullet points if it helps clarity.
- Do NOT make up information or assume details not present in the context.
"""
        return prompt

    def chat(self, candidate_id: int, question: str) -> Dict[str, any]:
        """
        Main method to handle the RAG-based chat.
        
        Args:
            candidate_id: The ID of the candidate to query
            question: The user's question about the candidate
            
        Returns:
            Dictionary with 'answer', 'chunks_used', and 'status' keys
        """
        logger.info(f"[RAG Chat] Starting chat for candidate_id={candidate_id}, question='{question[:50]}...'")
        
        # 1. Validate candidate exists
        if not Candidate.objects.filter(id=candidate_id).exists():
            logger.warning(f"[RAG Chat] Candidate {candidate_id} not found")
            return {"error": "Candidate not found", "status": "error"}
        
        # Check candidate has resume data
        candidate = Candidate.objects.get(id=candidate_id)
        resume_count = candidate.resumes.count()
        chunk_count = ResumeChunk.objects.filter(resume__candidate_id=candidate_id).count()
        chunk_with_emb = ResumeChunk.objects.filter(resume__candidate_id=candidate_id, embedding__isnull=False).count()
        
        logger.info(f"[RAG Chat] Candidate {candidate_id} ({candidate.name}): {resume_count} resumes, {chunk_count} chunks, {chunk_with_emb} with embeddings")
        
        # Check if candidate has any chunks with embeddings
        if chunk_with_emb == 0:
            logger.warning(f"[RAG Chat] Candidate {candidate_id} has no chunks with embeddings")
            return {
                "answer": f"No resume data available for {candidate.name}. The resume may not have been processed yet.",
                "chunks_used": 0,
                "status": "success"
            }
        
        # 2. Generate embedding for the question
        try:
            logger.info(f"[RAG Chat] Generating embedding for question...")
            question_embedding = embedding_service.get_embedding(question)
            logger.info(f"[RAG Chat] Embedding generated, length={len(question_embedding)}")
        except Exception as e:
            logger.error(f"[RAG Chat] Failed to generate embedding: {str(e)}", exc_info=True)
            return {"error": f"Failed to generate embedding: {str(e)}", "status": "error"}
        
        # 3. Retrieve relevant chunks
        logger.info(f"[RAG Chat] Searching for relevant chunks...")
        relevant_chunks = self._get_relevant_chunks(candidate_id, question_embedding)
        
        if not relevant_chunks:
            logger.warning(f"[RAG Chat] No relevant chunks found for candidate {candidate_id}")
            return {
                "answer": "I don't have enough information from the resume to answer that.",
                "chunks_used": 0,
                "status": "success"
            }

        # Log found chunks with their similarities
        for chunk in relevant_chunks:
            sim = getattr(chunk, 'similarity', 0)
            logger.info(f"[RAG Chat] Retrieved chunk {chunk.id} with similarity={sim:.4f}")

        # 4. Construct prompt and generate answer
        prompt = self._construct_prompt(question, relevant_chunks)
        logger.info(f"[RAG Chat] Prompt constructed, length={len(prompt)}")

        try:
            logger.info(f"[RAG Chat] Calling Gemini LLM...")
            response = LLM_MODEL.generate_content(prompt)
            answer = response.text.strip()
            logger.info(f"[RAG Chat] LLM response received, length={len(answer)}")
            
            return {
                "answer": answer,
                "chunks_used": len(relevant_chunks),
                "status": "success"
            }
        except Exception as e:
            logger.error(f"[RAG Chat] Failed to generate answer: {str(e)}", exc_info=True)
            return {"error": f"Failed to generate answer: {str(e)}", "status": "error"}


# Singleton instance for use throughout the application
rag_service = ResumeRAGService()