from django.contrib import admin
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.views.static import serve
from strawberry.django.views import GraphQLView
from beautybook.schema_public import schema as public_schema
from payments.webhooks import payment_webhook
from tenants.auth_views import verify_email, google_auth_view, resend_verification


def health(request):
    return JsonResponse({"status": "ok"})


@cache_page(60 * 60 * 6)  # cache 6 hours
def salon_sitemap(request):
    from tenants.models import Tenant
    tenants = Tenant.objects.filter(
        is_approved=True,
        is_active=True,
        onboarding_completed=True,
    ).exclude(schema_name="public").values_list("subdomain", flat=True)

    urls = "\n".join(
        f"  <url>\n"
        f"    <loc>https://{slug}.kimawa.pro</loc>\n"
        f"    <changefreq>weekly</changefreq>\n"
        f"    <priority>0.8</priority>\n"
        f"  </url>"
        for slug in tenants
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n"
        "</urlset>"
    )
    return HttpResponse(xml, content_type="application/xml")


# Public schema URLs (tenant registration, landing page, etc.)
urlpatterns = [
    path("health/", health),
    path("salon-sitemap.xml", salon_sitemap, name="salon_sitemap"),
    path("admin/", admin.site.urls),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=public_schema))),
    path("webhooks/lipila/", payment_webhook, name="lipila_webhook"),
    path("auth/verify-email/", verify_email, name="verify_email"),
    path("auth/google/", google_auth_view, name="google_auth"),
    path("auth/resend-verification/", resend_verification, name="resend_verification"),
    # Serve uploaded media files from the public domain (api.kimawa.pro/media/...)
    re_path(r"^media/(?P<path>.+)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
