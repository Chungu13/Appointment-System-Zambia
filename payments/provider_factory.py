from django.conf import settings

from payments.providers.base import BasePaymentProvider


def get_provider() -> BasePaymentProvider:
    provider_name = getattr(settings, "PAYMENT_PROVIDER", "mock")
    if provider_name == "lenco":
        from payments.providers.lenco import LencoPaymentProvider
        return LencoPaymentProvider()
    from payments.providers.mock import MockPaymentProvider
    return MockPaymentProvider()
