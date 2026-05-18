import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
try:
    from dotenv import load_dotenv  # type: ignore
    env_path = BASE_DIR / '.env'
    result = load_dotenv(env_path)  # Explicitly point to .env file
    if result:
        print(f"[SETTINGS] Successfully loaded .env from {env_path}")
    else:
        print(f"[SETTINGS] .env file not found at {env_path}")
except Exception as e:
    # python-dotenv not installed; env vars can still be provided by OS/host
    print(f"[SETTINGS] Error loading .env: {e}")
    pass


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-u&9pi^=v(*69x^^$bjk^vokl9(+#u&7+u16m%o)y19*(jc5@+m')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# Set ALLOWED_HOSTS in Railway's environment variables dashboard.
# Default to localhost for local development.
ALLOWED_HOSTS_STR = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(',') if host.strip()]

# Add wildcard subdomain support for the platform domain.
# `.1rockstarsocial.com` matches every subdomain: sarah-party.1rockstarsocial.com, etc.
PLATFORM_DOMAIN = os.getenv('PLATFORM_DOMAIN', '1rockstarsocial.com')
if PLATFORM_DOMAIN not in ('localhost', '127.0.0.1'):
    ALLOWED_HOSTS.append(f'.{PLATFORM_DOMAIN}')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'storages',  # For S3 storage
    'birthdayapi',
]

# REMOVED: Old CORS_ORIGIN_WHITELIST syntax (conflicts with CORS_ALLOWED_ORIGINS)
# CORS_ORIGIN_WHITELIST = (
#     'http://localhost:3000',
#     'http://localhost:8000'
# )

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files on Heroku
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'birthday.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'birthday.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

# Database configuration - use PostgreSQL on Heroku, SQLite for local development
if os.getenv('DATABASE_URL'):
    import dj_database_url  # type: ignore
    DATABASES = {
        'default': dj_database_url.config(default=os.getenv('DATABASE_URL'))
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise for serving static files on Heroku/Render
# Using CompressedStaticFilesStorage instead of CompressedManifestStaticFilesStorage
# to avoid manifest file issues on Render
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'birthday.authentication.FirebaseAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ── Stripe ──────────────────────────────────────────────────────────────────
# Set these in Railway's environment variables dashboard — never commit real keys.
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')
# Create three products in your Stripe dashboard and paste their Price IDs here.
STRIPE_PRICE_IDS = {
    'self_service': os.getenv('STRIPE_PRICE_SELF_SERVICE', ''),
    'guided': os.getenv('STRIPE_PRICE_GUIDED', ''),
    'full_service': os.getenv('STRIPE_PRICE_FULL_SERVICE', ''),
}

# ── CORS ─────────────────────────────────────────────────────────────────────
# Parse explicit CORS origins from environment variable (comma-separated).
# Default to localhost for development.
CORS_ORIGINS_STR = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000'
)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_STR.split(',') if origin.strip()]

# Also allow any subdomain of the platform (e.g. sarah-party.1rockstarsocial.com).
# This uses a regex pattern so we don't have to list every customer subdomain.
import re as _re
CORS_ALLOWED_ORIGIN_REGEXES = [
    _re.compile(r'^https://[\w-]+\.' + _re.escape(PLATFORM_DOMAIN) + r'$'),
    _re.compile(r'^http://[\w-]+\.localhost(:\d+)?$'),  # local dev subdomains
]

CORS_ALLOW_CREDENTIALS = True

# Explicitly allow Authorization header
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

# Media files settings
# Use S3 if AWS credentials are provided, otherwise use local storage
USE_S3 = os.getenv('USE_S3', 'False').lower() == 'true'
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN', f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com')

if USE_S3 and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    # Use S3 for media files
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
    
    # S3 settings
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_FILE_OVERWRITE = False
    AWS_QUERYSTRING_AUTH = False
    
    # Optional: Use a subdirectory in the bucket
    AWS_LOCATION = 'media'
else:
    # Use local storage (development or when S3 is not configured)
    MEDIA_URL = '/media/'
    
    # Use Railway volume mount if available, otherwise use project directory
    # Railway volumes are typically mounted at /media
    if os.path.exists('/media') and os.path.isdir('/media'):
        MEDIA_ROOT = '/media'
    else:
        MEDIA_ROOT = BASE_DIR / 'media'

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'birthdayapi': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
