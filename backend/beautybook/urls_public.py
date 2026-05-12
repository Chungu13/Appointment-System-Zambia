from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import GraphQLView
from beautybook.schema_public import schema as public_schema
from payments.views import mock_pay
from payments.webhook_views import payment_webhook

# Public schema URLs (tenant registration, landing page, etc.)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=public_schema))),
    path("payments/mock-pay/<str:transaction_ref>/", mock_pay, name="mock_pay"),
    path("payments/webhook/<str:transaction_ref>/", payment_webhook, name="payment_webhook"),
]
