import os

from datetime import timedelta  # noqa: E402
from dotenv import load_dotenv  # noqa: E402
from pathlib import Path  # noqa: E402
from decouple import config  # noqa: E402

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,.onrender.com"
).split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "pgvector",
    "rest_framework",
    "apps.candidates",
    "apps.ranking",
    "apps.jd_app",
    "apps.accounts",
    "apps.pipeline",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
]

AUTH_USER_MODEL = "accounts.CustomUser"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",  # Re-enabled: CSRF protection is critical
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "resume_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR.parent / "resume_frontend" / "dist"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": os.getenv("POSTGRES_ENGINE", "django.db.backends.postgresql"),
        "NAME": os.getenv("POSTGRES_NAME", "resume_backend"),
        "USER": os.getenv("POSTGRES_USER", "postgres"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle"
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day"
    },
    # Pagination settings
    "DEFAULT_PAGINATION_CLASS": "resume_backend.pagination.DBPageNumberPagination",
    "PAGE_SIZE": 20,
    # Caching
    "EXCEPTION_HANDLER": "apps.candidates.exceptions.custom_exception_handler",
    "DEFAULT_RENDERER_CLASSES": (
        ["rest_framework.renderers.JSONRenderer"] +
        (["rest_framework.renderers.BrowsableAPIRenderer"] if os.getenv("DEBUG") == "True" else [])
    ),
    "JSON_RENDERER_INDENT": None,
}

WSGI_APPLICATION = "resume_backend.wsgi.application"

# Caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}



# Static and media files
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR.parent / "resume_frontend" / "dist"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False") == "True"

# Production settings
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_SSL_REDIRECT = True                     # Force HTTPS in production
    SESSION_COOKIE_SECURE = True                   # Send session cookie only over HTTPS
    CSRF_COOKIE_SECURE = True                      # Send CSRF cookie only over HTTPS
    SECURE_HSTS_SECONDS = 31536000                 # 1-year HSTS header
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True          # Apply HSTS to all subdomains
    SECURE_HSTS_PRELOAD = True                     # Allow HSTS preload list inclusion
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # Trust Render's proxy

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Perplexity API Key
PPLX_API_KEY = os.getenv("PPLX_API_KEY")

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@yourcompany.com')
EMAIL_SUBJECT_PREFIX = config('EMAIL_SUBJECT_PREFIX', default='[Recruitment] ')

# Email settings for development (console backend)
if os.getenv('DEBUG', 'False') == 'True':
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Company Information for Emails
COMPANY_NAME = config('COMPANY_NAME', default='Your Company')
COMPANY_WEBSITE = config('COMPANY_WEBSITE', default='https://yourcompany.com')
COMPANY_ADDRESS = config('COMPANY_ADDRESS', default='')
COMPANY_PHONE = config('COMPANY_PHONE', default='')

# JWT Token Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = os.getenv("DEBUG", "False") == "True"  # Only allow all in Dev
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
] + [o for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
] + [o for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if o]  # Django 4+ requires scheme

# Logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "candidates": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "accounts": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
