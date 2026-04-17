from apps.pipeline.models import CandidatePipeline
from apps.pipeline.services.notification_service import send_stage_notification

def update_candidate_stage(pipeline, new_stage, notes=''):
    """
    Update an existing pipeline's stage and notify candidate.
    """
    old_stage = pipeline.current_stage
    
    # Update the stage
    pipeline.current_stage = new_stage
    if notes:
        pipeline.notes = notes
    pipeline.save()
    
    # Send email notification if stage changed
    if old_stage != new_stage:
        send_stage_notification(pipeline.candidate, pipeline.job, new_stage, notes)
        
    return pipeline

def set_candidate_stage(candidate_id, job_id, new_stage, notes=''):
    """
    Get or create a pipeline for candidate-job pair, and set its stage.
    """
    pipeline, created = CandidatePipeline.objects.get_or_create(
        candidate_id=candidate_id,
        job_id=job_id,
        defaults={'current_stage': new_stage, 'notes': notes}
    )
    
    if not created:
        return update_candidate_stage(pipeline, new_stage, notes), False
        
    # If created, send notification
    send_stage_notification(pipeline.candidate, pipeline.job, new_stage, notes)
    return pipeline, True
