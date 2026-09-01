# Security

Please do not open public issues for security vulnerabilities.

Use [GitHub private vulnerability reporting](https://github.com/rickknowlton/quorum/security/advisories/new) on this repository.

Include enough detail to reproduce the issue. Do not include live production credentials in the report.

Quorum does not use the Supabase Data API or browser Postgres clients. Application tables have row-level security enabled with no policies, and privileges are revoked from `anon` and `authenticated`. Access is only through the server-side Drizzle connection.
