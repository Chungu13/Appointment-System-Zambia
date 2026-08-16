from decimal import Decimal, ROUND_CEILING


def calculate_customer_total(deposit_zmw: float) -> int:
    """
    What the customer pays upfront, rounded UP to the nearest whole Kwacha so
    the mobile money prompt and booking summary show a clean number (e.g.
    ZMW 58) instead of a percentage-math remainder (e.g. ZMW 57.18). Always
    rounds up (never down) so Kimawa's commission never shrinks to cover the
    rounding - at most the customer pays a few extra ngwee.
    Owner always receives deposit_zmw exactly (paid out via disbursement).
    Kimawa earns 10% commission; Lipila fees are covered by the service fee.
    """
    kimawa_fee      = deposit_zmw * 0.10
    lipila_disburse = deposit_zmw * 0.015
    subtotal        = deposit_zmw + kimawa_fee + lipila_disburse
    total           = subtotal / (1 - 0.025)   # gross up to cover 2.5% collection fee
    return int(Decimal(str(total)).quantize(Decimal("1"), rounding=ROUND_CEILING))


def clean_zmw(amount: float):
    """Whole ZMW amounts should display as e.g. 7, not 7.0 - only fall back
    to a 2dp float for the rare case a business configured a fractional
    deposit/price."""
    amount = float(amount)
    return int(amount) if amount == int(amount) else round(amount, 2)
