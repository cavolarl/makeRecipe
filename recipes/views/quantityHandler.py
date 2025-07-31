import re

def normalize_quantity(text):
    """
    Converts unicode fractions, mixed number fractions, and simple fractions within a string to decimals.
    e.g., "½" -> "0.5", "2 1/2" -> "2.5", "1/2" -> "0.5"
    """
    if not text:
        return ""

    # 1. Replace unicode fractions
    unicode_map = {
        '½': '0.5', '⅓': '0.33', '⅔': '0.67', '¼': '0.25', '¾': '0.75',
        '⅕': '0.2', '⅖': '0.4', '⅗': '0.6', '⅘': '0.8', '⅙': '0.17',
        '⅚': '0.83', '⅛': '0.125', '⅜': '0.375', '⅝': '0.625', '⅞': '0.875'
    }
    processed_text = text
    for char, replacement in unicode_map.items():
        processed_text = processed_text.replace(char, replacement)

    # 2. Convert mixed fractions (e.g., "1 1/2")
    def mixed_fraction_to_float(match):
        try:
            whole = int(match.group(1))
            num = int(match.group(2))
            den = int(match.group(3))
            result = whole + (num / den)
            return str(round(result, 2)).rstrip('0').rstrip('.')
        except (ValueError, ZeroDivisionError):
            return match.group(0)
    processed_text = re.sub(r'(\d+)\s+(\d+)/(\d+)', mixed_fraction_to_float, processed_text)

    # 3. Convert simple fractions (e.g., "1/2")
    def simple_fraction_to_float(match):
        try:
            num = int(match.group(1))
            den = int(match.group(2))
            result = num / den
            return str(round(result, 2)).rstrip('0').rstrip('.')
        except (ValueError, ZeroDivisionError):
            return match.group(0)
    processed_text = re.sub(r'^\s*(\d+)/(\d+)\s*$', simple_fraction_to_float, processed_text)

    return processed_text