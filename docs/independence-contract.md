# Avenlyo App independence contract

`ismet3547/avenlyo-app` is a new product and owns its complete application boundary.

- Its database is its own Supabase project/stack (`project_id = "avenlyo-app"`), using independent local ports and Docker volumes. It must never point at the legacy Supabase project.
- Its API is the Fastify application in `apps/api`, locally on port **4001**. The web server calls only that API through `AVENLYO_APP_API_URL`.
- Its auth and application runtime belong to this repository. Supabase Auth identifies a user; current database membership authorizes workspace access.
- It does not call the legacy Avenlyo API or import legacy `@avenlyo/*` packages.
- It does not assume the legacy database schema, readiness version, billing entitlement, vertical policies or migration history.
- All future migrations belong exclusively to this repository. The foundation migration is an initial schema, not an extension of the old product.
- The older Avenlyo repository may provide architectural reference only. No legacy subsystem is vendored, linked, installed or invoked. The marketing repository is separate.

`pnpm check:independence` scans application/configuration/migration files for legacy package imports, repository dependencies and API hostnames. CI runs it with lint. Operational configuration must also use new project credentials; source scanning cannot validate a human-supplied database URL.

Milestone 1 supports manual Text/FAQ knowledge and a labeled Test Agent. Website Chat, Instagram, a customer inbox, notifications, billing, appointments, Voice/SMS and industry-specific packs are absent. Test lead records are explicitly attributed to `test_agent`.
