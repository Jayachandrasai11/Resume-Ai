import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.ranking.services.matching_engine import matching_engine

print('===== Testing with threshold=0.2 - Detailed Results =====', flush=True)

job_id = 29
limit = 10
threshold = 0.2
mode = 'semantic'

results = matching_engine.match_by_job_id(
    job_id=job_id,
    limit=limit,
    threshold=threshold,
    strategy='cosine',
    mode=mode
)

print(f'Results count: {len(results)}', flush=True)

for i, r in enumerate(results[:10]):
    name = r.get('name', 'EMPTY')
    score = r.get('similarity_score', 0)
    pct = r.get('match_percentage', 0)
    cid = r.get('candidate_id', 'N/A')
    print(f'{i+1}. ID={cid}, name="{name}", score={score}, pct={pct}%', flush=True)

print('===== Done =====', flush=True)