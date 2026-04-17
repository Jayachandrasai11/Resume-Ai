import re


def validate_password_strength(password: str) -> None:
    """
    Enforce strong password rules:
    - min 8 chars
    - at least 1 uppercase letter
    - at least 1 number
    - at least 1 symbol
    """
    pwd = "" if password is None else str(password)
    errors = []

    if len(pwd) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", pwd):
        errors.append("Password must contain at least 1 uppercase letter.")
    if not re.search(r"[0-9]", pwd):
        errors.append("Password must contain at least 1 number.")
    if not re.search(r"[^A-Za-z0-9]", pwd):
        errors.append("Password must contain at least 1 symbol.")

    if errors:
        raise ValueError(" ".join(errors))

