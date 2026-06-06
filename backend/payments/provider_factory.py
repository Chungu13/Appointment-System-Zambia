from django.conf import settings

from payments.providers.base import BasePaymentProvider


def get_provider() -> BasePaymentProvider:
    provider_name = getattr(settings, "PAYMENT_PROVIDER", "mock")
    if provider_name == "lipila":
        from payments.providers.lipila import LipilaProvider
        return LipilaProvider()
    from payments.providers.mock import MockPaymentProvider
    return MockPaymentProvider()
