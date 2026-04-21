"""
TF-IDF Fallback Matching Service
=================================
Pure Python implementation — NO external API, NO quota, NO AI needed.
This is automatically used when Gemini API quota is exceeded or unavailable.

Strategy:
  - Tokenize job description and candidate resume text
  - Compute TF-IDF weighted cosine similarity
  - Return a ranked list of candidates with scores scaled to human range (0-1)
"""
import math
import re
import logging
from collections import Counter
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger(__name__)


# ─── Common English stop words to ignore ────────────────────────────────────
STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "up", "about", "into", "through", "during",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "this", "that", "these", "those", "i", "you", "he", "she", "it", "we",
    "they", "what", "which", "who", "whom", "not", "no", "so", "if", "as",
    "such", "can", "than", "more", "also", "any", "all", "both", "each",
    "our", "your", "their", "its", "my", "his", "her", "per", "etc",
}


def tokenize(text: str) -> List[str]:
    """Lowercase, strip punctuation, split into tokens, remove stopwords."""
    text = text.lower()
    tokens = re.findall(r"\b[a-z][a-z0-9+#\.]*\b", text)
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]


def compute_tf(tokens: List[str]) -> Dict[str, float]:
    """Term Frequency: count / total."""
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = len(tokens)
    return {term: count / total for term, count in counts.items()}


def compute_idf(documents: List[List[str]]) -> Dict[str, float]:
    """Inverse Document Frequency across a corpus."""
    n = len(documents)
    doc_freq: Dict[str, int] = {}
    for doc in documents:
        for term in set(doc):
            doc_freq[term] = doc_freq.get(term, 0) + 1
    return {
        term: math.log((1 + n) / (1 + freq)) + 1
        for term, freq in doc_freq.items()
    }


def tfidf_vector(tokens: List[str], idf: Dict[str, float]) -> Dict[str, float]:
    """Compute TF-IDF vector for a single document."""
    tf = compute_tf(tokens)
    return {term: tf_val * idf.get(term, 1.0) for term, tf_val in tf.items()}


def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Compute cosine similarity between two TF-IDF vectors."""
    shared = set(vec_a.keys()) & set(vec_b.keys())
    if not shared:
        return 0.0
    dot = sum(vec_a[t] * vec_b[t] for t in shared)
    mag_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
    mag_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ─── Skill Overlap Bonus ────────────────────────────────────────────────────

def skill_overlap_score(job_skills: List[str], candidate_skills: List[str]) -> float:
    """
    Compute Jaccard similarity between skill sets.
    Returns 0.0 – 1.0 (1.0 = perfect match)
    """
    job_set = {s.lower().strip() for s in job_skills if s}
    cand_set = {s.lower().strip() for s in candidate_skills if s}
    if not job_set:
        return 0.5  # No job skills known → neutral
    intersection = job_set & cand_set
    union = job_set | cand_set
    return len(intersection) / len(union) if union else 0.0


# ─── Main Matcher ────────────────────────────────────────────────────────────

class TFIDFMatcher:
    """
    Offline TF-IDF based candidate matching engine.
    No API, no quota. Works on pure resume text and job description.
    """

    def match(
        self,
        job_description: str,
        candidates_data: List[Dict],
        threshold: float = 0.1,
        limit: int = 30,
        job_skills: Optional[List[str]] = None,
    ) -> List[Dict]:
        """
        Match candidates to a job description using TF-IDF similarity.

        Args:
            job_description: Full text of the job description
            candidates_data: List of dicts with keys:
                - candidate_id (int)
                - resume_text (str) — full resume text
                - skills (list) — candidate's skills
                - name (str)
                - email (str)
                - experience_years (float)
            threshold: Minimum score (0-1) to include in results
            limit: Max results to return
            job_skills: Skills extracted from JD for bonus calculation

        Returns:
            List of dicts with candidate info and similarity scores
        """
        if not candidates_data:
            logger.warning("[TF-IDF] No candidates provided for matching")
            return []

        job_tokens = tokenize(job_description)
        if not job_tokens:
            logger.warning("[TF-IDF] Empty job description tokens")
            return []

        # Build corpus for IDF (job + all resumes)
        all_docs = [job_tokens] + [
            tokenize(c.get("resume_text", "")) for c in candidates_data
        ]
        idf = compute_idf(all_docs)

        job_vec = tfidf_vector(job_tokens, idf)

        scored = []
        for candidate in candidates_data:
            resume_text = candidate.get("resume_text", "")
            if not resume_text:
                continue

            cand_tokens = tokenize(resume_text)
            if not cand_tokens:
                continue

            cand_vec = tfidf_vector(cand_tokens, idf)
            tfidf_score = cosine_similarity(job_vec, cand_vec)

            # Skill overlap bonus (0-1)
            skill_score = skill_overlap_score(
                job_skills or [],
                candidate.get("skills", [])
            ) if job_skills else tfidf_score

            # Weighted combination: 60% text similarity + 40% skill match
            if job_skills:
                combined = 0.60 * tfidf_score + 0.40 * skill_score
            else:
                combined = tfidf_score

            # Scale to human-readable range (same as neural engine)
            scaled = _scale_score(combined)

            if scaled >= threshold:
                scored.append({
                    "candidate_id": candidate["candidate_id"],
                    "name": candidate.get("name", ""),
                    "email": candidate.get("email", ""),
                    "skills": candidate.get("skills", []),
                    "experience_years": candidate.get("experience_years", 0),
                    "similarity_score": round(scaled, 4),
                    "match_score": round(scaled * 100),
                    "match_method": "tfidf_fallback",
                })

        # Sort by score descending
        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        logger.info(f"[TF-IDF] Matched {len(scored)} candidates (threshold={threshold})")
        return scored[:limit]


def _scale_score(s: float) -> float:
    """
    Scale raw TF-IDF score (0.0-0.3 range typical) to human range (0-0.99).
    TF-IDF is structurally lower than cosine similarity on embeddings,
    so we scale more aggressively.
    """
    if s <= 0.0: return 0.0
    if s >= 1.0: return 0.99
    # Gentle power curve: raw 0.1 → ~0.50, raw 0.2 → ~0.72, raw 0.3 → ~0.85
    return min(0.99, math.pow(s, 0.38))


# Singleton instance
tfidf_matcher = TFIDFMatcher()
