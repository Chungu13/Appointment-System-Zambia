from django.contrib import admin
from django.conf import settings
from django.http import JsonResponse
from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve
from strawberry.django.views import GraphQLView
from beautybook.schema_public import schema as public_schema
from payments.views import mock_pay
from payments.webhook_views import payment_webhook


def health(request):
    return JsonResponse({"status": "ok"})


# Public schema URLs (tenant registration, landing page, etc.)
urlpatterns = [
    path("health/", health),
    path("admin/", admin.site.urls),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=public_schema))),
    path("payments/mock-pay/<str:transaction_ref>/", mock_pay, name="mock_pay"),
    path("payments/webhook/<str:transaction_ref>/", payment_webhook, name="payment_webhook"),
    # Serve uploaded media files from the public domain (api.kimawa.pro/media/...)
    re_path(r"^media/(?P<path>.+)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
