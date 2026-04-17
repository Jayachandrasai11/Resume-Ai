from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.pipeline.models import CandidatePipeline, PipelineStage
from apps.pipeline.serializers import CandidatePipelineSerializer


class JobCandidateStatusUpdateAPIView(APIView):
    """
    Update or create a candidate's pipeline entry for a given job.

    Route: /api/job-candidate/update-status

    POST body:
    {
        "candidate_id": 1,
        "job_id": 1,
        "stage": "technical_interview",   # or "current_stage"
        "notes": "Optional notes about this move"
    }
    """

    def post(self, request, *args, **kwargs):
        candidate_id = request.data.get("candidate_id")
        job_id = request.data.get("job_id")
        # Accept both "stage" and "current_stage" for flexibility
        stage = request.data.get("stage") or request.data.get("current_stage")
        notes = request.data.get("notes", "")

        if not all([candidate_id, job_id, stage]):
            return Response(
                {
                    "detail": "candidate_id, job_id, and stage are required",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_stages = dict(PipelineStage.choices)
        if stage not in valid_stages:
            return Response(
                {
                    "detail": "Invalid stage value",
                    "valid_stages": list(valid_stages.keys()),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pipeline, created = CandidatePipeline.objects.get_or_create(
            candidate_id=candidate_id,
            job_id=job_id,
            defaults={"current_stage": stage, "notes": notes},
        )

        if not created:
            pipeline.current_stage = stage
            if notes:
                pipeline.notes = notes
            pipeline.save()

        data = CandidatePipelineSerializer(pipeline).data
        return Response(
            data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

