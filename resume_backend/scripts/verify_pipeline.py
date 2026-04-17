import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from pipeline.models import CandidatePipeline

print("Pipeline table exists!")
print(f"Current pipeline entries: {CandidatePipeline.objects.count()}")
print("\nPipeline model structure:")
for field in CandidatePipeline._meta.get_fields():
    print(f"  - {field.name}: {field.__class__.__name__}")