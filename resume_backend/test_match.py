import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

print("Starting matching test...", file=sys.stderr)

from apps.ranking.services.matching_engine import matching_engine
print("Imported matching_engine", file=sys.stderr)

# Test matching with job_id=29
job_id = 29
limit = 50
threshold = 0.2
strategy = 'cosine'
mode = 'semantic'

print(f'Testing match_by_job_id with job_id={job_id}', file=sys.stderr)

try:
    print("Calling match_by_job_id...", file=sys.stderr)
    results = matching_engine.match_by_job_id(
        job_id=job_id,
        limit=limit,
        threshold=threshold,
        strategy=strategy,
        mode=mode
    )
    print(f'Results count: {len(results)}', file=sys.stderr)
    if results:
        for i, r in enumerate(results[:3]):
            score = r.get("similarity_score", r.get("match_score", 0))
            print(f'  {i+1}. {r.get("name", "N/A")} - score: {score}', file=sys.stderr)
    else:
        print('No results returned', file=sys.stderr)
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)