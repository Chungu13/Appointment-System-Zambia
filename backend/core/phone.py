import re

# Valid Zambian mobile network prefixes (first 2 digits after stripping country code / leading zero)
# MTN: 76, 96 | Airtel: 57, 77, 97 | Zamtel: 95
_ZAMBIAN_PREFIXES = {"76", "96", "57", "77", "97", "95"}


def is_valid_zambian_phone(phone: str) -> bool:
    """
    Returns True if the number is a valid Zambian mobile number with a
    recognised network prefix (MTN, Airtel, or Zamtel).
    Accepts: 0XXXXXXXXX / 260XXXXXXXXX / +260XXXXXXXXX.
    """
    cleaned = re.sub(r"\D", "", phone.strip())
    if cleaned.startswith("260") and len(cleaned) == 12:
        cleaned = cleaned[3:]
    elif cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = cleaned[1:]
    # cleaned should now be exactly 9 digits
    if len(cleaned) != 9:
        return False
    return cleaned[:2] in _ZAMBIAN_PREFIXES


def normalise_phone(phone: str) -> str:
    """
    Normalise a Zambian number to +260XXXXXXXXX (E.164).
    Accepts: 0971234567 / 260971234567 / +260971234567.
    Returns the original string unchanged if it doesn't match any known format.
    """
    digits = re.sub(r"\D", "", phone.strip())
    if digits.startswith("260") and len(digits) == 12:
        return "+" + digits
    if digits.startswith("0") and len(digits) == 10:
        return "+260" + digits[1:]
    return phone.strip()


def build_phone_variants(phone: str) -> list[str]:
    """
    Return all plausible normalised forms of a Zambian number for DB lookup.
    Covers the four common representations: +260..., 260..., 0..., and raw digits.
    """
    digits = re.sub(r"\D", "", phone.strip())
    variants = {phone.strip(), digits}
    if digits.startswith("260") and len(digits) == 12:
        variants.add("0" + digits[3:])
        variants.add("+" + digits)
    elif digits.startswith("0") and len(digits) == 10:
        variants.add("260" + digits[1:])
        variants.add("+260" + digits[1:])
    return list(filter(None, variants))
