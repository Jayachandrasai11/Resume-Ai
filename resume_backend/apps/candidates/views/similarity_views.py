"""
API views for resume similarity detection.
"""

import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers_similarity import (
    FindSimilarCandidatesRequestSerializer,
    MarkDuplicateRequestSerializer,
    MarkDuplicateResponseSerializer,
    SimilarityCheckRequestSerializer,
    SimilarityCheckResponseSerializer,
    SimilarityStatisticsSerializer,
)
from ..services.similarity_detection import similarity_detection_service

logger = logging.getLogger(__name__)


class SimilarityCheckAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = SimilarityCheckRequestSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            if data.get("resume_id"):
                result = similarity_detection_service.check_resume_similarity_by_resume_id(
                    resume_id=data["resume_id"],
                    threshold=data.get("threshold", 0.90),
                    limit=data.get("limit", 5),
                    distance_metric=data.get("distance_metric", "cosine"),
                )
            else:
                result = similarity_detection_service.check_resume_similarity(
                    resume_text=data.get("resume_text", ""),
                    threshold=data.get("threshold", 0.90),
                    limit=data.get("limit", 5),
                    distance_metric=data.get("distance_metric", "cosine"),
                )

            response_serializer = SimilarityCheckResponseSerializer(result)
            logger.info(
                "Similarity check completed. Is duplicate: %s, Max similarity: %.4f",
                result.get("is_duplicate"),
                result.get("max_similarity", 0.0),
            )
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error in similarity check API: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FindSimilarCandidatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, candidate_id):
        try:
            threshold = float(request.query_params.get("threshold", 0.75))
            limit = int(request.query_params.get("limit", 5))

            if not 0.0 <= threshold <= 1.0:
                return Response({"error": "Threshold must be between 0.0 and 1.0"}, status=status.HTTP_400_BAD_REQUEST)
            if not 1 <= limit <= 20:
                return Response({"error": "Limit must be between 1 and 20"}, status=status.HTTP_400_BAD_REQUEST)

            similar_candidates = similarity_detection_service.find_all_similar_candidates(
                candidate_id=candidate_id,
                threshold=threshold,
                limit=limit,
            )

            return Response(
                {"candidate_id": candidate_id, "similar_candidates": similar_candidates, "count": len(similar_candidates)},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error("Error finding similar candidates: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SimilarityStatisticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            stats_data = similarity_detection_service.get_similarity_statistics()
            serializer = SimilarityStatisticsSerializer(stats_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error getting similarity statistics: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarkDuplicateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = MarkDuplicateRequestSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            result = similarity_detection_service.mark_duplicate_resumes(
                resume_id=data["resume_id"],
                similar_candidate_ids=data["similar_candidate_ids"],
            )
            response_serializer = MarkDuplicateResponseSerializer(result)
            logger.info("Marked %s resumes as duplicates", result.get("marked_count"))
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error marking duplicates: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

