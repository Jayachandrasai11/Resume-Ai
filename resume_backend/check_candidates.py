import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.candidates.models import Candidate

print('Checking candidates...', flush=True)

# Check candidates 39, 42, 71 - the ones returned
for cid in [39, 42, 71]:
    try:
        c = Candidate.objects.get(id=cid)
        print(f'Candidate {cid}: name="{c.name}", email="{c.email}"', flush=True)
    except Exception as e:
        print(f'Candidate {cid}: Error - {e}', flush=True)

# Also check if there are any candidates with names
print('\nAll candidates with names:', flush=True)
candidates = Candidate.objects.all()[:5]
for c in candidates:
    print(f'  ID={c.id}, name="{c.name}", email="{c.email}"', flush=True)