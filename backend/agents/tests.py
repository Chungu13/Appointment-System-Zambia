import pytest

from agents.booking.handlers import _calculate_customer_total


@pytest.mark.parametrize("deposit_zmw,expected_total", [
    (0, 0),
    (10, 12),
    (37, 43),
    (50, 58),
    (63, 73),
    (100, 115),
    (250, 286),
])
def test_calculate_customer_total_matches_expected_gross_up(deposit_zmw, expected_total):
    assert _calculate_customer_total(deposit_zmw) == expected_total


def test_calculate_customer_total_never_charges_less_than_the_deposit():
    for deposit in (10, 25, 47, 63, 99, 250):
        assert _calculate_customer_total(deposit) >= deposit


def test_calculate_customer_total_is_a_whole_kwacha_amount():
    assert isinstance(_calculate_customer_total(37), int)
