"""
WSGI config for resume_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
import sys

# 🛡️ PRODUCTION RAM GUARD: Force single thread before Django loads
# This drastically reduces RAM usage during AI matching on 512MB hosts.
try:
    import torch
    torch.set_num_threads(1)
except ImportError:
    pass

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')

application = get_wsgi_application()
