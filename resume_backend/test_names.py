import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.ranking.services.matching_engine import matching_engine
from apps.candidates.models import Candidate

print('===== Finding candidates WITH names =====', flush=True)

# Get all candidates with names
candidates_with_names = Candidate.objects.exclude(name='').exclude(name__isnull=True)[:20]
print(f'Candidates with names (first 20):', flush=True)
for c in candidates_with_names:
    print(f'  ID={c.id}, name="{c.name}"', flush=True)

print('\n===== Testing matching to see if candidates with names are included =====', flush=True)

job_id = 29
limit = 100  # Get more results
threshold = 0.0  # No threshold to see all candidates
mode = 'semantic'

results = matching_engine.match_by_job_id(
    job_id=job_id,
    limit=limit,
    threshold=threshold,
    strategy='cosine',
    mode=mode
)

print(f'Total results: {len(results)}', flush=True)

# Count how many have names vs empty names
with_names = 0
without_names = 0
for r in results:
    if r.get('name'):
        with_names += 1
    else:
        without_names += 1

print(f'Results with names: {with_names}', flush=True)
print(f'Results without names: {without_names}', flush=True)

# Show first few with names
print('\nFirst 5 results with names:', flush=True)
count = 0
for r in results:
    if r.get('name'):
        print(f'  ID={r.get("candidate_id")}, name="{r.get("name")}", score={r.get("similarity_score")}', flush=True)
        count += 1
        if count >= 5:
            break

if count == 0:
    print('  No results with names found!', flush=True)

print('===== Done =====', flush=True)