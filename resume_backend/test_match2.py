import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.ranking.services.matching_engine import matching_engine
import logging
import sys

# Configure logging to see output
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

print('===== Starting test =====', flush=True)

# Test with very low threshold
job_id = 29
limit = 50
threshold = 0.0  # No threshold
mode = 'semantic'  # deep search

print(f'Testing match_by_job_id with job_id={job_id}, limit={limit}, threshold={threshold}, mode={mode}', flush=True)

try:
    results = matching_engine.match_by_job_id(
        job_id=job_id,
        limit=limit,
        threshold=threshold,
        strategy='cosine',
        mode=mode
    )
    print(f'Results count: {len(results)}', flush=True)
    if results:
        for i, r in enumerate(results[:5]):
            score = r.get('similarity_score', r.get('match_score', 0))
            print(f'  {i+1}. {r.get("name", "N/A")} - score: {score}', flush=True)
    else:
        print('No results returned', flush=True)
except Exception as e:
    print(f'Error: {e}', flush=True)
    import traceback
    traceback.print_exc()

print('===== Test complete =====', flush=True)