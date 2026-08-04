import pytest

from core.phone import build_phone_variants, is_valid_zambian_phone, normalise_phone


@pytest.mark.parametrize("phone", [
    "0971234567",   # Airtel, leading 0
    "260971234567",  # Airtel, country code, no +
    "+260971234567",  # Airtel, E.164
    "0771234567",   # Airtel
    "0951234567",   # Zamtel
    "0961234567",   # MTN
])
def test_is_valid_zambian_phone_accepts_known_network_prefixes(phone):
    assert is_valid_zambian_phone(phone) is True


@pytest.mark.parametrize("phone", [
    "0123456789",     # unrecognised prefix
    "12345",          # too short
    "0971234567890",  # too long
    "not-a-phone",    # not a number at all
])
def test_is_valid_zambian_phone_rejects_invalid_numbers(phone):
    assert is_valid_zambian_phone(phone) is False


@pytest.mark.parametrize("phone", [
    "0971234567",
    "260971234567",
    "+260971234567",
])
def test_normalise_phone_produces_e164(phone):
    assert normalise_phone(phone) == "+260971234567"


def test_normalise_phone_returns_original_when_unrecognised():
    assert normalise_phone("hello") == "hello"


def test_build_phone_variants_includes_all_common_forms():
    variants = build_phone_variants("0971234567")
    assert set(variants) == {"0971234567", "260971234567", "+260971234567"}
