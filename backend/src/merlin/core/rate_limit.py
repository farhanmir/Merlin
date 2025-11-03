"""Rate limiting configuration for API endpoints."""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_id(request: Request) -> str:
    """
    Extract user_id from request for rate limiting.

    Falls back to IP address if user is not authenticated.
    This ensures rate limits are per-user for authenticated requests
    and per-IP for unauthenticated requests (like /health).
    """
    # Check if user_id is in request state (set by auth middleware)
    user_id = getattr(request.state, "user_id", None)

    if user_id:
        return f"user:{user_id}"

    # Fallback to IP address for unauthenticated requests
    return f"ip:{get_remote_address(request)}"


# Initialize rate limiter
# Aligned with Free Tier Constraints:
# - Neon Free: 5 hours/day active time (most restrictive)
# - Render Free: 750 hours/month (sufficient for 24/7)
# - Vercel Free: 100 GB bandwidth/month
#
# Conservative limits to preserve Neon's 5-hour daily compute:
# - 30 requests/hour per user = 150 requests/day per user (5-hour workday)
# - Assumes ~30 concurrent users max (total: 4,500 req/day)
# - Keeps Neon active time under 5 hours with efficient queries
limiter = Limiter(
    key_func=get_user_id,
    default_limits=["30/hour"],  # Conservative for Neon Free Tier
    storage_uri="memory://",
)
