# Ellis

Keep care moving. Veterinary outpatient coordination companion by Hub Animalia.

This is a local full-stack pilot: React/Vite, Express and real PostgreSQL. Personal practices and clinics have independent credentials and records. A clinic can work alone or create optional staff accounts with explicit permissions. Titles confer no access. The pilot does not replace an authoritative clinical record.

Start with [operations](docs/operations.md), [reference analysis](docs/reference-analysis.md), [design direction](docs/design-direction.md), [implementation plan](docs/implementation-plan.md), [asset inventory](docs/asset-inventory.md), and [decisions](docs/decisions.md). Release evidence and unresolved gates are in [release report](docs/release-report.md).

```sh
pnpm install --frozen-lockfile
pnpm db:local
# In another terminal, after the database is ready:
pnpm migrate
pnpm server
# In another terminal:
pnpm dev
```

Use synthetic records until production gates pass. No hosted repository/deployment or paid service is implied by this source. Deployment configuration is prepared but unverified on Vercel.
