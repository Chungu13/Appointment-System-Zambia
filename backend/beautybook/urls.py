from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import GraphQLView
from beautybook.schema_tenant import schema
from payments.views import mock_pay
from payments.webhook_views import payment_webhook

# Tenant-specific URLs (routed per-tenant subdomain)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=schema))),
    path("payments/mock-pay/<str:transaction_ref>/", mock_pay, name="mock_pay"),
    path("payments/webhook/<str:transaction_ref>/", payment_webhook, name="payment_webhook"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
