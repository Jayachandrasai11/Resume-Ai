import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.ranking.services.matching_engine import matching_engine
import sys

print('===== Testing with threshold=0.2 (default for deep search) =====', flush=True)

job_id = 29
limit = 50
threshold = 0.2  # Default threshold used in MatchCandidates.jsx for deep search
mode = 'semantic'  # deep search mode

results = matching_engine.match_by_job_id(
    job_id=job_id,
    limit=limit,
    threshold=threshold,
    strategy='cosine',
    mode=mode
)

print(f'Results count with threshold={threshold}: {len(results)}', flush=True)

if not results:
    print('No results returned - trying with lower threshold...', flush=True)
    # Try with threshold=0.0
    results2 = matching_engine.match_by_job_id(
        job_id=job_id,
        limit=limit,
        threshold=0.0,
        strategy='cosine',
        mode=mode
    )
    print(f'Results count with threshold=0.0: {len(results2)}', flush=True)
    if results2:
        print(f'Sample score: {results2[0].get("similarity_score")}', flush=True)

print('===== Done =====', flush=True)