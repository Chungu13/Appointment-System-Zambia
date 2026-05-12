# BeautyBook ZM

A multi-tenant salon booking SaaS built for Zambia. Salon owners get their own subdomain, isolated database schema, and a full booking + payment + AI-agent stack out of the box.

---

## What it does

- **Customer booking** — browse services, check live availability, book an appointment, and pay a deposit via mobile money or card
- **Owner dashboard** — view upcoming appointments, revenue, no-shows, and AI-generated weekly digests
- **Staff view** — today's schedule with live status updates
- **AI agents** — GPT-4o-mini–powered agents handle booking conversations, fill cancelled slots from the waitlist, chase unpaid deposits, and write weekly business insights
- **Automated tasks** — Celery beat runs reminders, no-show detection, trial expiry, and deposit chasing on schedules

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Django 6, django-tenants (multi-schema PostgreSQL) |
| API | Strawberry GraphQL |
| Auth | JWT via PyJWT (stateless, Bearer token) |
| AI agents | OpenAI GPT-4o-mini with tool use |
| Task queue | Celery + Redis (beat scheduler) |
| Payments | Abstraction layer — mock provider by default, Lenco-ready |
| Frontend | React 18 + Vite, Apollo Client, Tailwind CSS v4 |
| PWA | vite-plugin-pwa (installable, offline-ready manifest) |
| Database | PostgreSQL 15 |
| Cache/broker | Redis 7 |
| Containers | Docker + Docker Compose |

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
| `PAYMENT_PROVIDER` | Yes | `mock` (default) or `lenco` |
| `LENCO_API_KEY` | When using Lenco | API key from the Lenco dashboard |
| `LENCO_ACCOUNT_NO` | When using Lenco | Funded Lenco account number |

---

## Project structure

```
beautybook-zm/
├── beautybook/          # Django project — settings, URLs, Celery, JWT auth
├── agents/              # AI agents (booking, scheduling, payment, insights) + Celery tasks
├── bookings/            # Appointment, Customer, Waitlist models + GraphQL mutations
├── services/            # Service and StaffService models
├── staff/               # Custom User model, WorkingHours, auth mutations
├── payments/            # Payment model, provider abstraction, webhook
├── tenants/             # Tenant + Domain models (django-tenants)
├── frontend/            # React PWA (Vite, Apollo, Tailwind v4)
│   └── src/
│       ├── pages/       # Booking, Owner, Staff page components
│       ├── App.jsx      # Router + ApolloProvider
│       └── apollo.js    # GraphQL client config
├── docker-compose.yml
├── Dockerfile           # Python/Django image
└── .env.example
```

---

## Celery scheduled tasks

| Task | Schedule | Description |
|---|---|---|
| `send_appointment_reminders` | Daily 6 pm CAT | SMS reminder for tomorrow's confirmed appointments |
| `fill_cancelled_slots` | Every 5 min | SchedulingAgent fills cancelled slots from the waitlist |
| `detect_no_shows` | Every 30 min | Auto-marks overdue confirmed appointments as no-show |
| `check_unpaid_deposits` | Every 30 min | PaymentAgent chases deposits and cancels overdue bookings |
| `check_trial_expiry` | Daily midnight CAT | Deactivates tenants whose free trial has ended |
| `send_weekly_digest` | Monday 7 am CAT | InsightsAgent generates a weekly summary for each owner |

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
