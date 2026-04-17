from typing import Literal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Q, Count

from apps.candidates.models import Candidate
from dashboard.views import DashboardSummaryAPIView, RecruitmentFunnelAPIView
from apps.pipeline.models import CandidatePipeline


IntentType = Literal["candidate_search", "analytics_query", "funnel_query", "unknown"]


def detect_intent(message: str) -> IntentType:
  """
  Very lightweight intent detection based on keywords.
  This can be swapped for a proper NLP model later.
  """
  text = (message or "").lower()

  if any(k in text for k in ["candidate search", "search candidate", "find candidate", "find candidates", "candidate lookup"]):
      return "candidate_search"

  if "analytics" in text or "dashboard" in text or "stats" in text or "statistics" in text or "metrics" in text:
      return "analytics_query"

  if "funnel" in text or "pipeline" in text or "stage" in text:
      return "funnel_query"

  # Fallback
  return "unknown"


class ChatAPIView(APIView):
    """
    Simple AI chat-style API that routes requests to existing backend analytics/search endpoints
    based on detected intent.

    Route: /api/chat

    POST body:
    {
        "message": "Show me funnel stats",
        "context": { ... }  # optional, reserved for future use
    }
    """

    def post(self, request, *args, **kwargs):
        message = request.data.get("message", "")
        if not message:
            return Response(
                {"detail": "message is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        intent = detect_intent(message)

        if intent == "candidate_search":
            return self._handle_candidate_search(request, message)
        if intent == "analytics_query":
            return self._handle_analytics_query(request)
        if intent == "funnel_query":
            return self._handle_funnel_query(request)

        # Unknown intent – return a friendly reply
        return Response(
            {
                "intent": "unknown",
                "reply": "I can help with candidate search, analytics, or funnel questions. "
                "Try asking things like 'search candidates for React', 'show analytics', or 'show funnel'.",
            },
            status=status.HTTP_200_OK,
        )

    def _handle_candidate_search(self, request, message: str):
        """
        Very basic candidate search:
        - Look for words after 'for' / 'with' as a loose query
        - Search by name or skills JSON text
        """
        text = message.lower()
        query = ""

        for keyword in ["for", "with", "about"]:
            if keyword in text:
                query = text.split(keyword, 1)[1].strip()
                break

        # Fallback: entire message as query
        if not query:
            query = text

        qs = Candidate.objects.all()

        if query:
            qs = qs.filter(
                Q(name__icontains=query)
                | Q(summary__icontains=query)
                | Q(skills__icontains=query)
            )

        candidates = (
            qs.annotate(resume_count=Count("resumes"))
            .order_by("-resume_count", "name")[:20]
        )

        results = []
        for c in candidates:
            results.append(
                {
                    "id": c.id,
                    "name": c.name,
                    "email": c.email,
                    "status": c.status,
                    "resume_count": getattr(c, "resume_count", 0),
                }
            )

        return Response(
            {
                "intent": "candidate_search",
                "query": query,
                "count": len(results),
                "results": results,
            }
        )

    def _handle_analytics_query(self, request):
        """
        Delegate to the existing dashboard summary endpoint logic.
        """
        view = DashboardSummaryAPIView.as_view()
        response = view(request._request)

        return Response(
            {
                "intent": "analytics_query",
                "summary": response.data,
            },
            status=response.status_code,
        )

    def _handle_funnel_query(self, request):
        """
        Priority 1: use dashboard RecruitmentFunnelAPIView (CandidateRank-based).
        If it fails for any reason, fall back to a simple pipeline-based funnel over CandidatePipeline.
        """
        # Try existing dashboard funnel first
        try:
            view = RecruitmentFunnelAPIView.as_view()
            response = view(request._request)
            if 200 <= response.status_code < 300:
                return Response(
                    {"intent": "funnel_query", "funnel": response.data},
                    status=response.status_code,
                )
        except Exception:
            # Fall back to pipeline-based funnel below
            pass

        # Fallback funnel using CandidatePipeline.current_stage
        funnel = {}
        for stage_value, _ in CandidatePipeline._meta.get_field(
            "current_stage"
        ).choices:
            count = CandidatePipeline.objects.filter(current_stage=stage_value).count()
            funnel[stage_value] = count

        return Response(
            {
                "intent": "funnel_query",
                "funnel": funnel,
                "source": "pipeline_fallback",
            },
            status=status.HTTP_200_OK,
        )

