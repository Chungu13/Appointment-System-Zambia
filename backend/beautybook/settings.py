from pathlib import Path
from decouple import config, Csv

try:
    import dj_database_url as _dj_db_url
    _HAS_DJ_DATABASE_URL = True
except ImportError:
    _HAS_DJ_DATABASE_URL = False

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ENVIRONMENT = config("ENVIRONMENT", default="development")
IS_PRODUCTION = ENVIRONMENT == "production"

ALLOWED_HOSTS = [
    ".kimawa.pro",
    ".railway.app",
    ".vercel.app",
    "localhost",
    "127.0.0.1",
    ".localhost",
]

# ---------------------------------------------------------------------------
# django-tenants
# ---------------------------------------------------------------------------
DATABASE_ROUTERS = ("django_tenants.routers.TenantSyncRouter",)

SHARED_APPS = [
    "django_tenants",
    "tenants",
    "corsheaders",

    # Django built-ins that live in the public schema
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.admin",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # staff lives in SHARED_APPS so the custom User table exists in the public
    # schema (needed for Django admin / session auth) AND in each tenant schema.
    "staff",
]

TENANT_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",

    # BeautyBook domain apps — tables isolated per tenant schema
    "staff",
    "bookings",
    "services",
    "payments",
    "agents",
]

INSTALLED_APPS = list(dict.fromkeys(SHARED_APPS + TENANT_APPS))

TENANT_MODEL = "tenants.Tenant"
TENANT_DOMAIN_MODEL = "tenants.Domain"
PUBLIC_SCHEMA_NAME = "public"

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django_tenants.middleware.main.TenantMainMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "beautybook.urls"
PUBLIC_SCHEMA_URLCONF = "beautybook.urls_public"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
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

WSGI_APPLICATION = "beautybook.wsgi.application"

# ---------------------------------------------------------------------------
# Database (PostgreSQL + django-tenants requires the tenant DB engine)
# ---------------------------------------------------------------------------
_DATABASE_URL = config("DATABASE_URL", default="")
if _DATABASE_URL and _HAS_DJ_DATABASE_URL:
    DATABASES = {"default": _dj_db_url.parse(_DATABASE_URL)}
    DATABASES["default"]["ENGINE"] = "django_tenants.postgresql_backend"
else:
    DATABASES = {
        "default": {
            "ENGINE": "django_tenants.postgresql_backend",
            "NAME": config("DB_NAME", default="beautybook_db"),
            "USER": config("DB_USER", default="beautybook_user"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }

AUTH_USER_MODEL = "staff.User"

# ---------------------------------------------------------------------------
# Auth & Password validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Localisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Lusaka"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & Media files
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
TENANT_DOMAIN_SUFFIX = config("TENANT_DOMAIN_SUFFIX", default="kimawa.pro")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.kimawa\.pro$",
    r"^https://kimawa\.pro$",
    r"^https://.*\.vercel\.app$",
    r"^http://.*\.localhost(:\d+)?$",
    r"^http://localhost(:\d+)?$",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "https://api.kimawa.pro",
    "https://kimawa.pro",
    "https://*.kimawa.pro",
    "http://localhost:8000",
    "http://glow.localhost:8000",
]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ---------------------------------------------------------------------------
# Cache (Redis db 2 — booking holds)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": config("CACHE_REDIS_URL", default="redis://localhost:6379/2"),
    },
}

# ---------------------------------------------------------------------------
# Celery (Redis broker)
# ---------------------------------------------------------------------------
PAYMENT_PROVIDER = config("PAYMENT_PROVIDER", default="mock")
OPENAI_API_KEY = config("OPENAI_API_KEY", default="")

CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/1")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
