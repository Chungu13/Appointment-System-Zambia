# KIMAWA

A multi-tenant salon booking SaaS built for Zambia. Salon owners get their own subdomain, isolated database schema, and a full booking + payment + AI-agent stack out of the box.

---

## What it does

- **Customer booking** - browse services, check live availability, and book an appointment through an AI chat agent that collects a mobile money deposit
- **Owner dashboard** - view upcoming appointments, revenue, no-shows, and AI-generated weekly digests
- **Staff view** - today's schedule with live status updates
- **AI agents** - GPT-4o-mini–powered agents handle booking conversations and write weekly business insights. A scheduling agent (waitlist backfill) and a payment agent (deposit chasing) also exist in `agents/` but aren't wired into any scheduled task yet - see [Known gaps](#known-gaps)
- **Automated tasks** - Celery beat runs reminders, no-show detection, trial expiry, and expiry of unpaid pending bookings on schedules
- **WhatsApp notifications** - booking confirmations, reminders, and cancellations are sent to customers over WhatsApp
- **Sign up** - email/password or Google Sign-In, protected by Cloudflare Turnstile bot detection

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Django 6, django-tenants (multi-schema PostgreSQL) |
| API | Strawberry GraphQL |
| Auth | JWT via PyJWT (stateless, Bearer token), Google OAuth |
| AI agents | OpenAI GPT-4o-mini with tool use |
| Task queue | Celery + Redis (beat scheduler) |
| Payments | Abstraction layer - mock provider by default; **Lipila** for live mobile money deposits/disbursements in production |
| Notifications | Booking events are posted to an **n8n** workflow, which sends the customer-facing message over the **WhatsApp Cloud API** |
| Bot protection | Cloudflare Turnstile (signup form) |
| Frontend | React 18 + Vite, Apollo Client, Tailwind CSS v4 |
| PWA | vite-plugin-pwa (installable, offline-ready manifest) |
| Database | PostgreSQL 15 |
| Cache/broker | Redis 7 |
| Containers | Docker + Docker Compose (local dev) |

---

## Production architecture

Local dev runs entirely in Docker Compose (below), but the live deployment is split across several platforms:

| Piece | Where it runs | Notes |
|---|---|---|
| Backend (Django, GraphQL, Celery worker + beat) | **Railway** | One service per process (web, worker, beat), plus managed Postgres and Redis |
| Frontend (React PWA) | **Vercel** | Each tenant gets its own subdomain (`<salon>.kimawa.pro`), auto-provisioned via the Vercel API on signup |
| WhatsApp messaging | **n8n** (self-hosted, on Railway) → **WhatsApp Cloud API** | Django never talks to WhatsApp directly - it POSTs a booking event to n8n, which formats and sends the WhatsApp message |
| Mobile money deposits | **Lipila** | Collects the customer's deposit and disburses the salon's share; webhook is HMAC-verified (`LIPILA_WEBHOOK_SECRET`) and idempotent on transaction ID |

---

## Running locally

### Prerequisites

- Docker Desktop
- A subdomain entry in your hosts file (or use a wildcard DNS):
  ```
  # /etc/hosts  (or C:\Windows\System32\drivers\etc\hosts on Windows)
  127.0.0.1  glow.localhost
  ```

### Setup

1. **Clone and configure environment**
   ```bash
   git clone <repo-url>
   cd beautybook-zm
   cp .env.example .env
   # Edit .env — set SECRET_KEY, DB_PASSWORD, OPENAI_API_KEY at minimum
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```
   On first boot the entrypoint automatically:
   - Runs `migrate_schemas` to create the public schema and all tenant schemas
   - Seeds a test tenant (`glow_salon`) with an owner account

3. **Access the app**

   | URL | What it is |
   |---|---|
   | `http://localhost:3000` | React PWA frontend |
   | `http://glow.localhost:8000/graphql/` | Tenant GraphQL API + GraphiQL |
   | `http://localhost:8000/graphql/` | Public GraphQL (health check only) |

### Seed credentials (development only)

