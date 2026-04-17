from apps.candidates.models import Candidate


class CandidateRanker:
    def calculate_score(self, candidate, jd_text: str) -> int:
        jd_lower, skills = jd_text.lower(), candidate.skills or []
        # Score: 10 points per skill match + bonus for total skill count
        return sum(10 for s in skills if s.lower() in jd_lower) + min(len(skills), 5)

    def rank_candidates(self, job_description: str, page: int = 1, page_size: int = 20):
        candidates = Candidate.objects.all()
        results = [{
            **{f: getattr(c, f) for f in ['id', 'name', 'email', 'skills', 'summary']},
            "score": self.calculate_score(c, job_description)
        } for c in candidates[(page-1)*page_size : page*page_size]]
        
        return {
            "results": sorted(results, key=lambda x: x["score"], reverse=True),
            "pagination": {"page": page, "total": candidates.count()}
        }
