from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve
from strawberry.django.views import GraphQLView
from beautybook.schema_tenant import schema
from payments.webhooks import payment_webhook
from agents.stream_view import chat_stream

# Tenant-specific URLs (routed per-tenant subdomain)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=schema))),
    path("chat/stream/", chat_stream, name="chat_stream"),
    path("webhooks/lipila/", payment_webhook, name="lipila_webhook"),
    # Serve uploaded media files unconditionally (works with DEBUG=False in production)
    re_path(r"^media/(?P<path>.+)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
