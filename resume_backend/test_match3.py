import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.ranking.services.matching_engine import matching_engine

print('===== Testing with debug output =====', flush=True)

job_id = 29
limit = 5
threshold = 0.0
mode = 'semantic'

results = matching_engine.match_by_job_id(
    job_id=job_id,
    limit=limit,
    threshold=threshold,
    strategy='cosine',
    mode=mode
)

print(f'Results count: {len(results)}', flush=True)
if results:
    # Print full first result to see all fields
    print('First result (full):', json.dumps(results[0], indent=2, default=str), flush=True)
    
    # Print common fields
    for i, r in enumerate(results[:3]):
        print(f'Result {i+1}:', flush=True)
        print(f'  candidate_id: {r.get("candidate_id")}', flush=True)
        print(f'  name: {r.get("name")}', flush=True)
        print(f'  similarity_score: {r.get("similarity_score")}', flush=True)
        print(f'  match_score: {r.get("match_score")}', flush=True)
        print(f'  All keys: {list(r.keys())}', flush=True)
else:
    print('No results', flush=True)

print('===== Done =====', flush=True)