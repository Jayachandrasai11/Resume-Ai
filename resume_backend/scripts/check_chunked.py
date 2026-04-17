import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()
from candidates.models import Resume
print(f"Resumes with chunked=True: {Resume.objects.filter(chunked=True).count()}")
print(f"Resumes with chunked=False: {Resume.objects.filter(chunked=False).count()}")
