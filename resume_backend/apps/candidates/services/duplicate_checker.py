from __future__ import annotations

import re
from typing import Optional
from apps.candidates.models import Candidate

# Compile regex for performance
_PHONE_DIGIT_REGEX = re.compile(r"\D+")


def _normalize_email(email: Optional[str]) -> Optional[str]:
    if not email:
        return None
    return email.strip().lower() or None


def _normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    digits = _PHONE_DIGIT_REGEX.sub("", phone)
    # Take only the last 10 digits to handle country codes
    if len(digits) > 10:
        digits = digits[-10:]
    return digits or None


def find_existing_candidate(email: Optional[str], phone: Optional[str]) -> Optional[Candidate]:
    """Find existing candidate by email or phone with optimized queries."""
    normalized_email = _normalize_email(email)
    phone_digits = _normalize_phone(phone)

    # Try email first (indexed lookup)
    if normalized_email:
        candidate = Candidate.objects.filter(email__iexact=normalized_email).first()
        if candidate:
            return candidate

    # Optimized phone lookup using database-level filtering
    if phone_digits:
        # Get candidates with similar phone length and extract last 10 digits
        # This avoids loading all candidates into memory
        candidates = Candidate.objects.exclude(phone__isnull=True).exclude(phone="")
        
        # Use annotation to extract last 10 digits at database level
        from django.db.models import Func, Value, CharField
        class ExtractLast10(Func):
            function = 'RIGHT'
            output_field = CharField()
        
        candidates = candidates.annotate(
            phone_last10=ExtractLast10('phone', Value(10))
        ).filter(phone_last10=phone_digits)
        
        return candidates.first()

    return None

