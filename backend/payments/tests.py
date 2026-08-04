import pytest

from payments.providers.lipila import compute_disburse_amount, compute_kimawa_net


def test_compute_disburse_amount_pays_salon_the_full_deposit():
    """Lipila charges the sender (Kimawa), not the recipient, so the salon
    receives the deposit amount exactly, with nothing deducted."""
    assert compute_disburse_amount(50) == 50.0
    assert compute_disburse_amount(37) == 37.0


@pytest.mark.parametrize("deposit_zmw,collection_amount_zmw,expected_net", [
    (50, 58, 5.8),
    (100, 115, 10.62),
    (37, 44, 5.34),
])
def test_compute_kimawa_net_deducts_both_lipila_fees_and_the_disbursement(
    deposit_zmw, collection_amount_zmw, expected_net
):
    net = compute_kimawa_net(deposit_zmw, collection_amount_zmw)
    assert net == expected_net


def test_compute_kimawa_net_is_positive_for_realistic_deposits():
    # A sanity check that Kimawa's commission/fee math doesn't go negative
    # for ordinary deposit amounts once the customer total covers the fees.
    assert compute_kimawa_net(50, 58) > 0