After first boot the `glow_salon` tenant is seeded with:
- **Owner:** `owner` / `owner123`
- **Staff:** `alice` / `staff123`

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | Django secret key — use a long random string in production |
| `DEBUG` | Yes | `True` for dev, `False` for production |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `OPENAI_API_KEY` | Yes | Powers all four AI agents |
| `PAYMENT_PROVIDER` | Yes | `mock` (default) or `lipila` |
| `LIPILA_API_KEY` | When using Lipila | API key from the Lipila dashboard |
| `LIPILA_ENV` | When using Lipila | `sandbox` or `production` |
| `LIPILA_BASE_URL` | When using Lipila | Lipila API base URL |
| `LIPILA_CALLBACK_URL` | When using Lipila | Public URL Lipila calls back to on payment/disbursement events |
| `LIPILA_WEBHOOK_SECRET` | When using Lipila | Shared secret used to HMAC-verify incoming Lipila webhooks |
| `N8N_WEBHOOK_BASE_URL` | For WhatsApp notifications | Base URL of the n8n instance that sends WhatsApp messages |
| `N8N_WEBHOOK_SECRET` | For WhatsApp notifications | Shared secret sent with each dispatched booking event |
| `TURNSTILE_SECRET_KEY` | For signup bot protection | Cloudflare Turnstile secret key |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For Google Sign-In | OAuth credentials from the Google Cloud Console |
| `VERCEL_API_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` | For auto-provisioning tenant subdomains | Used to create a new subdomain on Vercel when a salon signs up |

---

## Project structure

```
beautybook-zm/
├── backend/                  # Django + GraphQL + Celery
│   ├── agents/               # AI agents (booking, scheduling, payment, insights) + Celery tasks
│   ├── bookings/             # Appointment, Customer, Waitlist models + GraphQL mutations
│   ├── notifications/        # Dispatches booking events to n8n for WhatsApp messaging
│   ├── payments/             # Payment model, provider abstraction (Lipila/mock), webhook
│   ├── services/             # Service and StaffService models
│   ├── staff/                # Custom User model, WorkingHours, auth mutations
│   ├── tenants/               # Tenant + Domain models (django-tenants)
│   ├── core/                  # Shared utilities (phone validation, timezone formatting)
│   ├── beautybook/            # Django project — settings, URLs, Celery, JWT auth
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile            # Python/Django image
│   ├── entrypoint.sh
│   └── .env.example
├── frontend/                 # React PWA (Vite, Apollo, Tailwind v4)
│   └── src/
│       ├── pages/            # Booking, Owner, Staff page components
│       ├── App.jsx           # Router + ApolloProvider
│       └── apollo.js         # GraphQL client config
├── docker-compose.yml
└── README.md
```

---

## Celery scheduled tasks

| Task | Schedule | Description |
|---|---|---|
| `expire_pending_payments` | Every 15 min | Marks unpaid bookings as expired once the 10-minute payment window closes |
| `send_appointment_reminders` | Daily 6 pm CAT | Sends a WhatsApp reminder (via n8n) for tomorrow's confirmed appointments | not yet active
| `detect_no_shows` | Every 30 min | Auto-marks overdue confirmed appointments as no-show |
| `check_trial_expiry` | Daily 1 am CAT | Deactivates tenants whose free trial has ended | Not yet active
| `send_weekly_digest` | Monday 2 am CAT | InsightsAgent generates a weekly summary for each owner |
| `cleanup_reference_images` | Daily 3 am CAT | Deletes customer-uploaded reference photos off finished/abandoned appointments |

---

## Known gaps

- **`SchedulingAgent`** (`agents/scheduling_agent.py`) — matches waitlisted customers to newly-cancelled slots and notifies them. Fully implemented but never instantiated anywhere; there's no Celery task or mutation that calls it. Customers can still join a `Waitlist` entry, but nothing currently acts on it.
- **`PaymentAgent`** (`agents/payment_agent.py`) — has a `chase_deposits()` method meant to remind customers with unpaid deposits before cancelling. Also never called. The only live task touching unpaid bookings is `expire_pending_payments`, which silently expires them after 10 minutes with no reminder sent.

---

## Adding a new tenant

```python
# From the Django shell (docker-compose exec web python manage.py shell)
from tenants.models import Tenant, Domain

t = Tenant(schema_name="salon_name", business_name="My Salon", on_trial=True)
t.save()
Domain.objects.create(domain="salonname.localhost", tenant=t, is_primary=True)
```

---

## License

MIT
