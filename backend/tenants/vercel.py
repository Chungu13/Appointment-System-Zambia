import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# Vercel API error codes that mean the domain is already on the project.
_ALREADY_EXISTS_CODES = {"domain_already_exists", "project_domain_already_exists"}


def add_vercel_domain(subdomain: str) -> None:
    """
    Add {subdomain}.{VERCEL_APP_DOMAIN} to the Vercel project via the Vercel API.

    Never raises — a Vercel failure logs an error but must not block tenant creation.
    """
    token = getattr(settings, "VERCEL_API_TOKEN", "")
    project_id = getattr(settings, "VERCEL_PROJECT_ID", "")
    team_id = getattr(settings, "VERCEL_TEAM_ID", "")
    app_domain = getattr(settings, "VERCEL_APP_DOMAIN", "kimawa.pro")

    if not token or not project_id:
        logger.warning(
            "add_vercel_domain: VERCEL_API_TOKEN or VERCEL_PROJECT_ID not configured — skipping."
        )
        return

    domain_name = f"{subdomain}.{app_domain}"
    url = f"https://api.vercel.com/v10/projects/{project_id}/domains"
    params = {"teamId": team_id} if team_id else {}

    try:
        resp = requests.post(
            url,
            params=params,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={"name": domain_name},
            timeout=10,
        )

        if resp.status_code in (200, 201):
            logger.info("add_vercel_domain: %s added to Vercel project.", domain_name)
            return

        try:
            body = resp.json()
        except Exception:
            body = {"raw": resp.text}

        error_code = body.get("error", {}).get("code", "")
        if resp.status_code == 409 or error_code in _ALREADY_EXISTS_CODES:
            logger.info(
                "add_vercel_domain: %s already exists on Vercel project — OK.", domain_name
            )
            return

        logger.error(
            "add_vercel_domain: unexpected response %s for %s: %s",
            resp.status_code,
            domain_name,
            body,
        )

    except Exception as exc:
        logger.error("add_vercel_domain: request failed for %s: %s", domain_name, exc)
