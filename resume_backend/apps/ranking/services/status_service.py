import logging
from typing import Dict, Optional
import time

logger = logging.getLogger(__name__)

class MatchingStatusService:
    """
    Singleton service to track the status of matching tasks.
    Used to prevent redundant AI calls and provide polling signals to the frontend.
    """
    _instance = None
    # Dict mapping job_id -> {status, start_time, last_update}
    _statuses: Dict[int, dict] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def set_status(self, job_id: int, status: str, step: Optional[str] = None):
        """Update the status of a matching task."""
        self._statuses[job_id] = {
            "status": status,
            "step": step or status,
            "timestamp": time.time(),
            "updated_at": time.strftime("%H:%M:%S")
        }
        logger.info(f"Job {job_id} status updated to: {status} ({step})")

    def get_status(self, job_id: int) -> Optional[dict]:
        """Get the current status of a matching task."""
        status_data = self._statuses.get(job_id)
        
        # Cleanup old statuses (older than 10 minutes)
        if status_data:
            if time.time() - status_data["timestamp"] > 600:
                del self._statuses[job_id]
                return None
                
        return status_data

    def clear_status(self, job_id: int):
        """Remove status after completion or failure."""
        if job_id in self._statuses:
            del self._statuses[job_id]

# Global instance
matching_tracker = MatchingStatusService()
