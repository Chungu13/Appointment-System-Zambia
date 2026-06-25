from django.contrib import admin
from django.conf import settings
from django.http import JsonResponse
from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve
from strawberry.django.views import GraphQLView
from beautybook.schema_public import schema as public_schema
from payments.webhooks import payment_webhook
from tenants.auth_views import verify_email, google_auth_view, resend_verification


def health(request):
    return JsonResponse({"status": "ok"})


# Public schema URLs (tenant registration, landing page, etc.)
urlpatterns = [
    path("health/", health),
    path("admin/", admin.site.urls),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=public_schema))),
    path("webhooks/lipila/", payment_webhook, name="lipila_webhook"),
    path("auth/verify-email/", verify_email, name="verify_email"),
    path("auth/google/", google_auth_view, name="google_auth"),
    path("auth/resend-verification/", resend_verification, name="resend_verification"),
    # Serve uploaded media files from the public domain (api.kimawa.pro/media/...)
    re_path(r"^media/(?P<path>.+)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
