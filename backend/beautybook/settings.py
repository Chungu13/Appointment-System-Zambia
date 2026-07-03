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

    # Outgoing webhook notifications — no models, shared across all tenants
    "notifications",
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
    DATABASES["default"]["CONN_MAX_AGE"] = 60
else:
    DATABASES = {
        "default": {
            "ENGINE": "django_tenants.postgresql_backend",
            "NAME": config("DB_NAME", default="beautybook_db"),
            "USER": config("DB_USER", default="beautybook_user"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
            "CONN_MAX_AGE": 60,
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
MEDIA_ROOT = Path(config("MEDIA_ROOT", default=str(BASE_DIR / "backend" / "media")))
MEDIA_BASE_URL = config("MEDIA_BASE_URL", default="")
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20 MB — allows base64 image uploads
MEDIA_MAX_SIZE_MB = config("MEDIA_MAX_SIZE_MB", default=10, cast=int)
DATA_UPLOAD_MAX_NUMBER_FIELDS = 100

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
TENANT_DOMAIN_SUFFIX     = config("TENANT_DOMAIN_SUFFIX",     default="kimawa.pro")
TENANT_API_DOMAIN_SUFFIX = config("TENANT_API_DOMAIN_SUFFIX", default=f"api.{config('TENANT_DOMAIN_SUFFIX', default='kimawa.pro')}")
# Frontend subdomain base — always kimawa.pro regardless of what TENANT_DOMAIN_SUFFIX is set to on Railway.
TENANT_FRONTEND_DOMAIN   = config("TENANT_FRONTEND_DOMAIN",   default="kimawa.pro")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[\w-]+\.kimawa\.pro$",   # any slug.kimawa.pro (frontend + API subdomains)
    r"^https://kimawa\.pro$",           # apex domain
    r"^https://www\.kimawa\.pro$",      # www
    r"^http://localhost:\d+$",          # local dev
    r"^http://[\w-]+\.localhost:\d+$",  # tenant local dev (slug.localhost:3000)
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
        "LOCATION": config("CACHE_REDIS_URL", default=config("REDIS_URL", default="redis://localhost:6379")),
    },
}

# ---------------------------------------------------------------------------
# Celery (Redis broker)
# ---------------------------------------------------------------------------
PAYMENT_PROVIDER = config("PAYMENT_PROVIDER", default="mock")
OPENAI_API_KEY   = config("OPENAI_API_KEY",   default="")

# ---------------------------------------------------------------------------
# Lipila payment provider
# ---------------------------------------------------------------------------
LIPILA_API_KEY      = config("LIPILA_API_KEY",      default="")
LIPILA_ENV          = config("LIPILA_ENV",          default="sandbox")
LIPILA_BASE_URL     = config("LIPILA_BASE_URL",     default="")
LIPILA_CALLBACK_URL = config("LIPILA_CALLBACK_URL", default="")

# ---------------------------------------------------------------------------
# n8n outgoing webhooks (booking event notifications)
# ---------------------------------------------------------------------------
N8N_WEBHOOK_BASE_URL = config("N8N_WEBHOOK_BASE_URL", default="")
N8N_WEBHOOK_SECRET   = config("N8N_WEBHOOK_SECRET",   default="")

# ---------------------------------------------------------------------------
# Vercel API (auto-provision tenant subdomains on registration)
# ---------------------------------------------------------------------------
VERCEL_API_TOKEN  = config("VERCEL_API_TOKEN",  default="")
VERCEL_PROJECT_ID = config("VERCEL_PROJECT_ID", default="")
VERCEL_TEAM_ID    = config("VERCEL_TEAM_ID",    default="")
VERCEL_APP_DOMAIN = config("VERCEL_APP_DOMAIN", default="kimawa.pro")

DEFAULT_FROM_EMAIL   = config("DEFAULT_FROM_EMAIL",   default="hello@kimawa.pro")
ADMIN_EMAIL          = config("ADMIN_EMAIL",          default="admin@kimawa.pro")
TURNSTILE_SECRET_KEY = config("TURNSTILE_SECRET_KEY", default="")
API_BASE_URL         = config("API_BASE_URL",         default="http://localhost:8000")
APP_BASE_URL       = config("APP_BASE_URL",       default="http://localhost:3000")
GOOGLE_CLIENT_ID     = config("GOOGLE_CLIENT_ID",     default="")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET", default="")

CELERY_BROKER_URL        = config("CELERY_BROKER_URL",     default=config("REDIS_URL", default="redis://localhost:6379/0"))
CELERY_RESULT_BACKEND    = config("CELERY_RESULT_BACKEND", default=config("REDIS_URL", default="redis://localhost:6379/1"))
CELERY_ACCEPT_CONTENT    = ["json"]
CELERY_TASK_SERIALIZER   = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE          = TIME_ZONE
CELERY_TASK_COMPRESSION  = "gzip"
CELERY_RESULT_EXPIRES    = 3600

# ---------------------------------------------------------------------------
# Email (Resend HTTP API — bypasses SMTP, works on Railway)
# ---------------------------------------------------------------------------
RESEND_API_KEY = config("RESEND_API_KEY", default="")

# ---------------------------------------------------------------------------
# Logging — INFO from our own code, WARNING from Django internals
# Railway captures stdout, so StreamHandler is all we need.
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "[{levelname}] {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        # Our app modules — show INFO and above
        "beautybook":     {"handlers": ["console"], "level": "INFO",    "propagate": False},
        "agents":         {"handlers": ["console"], "level": "INFO",    "propagate": False},
        "bookings":       {"handlers": ["console"], "level": "INFO",    "propagate": False},
        "tenants":        {"handlers": ["console"], "level": "INFO",    "propagate": False},
        "notifications":  {"handlers": ["console"], "level": "INFO",    "propagate": False},
        "payments":       {"handlers": ["console"], "level": "INFO",    "propagate": False},
        "staff":          {"handlers": ["console"], "level": "INFO",    "propagate": False},
        # Django internals — WARNING only to keep logs clean
        "django":         {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}
