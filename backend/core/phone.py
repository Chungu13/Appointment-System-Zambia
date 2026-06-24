import re


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
