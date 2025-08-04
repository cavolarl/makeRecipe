import re
from fractions import Fraction

def to_float(s):
    """Converts a string fraction like '1 1/2' or '1.5' to float."""
    try:
        if " " in s:
            whole, frac = s.split()
            return float(whole) + float(Fraction(frac))
        return float(Fraction(s))
    except:
        return None

def parse_ingredient(raw):
    raw = raw.strip()

    # Remove parenthesis and content inside
    raw = re.sub(r"\s*\([^)]*\)", "", raw)

    # Remove prefixes like "ca", "ungefär", "cirka", etc.
    raw = re.sub(r"^(ca|ungefär|cirka|drygt|hackad|skuren|finskuren)\s+", "", raw, flags=re.IGNORECASE)

    # Remove adjectives like "finhackad", "skuren", etc.
    raw = re.sub(r"^(finhackad(e)?|skuren|hackad(e)?|dubbla|enkla|tärnad(e)?|strimlad(e)?|finskuren|skurna)\s+", "", raw, flags=re.IGNORECASE)

    # Pattern to match amount, unit, and item
    match = re.match(r"^([\d\s\/.,\-]+)\s*([a-zA-ZåäöÅÄÖ%]+)?\s+(.+)$", raw)
    if not match:
        return [{"amount": None, "unit": "", "item": raw}]
    
    # TODO: Improve unit logic to only use common units, if units are not common, set unit to empty string and add the text to the ingridient name.

    amount_raw = match.group(1).strip().replace(",", ".")
    unit = match.group(2) or ""
    item = match.group(3).strip()

    # Normalize amount (handle range)
    if "-" in amount_raw:
        parts = [to_float(p.strip()) for p in amount_raw.split("-")]
        amount = max(filter(None, parts)) if parts else None
    else:
        amount = to_float(amount_raw)

    # Handle "eller" (keep first option)
    if " eller " in item:
        item = item.split(" eller ")[0].strip()
        return [{
            "amount": amount,
            "unit": unit,
            "item": item
        }]

    # Handle "och" (split into two ingredients)
    if " och " in item:
        parts = [i.strip() for i in item.split(" och ")]
        return [{
            "amount": amount,
            "unit": unit,
            "item": part
        } for part in parts]

    # Normal case
    return [{
        "amount": amount,
        "unit": unit,
        "item": item
    }]